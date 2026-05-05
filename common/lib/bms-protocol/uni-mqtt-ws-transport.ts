import { BMS_FUNC, BmsProtocolError, buildReadFrame, parseFrame } from './frame'
import { parseBootFrame } from './boot-frame'
import {
	MqttPacketReader,
	mqttBuildConnect,
	mqttBuildDisconnect,
	mqttBuildPingReq,
	mqttBuildPublish,
	mqttBuildSubscribe,
	mqttParsePacket,
} from './mqtt'
import type { LoggerLike } from './types'

type WsSocketTaskLike = {
	onOpen: (cb: () => void) => void
	onMessage: (cb: (res: { data: unknown }) => void) => void
	onError: (cb: (err: unknown) => void) => void
	onClose: (cb: () => void) => void
}

type ReqExpect = { functionCode: number; targetAddress: number; sourceAddress: number }

function isExpectedBootSourceAddress(expectedSourceAddress: number, parsedSourceAddress: number): boolean {
	const expect = expectedSourceAddress & 0xff
	const actual = parsedSourceAddress & 0xff
	if (expect === 0x00) return true
	if (actual === expect) return true
	return expect === 0xfc && actual === 0x01
}

export type UniMqttWsBmsTransportOptions = {
	wsUrl?: string
	clientId?: string
	username?: string
	password?: string
	keepAliveSec?: number
	writeTopic?: string
	readTopic?: string
	requestTimeoutMs?: number
	minFrameIntervalMs?: number
	logger?: LoggerLike
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function defer<T>() {
	let resolve!: (value: T) => void
	let reject!: (err: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

function toUint8Array(data: unknown): Uint8Array {
	if (data instanceof Uint8Array) return data;
	if (data instanceof ArrayBuffer) return new Uint8Array(data);
	if (typeof data === 'string') {
		// 这里按 UTF-8 文本处理（多数 MQTT Broker WebSocket 会返回二进制，但也有平台会返回字符串）
		if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(data);
		const out = new Uint8Array(data.length);
		for (let i = 0; i < data.length; i += 1) out[i] = data.charCodeAt(i) & 0xff;
		return out;
	}
	// NOTE: uni-app onMessage 可能返回 ArrayBuffer / Uint8Array / number[]；这里保持兼容并在运行时兜底
	return Uint8Array.from(data as ArrayLike<number>);
}

function toArrayBuffer(u8: Uint8Array | ArrayLike<number>): ArrayBuffer {
	const bytes = u8 instanceof Uint8Array ? u8 : Uint8Array.from(u8);
	// NOTE: Uint8Array.buffer 在 TS 类型上可能是 ArrayBufferLike；这里在 uni-app 运行时为 ArrayBuffer
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function mkReqExpect(reqFrameBytes: Uint8Array | ArrayLike<number>): { expect: ReqExpect; expectBoot: boolean } {
	const req = reqFrameBytes instanceof Uint8Array ? reqFrameBytes : Uint8Array.from(reqFrameBytes);
	const expectBoot = req[0] === 0x55 && req[1] !== 0x7f;
	if (!expectBoot && req.length < 6) throw new BmsProtocolError('Invalid request frame bytes');
	if (expectBoot && req.length < 9) throw new BmsProtocolError('Invalid boot request frame bytes');
	const expect = expectBoot
		? {
				functionCode: req[3] & 0xff,
				targetAddress: req[1] & 0xff,
				sourceAddress: req[2] & 0xff,
			}
		: {
				functionCode: req[4] & 0xff,
				// BMS 回复帧：source/target 互换
				targetAddress: req[2] & 0xff,
				sourceAddress: req[3] & 0xff,
			};
	return { expect, expectBoot };
}

const SOCKET_CLOUD_READ_START = 0x0900;
const SOCKET_CLOUD_READ_END_EXCLUSIVE = 0x0924;

function isSocketCloudReadRange(startAddress: number, quantity: number): boolean {
	if (!Number.isFinite(startAddress) || !Number.isFinite(quantity) || quantity <= 0) return false;
	const endAddress = startAddress + quantity;
	return startAddress >= SOCKET_CLOUD_READ_START && endAddress <= SOCKET_CLOUD_READ_END_EXCLUSIVE;
}

function buildMqttSocketReadFrame(reqFrameBytes: Uint8Array): Uint8Array {
	if (reqFrameBytes.length < 9) return reqFrameBytes;
	if (reqFrameBytes[0] !== 0x7f || reqFrameBytes[1] !== 0x55) return reqFrameBytes;
	const func = reqFrameBytes[4] & 0xff;
	if (func !== BMS_FUNC.READ_HOLDING_REGISTERS) return reqFrameBytes;
	const sourceAddress = reqFrameBytes[2] & 0xff;
	const startAddress = (reqFrameBytes[5] << 8) | reqFrameBytes[6];
	const quantity = (reqFrameBytes[7] << 8) | reqFrameBytes[8];
	if (!isSocketCloudReadRange(startAddress, quantity)) return reqFrameBytes;
	return buildReadFrame({
		sourceAddress,
		targetAddress: 0xfa,
		functionCode: BMS_FUNC.SOCKET_READ,
		startAddress,
		quantity,
	});
}

class FrameCollector {
	private _logger?: LoggerLike
	private _buf: Uint8Array

	constructor({ logger }: { logger?: LoggerLike }) {
		this._logger = logger;
		this._buf = new Uint8Array(0);
	}

	push(bytes: Uint8Array | ArrayLike<number>) {
		const chunk = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
		const merged = new Uint8Array(this._buf.length + chunk.length);
		merged.set(this._buf, 0);
		merged.set(chunk, this._buf.length);
		this._buf = merged;
	}

	tryShiftOneValidFrame(): Uint8Array | null {
		const bytes = this._buf;
		if (bytes.length < 6) return null;

		let start = -1;
		for (let i = 0; i < bytes.length - 1; i += 1) {
			if (bytes[i] === 0x7f && bytes[i + 1] === 0x55) {
				start = i;
				break;
			}
		}
		if (start < 0) {
			this._buf = bytes.slice(Math.max(0, bytes.length - 1));
			return null;
		}
		if (start > 0) this._buf = bytes.slice(start);

		for (let j = 2; j < this._buf.length; j += 1) {
			if (this._buf[j] !== 0xfd) continue;
			const candidate = this._buf.slice(0, j + 1);
			try {
				parseFrame(candidate);
				this._buf = this._buf.slice(j + 1);
				return candidate;
				} catch (e) {
					const msg = e instanceof Error ? e.message : String(e);
					if (this._logger && this._logger.debug) this._logger.debug('[mqtt] drop invalid frame:', msg);
				}
			}
		return null;
	}

	tryShiftOneBootFrame(): Uint8Array | null {
		const bytes = this._buf;
		if (bytes.length < 9) return null;

		let start = -1;
		for (let i = 0; i < bytes.length; i += 1) {
			if (bytes[i] === 0x55) {
				start = i;
				break;
			}
		}
		if (start < 0) {
			this._buf = bytes.slice(Math.max(0, bytes.length - 1));
			return null;
		}
		if (start > 0) this._buf = bytes.slice(start);

		if (this._buf.length < 9) return null;
		const dataLen = ((this._buf[4] & 0xff) << 8) | (this._buf[5] & 0xff);
		const expectedLen = 1 + 1 + 1 + 1 + 2 + dataLen + 2 + 1;
		if (expectedLen > this._buf.length) return null;
		const candidate = this._buf.slice(0, expectedLen);
		if (candidate[candidate.length - 1] !== 0xfd) {
			this._buf = this._buf.slice(1);
			return null;
		}
		try {
			parseBootFrame(candidate);
			this._buf = this._buf.slice(expectedLen);
			return candidate;
		} catch (e) {
			this._buf = this._buf.slice(1);
			return null;
		}
	}
}

/**
 * 基于 uniapp WebSocket API 的 MQTT Transport（发送/接收 BMS 帧）
 *
 * 约定：
 * - 你配置一个 writeTopic：transport.request(frameBytes) 时 publish 到该 topic
 * - 你配置一个 readTopic：transport 会 subscribe 该 topic，收到消息后提取 payload 里的 BMS 帧并返回
 *
 * 注意：
 * - 该实现是“轻量 MQTT v3.1.1 客户端”，只支持 CONNECT/SUBSCRIBE(QoS0)/PUBLISH(QoS0)/PING
 * - 为避免并发串包，request 内部强制串行
 */
export class UniMqttWsBmsTransport {
	wsUrl: string
	clientId: string
	username?: string
	password?: string
	keepAliveSec: number
	writeTopic: string
	readTopic: string
	requestTimeoutMs: number
	minFrameIntervalMs: number
	logger: LoggerLike

	private _socketTask: WsSocketTaskLike | null
	private _connected: boolean
	private _wsOpen: boolean
	private _reader: MqttPacketReader
	private _collector: FrameCollector
	private _packetId: number
	private _pending:
		| null
		| {
				resolve: (frameBytes: Uint8Array) => void
				reject: (err: unknown) => void
				expect: ReqExpect
				timer: ReturnType<typeof setTimeout>
				expectBoot?: boolean
		  };
	private _queue: Promise<Uint8Array>
	private _lastTxAt: number
	private _keepAliveTimer: ReturnType<typeof setInterval> | null
	private _subscribed: boolean

	constructor({
		wsUrl,
		clientId,
		username,
		password,
		keepAliveSec = 30,
		writeTopic,
		readTopic,
		requestTimeoutMs = 2000,
		minFrameIntervalMs = 50,
		logger = console,
	}: UniMqttWsBmsTransportOptions = {}) {
		if (!wsUrl) throw new BmsProtocolError('wsUrl is required');
		if (!clientId) throw new BmsProtocolError('clientId is required');
		if (!writeTopic) throw new BmsProtocolError('writeTopic is required');
		if (!readTopic) throw new BmsProtocolError('readTopic is required');

		this.wsUrl = wsUrl;
		this.clientId = clientId;
		this.username = username;
		this.password = password;
		this.keepAliveSec = keepAliveSec;
		this.writeTopic = writeTopic;
		this.readTopic = readTopic;
		this.requestTimeoutMs = requestTimeoutMs;
		this.minFrameIntervalMs = minFrameIntervalMs;
		this.logger = logger;

		this._socketTask = null;
		this._connected = false; // MQTT connack ok
		this._wsOpen = false;
		this._reader = new MqttPacketReader();
		this._collector = new FrameCollector({ logger });

		this._packetId = 1;
		this._pending = null; // { resolve, reject, expect, timer }
		this._queue = Promise.resolve(new Uint8Array(0));
		this._lastTxAt = 0;
		this._keepAliveTimer = null;
		this._subscribed = false;
	}

	_nextPacketId(): number {
		const id = this._packetId & 0xffff;
		this._packetId = (this._packetId + 1) & 0xffff;
		return id === 0 ? 1 : id;
	}

	async connect(): Promise<void> {
		if (this._socketTask) return;

		this._socketTask = uni.connectSocket({
			url: this.wsUrl,
			success: () => {},
			fail: (err: unknown) => {
				this._socketTask = null;
				throw err;
			},
		});

		const task = this._socketTask;
		if (!task) return;

		task.onOpen(async () => {
			this._wsOpen = true;
			try {
				const connectPkt = mqttBuildConnect({
					clientId: this.clientId,
					keepAliveSec: this.keepAliveSec,
					username: this.username,
					password: this.password,
					cleanSession: true,
				});
				await this._sendMqtt(connectPkt);
			} catch (e) {
				this.logger && this.logger.error && this.logger.error('[mqtt] ws open handler failed:', e);
			}
		});

		task.onMessage((res: { data: unknown }) => this._onWsMessage(res));
		task.onError((err: unknown) => {
			this.logger && this.logger.error && this.logger.error('[mqtt] socket error:', err);
		});
		task.onClose(() => {
			this._cleanupOnClose();
		});

		// 等待 MQTT CONNACK + SUBACK 完成
		await this._waitConnectedAndSubscribed();
	}

	async disconnect(): Promise<void> {
		if (!this._socketTask) return;
		try {
			await this._sendMqtt(mqttBuildDisconnect());
		} catch (e) {
			// ignore
		}
		try {
			uni.closeSocket({}); // 关闭当前 socket
		} catch (e) {
			// ignore
		}
		this._cleanupOnClose();
	}

	_cleanupOnClose(): void {
		this._wsOpen = false;
		this._connected = false;
		this._subscribed = false;
		this._socketTask = null;
		this._reader = new MqttPacketReader();
		this._collector = new FrameCollector({ logger: this.logger });

		if (this._keepAliveTimer) clearInterval(this._keepAliveTimer);
		this._keepAliveTimer = null;

		if (this._pending) {
			clearTimeout(this._pending.timer);
			const rej = this._pending.reject;
			this._pending = null;
			rej(new BmsProtocolError('MQTT socket closed'));
		}
	}

	async _waitConnectedAndSubscribed(): Promise<void> {
		const start = Date.now();
		while (true) {
			if (this._connected && this._subscribed) return;
			if (Date.now() - start > 5000) throw new BmsProtocolError('MQTT connect/subscribe timeout');
			await sleep(50);
		}
	}

	async _sendMqtt(packetBytes: Uint8Array): Promise<void> {
		if (!this._socketTask) throw new BmsProtocolError('WebSocket not created');
		if (!this._wsOpen) {
			// 等待 ws open
			const start = Date.now();
			while (!this._wsOpen) {
				if (Date.now() - start > 3000) throw new BmsProtocolError('WebSocket open timeout');
				await sleep(30);
			}
		}
		return new Promise<void>((resolve, reject) => {
			uni.sendSocketMessage({
				data: toArrayBuffer(packetBytes),
				success: resolve,
				fail: reject,
			});
		});
	}

	_onWsMessage(res: { data: unknown }): void {
		const bytes = toUint8Array(res.data);
		this._reader.push(bytes);

		while (true) {
			const pkt = this._reader.tryReadOne();
			if (!pkt) break;
			this._handleMqttPacket(pkt);
		}
	}

	async _handleMqttPacket(pktBytes: Uint8Array): Promise<void> {
		let pkt: ReturnType<typeof mqttParsePacket>;
		try {
			pkt = mqttParsePacket(pktBytes);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.logger && this.logger.warn && this.logger.warn('[mqtt] parse packet failed:', msg);
			return;
		}

		if (pkt.type === 'connack') {
			if (pkt.returnCode !== 0) {
				this.logger && this.logger.error && this.logger.error('[mqtt] connack failed:', pkt.returnCode);
				return;
			}
			this._connected = true;

			// SUBSCRIBE readTopic
			try {
				const subPkt = mqttBuildSubscribe({ packetId: this._nextPacketId(), topic: this.readTopic, qos: 0 });
				await this._sendMqtt(subPkt);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				this.logger && this.logger.error && this.logger.error('[mqtt] subscribe failed:', msg);
			}

			// keep-alive
			if (this._keepAliveTimer) clearInterval(this._keepAliveTimer);
			this._keepAliveTimer = setInterval(() => {
				if (!this._connected) return;
				this._sendMqtt(mqttBuildPingReq()).catch(() => {});
			}, Math.max(5, Math.floor(this.keepAliveSec / 2)) * 1000);
			return;
		}

		if (pkt.type === 'suback') {
			// QoS0 granted => 0
			if (pkt.grantedQos && pkt.grantedQos.length && pkt.grantedQos[0] === 0x80) {
				this.logger && this.logger.error && this.logger.error('[mqtt] suback rejected');
				return;
			}
			this._subscribed = true;
			return;
		}

		if (pkt.type === 'publish') {
			// 只处理 readTopic
			if (pkt.topic !== this.readTopic) return;

			// payload 里可能是完整帧，也可能是多帧/粘包：用 FrameCollector 做拼帧
			this._collector.push(pkt.payload);
			const expectBoot = !!this._pending?.expectBoot;
			while (true) {
				const frame = expectBoot ? this._collector.tryShiftOneBootFrame() : this._collector.tryShiftOneValidFrame();
				if (!frame) break;
				this._tryResolvePending(frame);
			}
			return;
		}
	}

	_tryResolvePending(frameBytes: Uint8Array): void {
		if (!this._pending) return;
		const { expect, resolve, timer, expectBoot } = this._pending;
		if (!this._isExpectedResponse(frameBytes, expect, expectBoot)) return;
		clearTimeout(timer);
		this._pending = null;
		resolve(frameBytes);
	}

	_isExpectedResponse(frameBytes: Uint8Array, expect: ReqExpect, expectBoot?: boolean): boolean {
		try {
			if (expectBoot) {
				const parsed = parseBootFrame(frameBytes);
				if (parsed.targetAddress !== expect.targetAddress) return false;
				if (parsed.command !== expect.functionCode) return false;
				return isExpectedBootSourceAddress(expect.sourceAddress, parsed.sourceAddress);
			}
			const parsed = parseFrame(frameBytes);
			if (parsed.type === 'error') {
				return parsed.targetAddress === expect.targetAddress && parsed.sourceAddress === expect.sourceAddress && parsed.functionCode === (expect.functionCode | 0x80);
			}
			if (parsed.functionCode === BMS_FUNC.SOCKET_READ && expect.functionCode === BMS_FUNC.SOCKET_READ) {
				if (parsed.targetAddress !== expect.targetAddress) return false;
				if ((expect.sourceAddress & 0xff) === 0xfa) return true;
			}
			return parsed.targetAddress === expect.targetAddress && parsed.sourceAddress === expect.sourceAddress && parsed.functionCode === expect.functionCode;
		} catch {
			return false;
		}
	}

	/**
	 * 发送 BMS 帧到 writeTopic，等待 readTopic 返回 BMS 回复帧。
	 */
	request(frameBytes: Uint8Array | ArrayLike<number>, { timeoutMs = this.requestTimeoutMs }: { timeoutMs?: number } = {}): Promise<Uint8Array> {
		this._queue = this._queue.then(() => this._requestSerial(frameBytes, { timeoutMs }));
		return this._queue;
	}

	async _requestSerial(frameBytes: Uint8Array | ArrayLike<number>, { timeoutMs }: { timeoutMs: number }): Promise<Uint8Array> {
		await this.connect();

		if (this._pending) throw new BmsProtocolError('Previous request still pending');

		// 帧间隔保护（MQTT 通道一般更快，这里给一个默认间隔避免设备侧处理不过来）
		const now = Date.now();
		const delta = now - this._lastTxAt;
		if (delta < this.minFrameIntervalMs) await sleep(this.minFrameIntervalMs - delta);

			const rawFrame = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
			const reqFrame = buildMqttSocketReadFrame(rawFrame);
			const { expect, expectBoot } = mkReqExpect(reqFrame);

			const deferred = defer<Uint8Array>();
			const timer = setTimeout(() => {
				if (this._pending && this._pending.reject === deferred.reject) this._pending = null;
				deferred.reject(new BmsProtocolError(`MQTT request timeout after ${timeoutMs}ms`, { expect }));
			}, timeoutMs);
			this._pending = { resolve: deferred.resolve, reject: deferred.reject, expect, timer, expectBoot };
			const respPromise = deferred.promise;

			try {
				const pubPkt = mqttBuildPublish({ topic: this.writeTopic, payload: reqFrame, qos: 0, retain: false });
				await this._sendMqtt(pubPkt);
			this._lastTxAt = Date.now();
			return await respPromise;
		} catch (e) {
			const pending = this._pending;
			if (pending) clearTimeout(pending.timer);
			this._pending = null;
			throw e;
		}
	}
}

export function createUniMqttWsBmsTransport(options: UniMqttWsBmsTransportOptions): UniMqttWsBmsTransport {
	return new UniMqttWsBmsTransport(options);
}
