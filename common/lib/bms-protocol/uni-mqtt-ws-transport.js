import { BmsProtocolError, parseFrame } from './frame.js';
import {
	MqttPacketReader,
	mqttBuildConnect,
	mqttBuildDisconnect,
	mqttBuildPingReq,
	mqttBuildPublish,
	mqttBuildSubscribe,
	mqttParsePacket,
} from './mqtt.js';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function toUint8Array(data) {
	if (data instanceof Uint8Array) return data;
	if (data instanceof ArrayBuffer) return new Uint8Array(data);
	if (typeof data === 'string') {
		// 这里按 UTF-8 文本处理（多数 MQTT Broker WebSocket 会返回二进制，但也有平台会返回字符串）
		if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(data);
		const out = new Uint8Array(data.length);
		for (let i = 0; i < data.length; i += 1) out[i] = data.charCodeAt(i) & 0xff;
		return out;
	}
	return Uint8Array.from(data);
}

function toArrayBuffer(u8) {
	const bytes = u8 instanceof Uint8Array ? u8 : Uint8Array.from(u8);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function mkReqExpect(reqFrameBytes) {
	const req = reqFrameBytes instanceof Uint8Array ? reqFrameBytes : Uint8Array.from(reqFrameBytes);
	if (req.length < 6) throw new BmsProtocolError('Invalid request frame bytes');
	return {
		functionCode: req[4] & 0xff,
		// BMS 回复帧：source/target 互换
		targetAddress: req[2] & 0xff,
		sourceAddress: req[3] & 0xff,
	};
}

class FrameCollector {
	constructor({ logger }) {
		this._logger = logger;
		this._buf = new Uint8Array(0);
	}

	push(bytes) {
		const chunk = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
		const merged = new Uint8Array(this._buf.length + chunk.length);
		merged.set(this._buf, 0);
		merged.set(chunk, this._buf.length);
		this._buf = merged;
	}

	tryShiftOneValidFrame() {
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
				if (this._logger && this._logger.debug) this._logger.debug('[mqtt] drop invalid frame:', e && e.message);
			}
		}
		return null;
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
	} = {}) {
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
		this._queue = Promise.resolve();
		this._lastTxAt = 0;
		this._keepAliveTimer = null;
		this._subscribed = false;
	}

	_nextPacketId() {
		const id = this._packetId & 0xffff;
		this._packetId = (this._packetId + 1) & 0xffff;
		return id === 0 ? 1 : id;
	}

	async connect() {
		if (this._socketTask) return;

		this._socketTask = uni.connectSocket({
			url: this.wsUrl,
			success: () => {},
			fail: (err) => {
				this._socketTask = null;
				throw err;
			},
		});

		this._socketTask.onOpen(async () => {
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

		this._socketTask.onMessage((res) => this._onWsMessage(res));
		this._socketTask.onError((err) => {
			this.logger && this.logger.error && this.logger.error('[mqtt] socket error:', err);
		});
		this._socketTask.onClose(() => {
			this._cleanupOnClose();
		});

		// 等待 MQTT CONNACK + SUBACK 完成
		await this._waitConnectedAndSubscribed();
	}

	async disconnect() {
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

	_cleanupOnClose() {
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

	async _waitConnectedAndSubscribed() {
		const start = Date.now();
		while (true) {
			if (this._connected && this._subscribed) return;
			if (Date.now() - start > 5000) throw new BmsProtocolError('MQTT connect/subscribe timeout');
			await sleep(50);
		}
	}

	async _sendMqtt(packetBytes) {
		if (!this._socketTask) throw new BmsProtocolError('WebSocket not created');
		if (!this._wsOpen) {
			// 等待 ws open
			const start = Date.now();
			while (!this._wsOpen) {
				if (Date.now() - start > 3000) throw new BmsProtocolError('WebSocket open timeout');
				await sleep(30);
			}
		}
		return new Promise((resolve, reject) => {
			uni.sendSocketMessage({
				data: toArrayBuffer(packetBytes),
				success: resolve,
				fail: reject,
			});
		});
	}

	_onWsMessage(res) {
		const bytes = toUint8Array(res.data);
		this._reader.push(bytes);

		while (true) {
			const pkt = this._reader.tryReadOne();
			if (!pkt) break;
			this._handleMqttPacket(pkt);
		}
	}

	async _handleMqttPacket(pktBytes) {
		let pkt;
		try {
			pkt = mqttParsePacket(pktBytes);
		} catch (e) {
			this.logger && this.logger.warn && this.logger.warn('[mqtt] parse packet failed:', e && e.message);
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
				this.logger && this.logger.error && this.logger.error('[mqtt] subscribe failed:', e && e.message);
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
			while (true) {
				const frame = this._collector.tryShiftOneValidFrame();
				if (!frame) break;
				this._tryResolvePending(frame);
			}
			return;
		}
	}

	_tryResolvePending(frameBytes) {
		if (!this._pending) return;
		const { expect, resolve, timer } = this._pending;
		if (!this._isExpectedResponse(frameBytes, expect)) return;
		clearTimeout(timer);
		this._pending = null;
		resolve(frameBytes);
	}

	_isExpectedResponse(frameBytes, expect) {
		try {
			const parsed = parseFrame(frameBytes);
			if (parsed.type === 'error') {
				return parsed.targetAddress === expect.targetAddress && parsed.sourceAddress === expect.sourceAddress && parsed.functionCode === (expect.functionCode | 0x80);
			}
			return parsed.targetAddress === expect.targetAddress && parsed.sourceAddress === expect.sourceAddress && parsed.functionCode === expect.functionCode;
		} catch {
			return false;
		}
	}

	/**
	 * 发送 BMS 帧到 writeTopic，等待 readTopic 返回 BMS 回复帧。
	 */
	request(frameBytes, { timeoutMs = this.requestTimeoutMs } = {}) {
		this._queue = this._queue.then(() => this._requestSerial(frameBytes, { timeoutMs }));
		return this._queue;
	}

	async _requestSerial(frameBytes, { timeoutMs }) {
		await this.connect();

		if (this._pending) throw new BmsProtocolError('Previous request still pending');

		// 帧间隔保护（MQTT 通道一般更快，这里给一个默认间隔避免设备侧处理不过来）
		const now = Date.now();
		const delta = now - this._lastTxAt;
		if (delta < this.minFrameIntervalMs) await sleep(this.minFrameIntervalMs - delta);

		const reqFrame = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
		const expect = mkReqExpect(reqFrame);

		const respPromise = new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				if (this._pending && this._pending.reject === reject) this._pending = null;
				reject(new BmsProtocolError(`MQTT request timeout after ${timeoutMs}ms`, { expect }));
			}, timeoutMs);
			this._pending = { resolve, reject, expect, timer };
		});

		try {
			const pubPkt = mqttBuildPublish({ topic: this.writeTopic, payload: reqFrame, qos: 0, retain: false });
			await this._sendMqtt(pubPkt);
			this._lastTxAt = Date.now();
			return await respPromise;
		} catch (e) {
			if (this._pending) {
				clearTimeout(this._pending.timer);
				this._pending = null;
			}
			throw e;
		}
	}
}

export function createUniMqttWsBmsTransport(options) {
	return new UniMqttWsBmsTransport(options);
}

