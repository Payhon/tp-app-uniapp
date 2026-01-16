import { BmsProtocolError, parseFrame } from './frame'
import { parseBootFrame } from './boot-frame'
import { BMS_BLE_NOTIFY_UUID, BMS_BLE_SERVICE_UUID, BMS_BLE_WRITE_UUID } from './ble-uuids'
import type { LoggerLike } from './types'

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const wx: any

type UniBleBmsTransportOptions = {
	serviceUUID?: string
	writeCharUUID?: string
	notifyCharUUID?: string
	writeChunkSize?: number
	writeChunkIntervalMs?: number
	minFrameIntervalMs?: number
	requestTimeoutMs?: number
	logger?: LoggerLike
}

type UniBleDeviceInfo = { deviceId: string; name?: string; localName?: string; RSSI?: number }
type UniBleService = { uuid: string }
type UniBleCharacteristic = {
	uuid: string
	properties?: { write?: boolean; writeNoResponse?: boolean; notify?: boolean }
}

type ReqExpect = { functionCode: number; targetAddress: number; sourceAddress: number }
type PendingReq = {
	resolve: (frameBytes: Uint8Array) => void
	reject: (err: unknown) => void
	expect: ReqExpect
	expectBoot?: boolean
	timer: ReturnType<typeof setTimeout>
}

function toArrayBuffer(u8: ArrayBuffer | Uint8Array | ArrayLike<number>): ArrayBuffer {
	if (u8 instanceof ArrayBuffer) return u8;
	const bytes = u8 instanceof Uint8Array ? u8 : Uint8Array.from(u8);
	// Uint8Array.buffer 可能是 SharedArrayBuffer（某些运行时），这里统一复制成 ArrayBuffer 以满足 uni API 的入参
	const view = bytes.subarray(0);
	const out = new Uint8Array(view.byteLength);
	out.set(view);
	return out.buffer;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function u8ToHex(bytes: Uint8Array | ArrayLike<number>): string {
	const u8 = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
	let out = '';
	for (let i = 0; i < u8.length; i += 1) out += (u8[i] & 0xff).toString(16).padStart(2, '0');
	return out.toUpperCase();
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

function normalizeUuid(uuid: unknown): string {
	return String(uuid || '').toLowerCase();
}

function mkNotifyKey(deviceId: string, serviceId: string, characteristicId: string): string {
	return `${deviceId}|${normalizeUuid(serviceId)}|${normalizeUuid(characteristicId)}`;
}

const notifyCallbacks = new Map<string, (value: ArrayBuffer) => void>();
let notifyListenerInstalled = false;

function ensureNotifyListener() {
	if (notifyListenerInstalled) return;
	// uniapp 没有 offBLECharacteristicValueChange，因此这里用“路由分发”的方式避免多实例冲突
	uni.onBLECharacteristicValueChange((res: { deviceId: string; serviceId: string; characteristicId: string; value: ArrayBuffer }) => {
		try {
			const key = mkNotifyKey(res.deviceId, res.serviceId, res.characteristicId);
			const cb = notifyCallbacks.get(key);
			if (cb) cb(res.value);
		} catch (e) {
			// ignore
		}
	});
	notifyListenerInstalled = true;
}

class FrameCollector {
	private _logger?: LoggerLike
	private _buf: Uint8Array

	constructor({ logger }: { logger?: LoggerLike }) {
		this._logger = logger;
		this._buf = new Uint8Array(0);
	}

	push(arrayBufferOrBytes: ArrayBuffer | Uint8Array | ArrayLike<number>) {
		const chunk =
			arrayBufferOrBytes instanceof ArrayBuffer
				? new Uint8Array(arrayBufferOrBytes)
				: arrayBufferOrBytes instanceof Uint8Array
					? arrayBufferOrBytes
					: Uint8Array.from(arrayBufferOrBytes);
		const merged = new Uint8Array(this._buf.length + chunk.length);
		merged.set(this._buf, 0);
		merged.set(chunk, this._buf.length);
		this._buf = merged;
	}

	snapshotHex({ headBytes = 24, tailBytes = 24 }: { headBytes?: number; tailBytes?: number } = {}) {
		const len = this._buf.length;
		const head = this._buf.slice(0, Math.min(headBytes, len));
		const tail = this._buf.slice(Math.max(0, len - tailBytes), len);
		return {
			len,
			headHex: u8ToHex(head),
			tailHex: u8ToHex(tail),
		};
	}

	/**
	 * 尝试从缓冲区中提取一个“完整帧”。
	 *
	 * 协议特征：
	 * - 帧头：7F 55
	 * - 帧尾：FD
	 * - 读回复：第 6 字节为 byteCount，可推导完整帧长度（避免仅靠尾码误判）
	 * - 使用 parseFrame 验证 CRC（不通过则继续向后找）
	 */
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
			// 没找到头码，清空（或保留最后 1 字节以避免头码跨包）
			this._buf = bytes.slice(Math.max(0, bytes.length - 1));
			return null;
		}
		if (start > 0) this._buf = bytes.slice(start);

		// 优先按协议长度提帧（更稳）：读回复可用 byteCount 推导总长度
		if (this._buf.length >= 6) {
			const functionCode = this._buf[4] & 0xff;
			const isError = (functionCode & 0x80) !== 0;
			if (isError) {
				// error response fixed length = 9
				const expectedLen = 9;
				if (this._buf.length >= expectedLen) {
					const candidate = this._buf.slice(0, expectedLen);
					if (candidate[candidate.length - 1] === 0xfd) {
						try {
							parseFrame(candidate);
							this._buf = this._buf.slice(expectedLen);
							return candidate;
						} catch (e) {
							this._buf = this._buf.slice(1);
							return null;
						}
					}
				}
			} else if (functionCode === 0x03 || functionCode === 0xff) {
				// read response: 9 + byteCount
				const byteCount = this._buf[5] & 0xff;
				const expectedLen = 9 + byteCount;
				if (this._buf.length >= expectedLen) {
					const candidate = this._buf.slice(0, expectedLen);
					if (candidate[candidate.length - 1] === 0xfd) {
						try {
							parseFrame(candidate);
							this._buf = this._buf.slice(expectedLen);
							return candidate;
						} catch (e) {
							const msg = e instanceof Error ? e.message : String(e);
							if (this._logger && this._logger.debug) this._logger.debug('[ble] drop invalid frame:', msg);
							this._buf = this._buf.slice(1);
							return null;
						}
					}
				}
			} else if (functionCode === 0x10 || functionCode === 0x11) {
				// write response fixed length = 12
				const expectedLen = 12;
				if (this._buf.length >= expectedLen) {
					const candidate = this._buf.slice(0, expectedLen);
					if (candidate[candidate.length - 1] === 0xfd) {
						try {
							parseFrame(candidate);
							this._buf = this._buf.slice(expectedLen);
							return candidate;
						} catch (e) {
							this._buf = this._buf.slice(1);
							return null;
						}
					}
				}
			}
		}

		// 兜底：从头码之后寻找尾码（可能存在未知功能码 / 噪声）
		for (let j = 2; j < this._buf.length; j += 1) {
			if (this._buf[j] !== 0xfd) continue;
			const candidate = this._buf.slice(0, j + 1);
			try {
				parseFrame(candidate);
				this._buf = this._buf.slice(j + 1);
				return candidate;
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				if (this._logger && this._logger.debug) this._logger.debug('[ble] drop invalid frame:', msg);
			}
		}

	// 没有完整帧，保留缓冲
	return null;
	}

	tryShiftOneBootFrame(): Uint8Array | null {
		const bytes = this._buf;
		if (bytes.length < 5) return null;

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

		for (let j = 1; j < this._buf.length; j += 1) {
			if (this._buf[j] !== 0xfd) continue;
			const candidate = this._buf.slice(0, j + 1);
			try {
				parseBootFrame(candidate);
				this._buf = this._buf.slice(j + 1);
				return candidate;
			} catch (e) {
				this._buf = this._buf.slice(1);
				return null;
			}
		}
		return null;
	}
}

function uniAsync<T = unknown>(apiName: string, args: Record<string, unknown>): Promise<T> {
	return new Promise((resolve, reject) => {
		// NOTE: uni 的 API 表是动态的，这里用索引访问以复用封装；类型上保持最小侵入
		(uni as Record<string, any>)[apiName]({
			...args,
			success: resolve,
			fail: reject,
		});
	});
}

/**
 * 基于 uniapp 蓝牙 API 的 BMS 传输层（Transport）
 *
 * 目标：
 * - 完全使用 uniapp 的蓝牙 API
 * - 将“发送一帧 -> 等待回复帧”的逻辑封装成 transport.request(frameBytes)
 *
 * 默认 UUID（来自协议文档）：
 * - serviceUUID: 0000ffc0-0000-1000-8000-00805f9b34fb
 * - writeCharUUID: 0000ff03-0000-1000-8000-00805f9b34fb（write without response）
 * - notifyCharUUID: 0000ffc1-0000-1000-8000-00805f9b34fb（notify）
 */
export class UniBleBmsTransport {
	serviceUUID: string
	writeCharUUID: string
	notifyCharUUID: string
	writeChunkSize: number
	writeChunkIntervalMs: number
	minFrameIntervalMs: number
	requestTimeoutMs: number
	logger: LoggerLike

	deviceId: string | null
	serviceId: string | null
	writeCharId: string | null
	notifyCharId: string | null

	private _collector: FrameCollector
	private _connected: boolean
	private _lastTxAt: number
	private _pending: PendingReq | null
	private _queue: Promise<Uint8Array>
	private _rxLogCount: number

	constructor({
		serviceUUID = BMS_BLE_SERVICE_UUID,
		writeCharUUID = BMS_BLE_WRITE_UUID,
		notifyCharUUID = BMS_BLE_NOTIFY_UUID,
		writeChunkSize = 20,
		writeChunkIntervalMs = 20,
		minFrameIntervalMs = 120,
		requestTimeoutMs = 5000,
		logger = console,
	}: UniBleBmsTransportOptions = {}) {
		this.serviceUUID = normalizeUuid(serviceUUID);
		this.writeCharUUID = normalizeUuid(writeCharUUID);
		this.notifyCharUUID = normalizeUuid(notifyCharUUID);

		this.writeChunkSize = writeChunkSize;
		this.writeChunkIntervalMs = writeChunkIntervalMs;
		this.minFrameIntervalMs = minFrameIntervalMs;
		this.requestTimeoutMs = requestTimeoutMs;
		this.logger = logger;

		this.deviceId = null;
		this.serviceId = null;
		this.writeCharId = null;
		this.notifyCharId = null;

		this._collector = new FrameCollector({ logger });
		this._connected = false;
		this._lastTxAt = 0;

		this._pending = null; // { resolve, reject, expect, timer }
		this._queue = Promise.resolve(new Uint8Array(0)); // 串行化 request，避免并发导致“回复帧串包”
		this._rxLogCount = 0;
	}

	async init() {
		// 初始化蓝牙模块（必须调用）
		// 微信小程序：显式 central 模式，且在提示隐私未授权时尝试触发授权
		try {
			// #ifdef MP-WEIXIN
			await uniAsync('openBluetoothAdapter', { mode: 'central' });
			// #endif
			// #ifndef MP-WEIXIN
			await uniAsync('openBluetoothAdapter', {});
			// #endif
		} catch (e) {
			// #ifdef MP-WEIXIN
			const msg = String((e as any)?.errMsg || '').toLowerCase();
			const requirePrivacyAuthorize = wx && wx.requirePrivacyAuthorize;
			if (msg.includes('privacy') && typeof requirePrivacyAuthorize === 'function') {
				await new Promise((resolve) => requirePrivacyAuthorize({ complete: resolve }));
				await uniAsync('openBluetoothAdapter', { mode: 'central' });
			} else {
				throw e;
			}
			// #endif
			// #ifndef MP-WEIXIN
			throw e;
			// #endif
		}
		ensureNotifyListener();
	}

	async destroy() {
		try {
			await this.disconnect();
		} catch (e) {
			// ignore
		}
		try {
			await uniAsync('closeBluetoothAdapter', {});
		} catch (e) {
			// ignore
		}
	}

		/**
		 * 扫描设备（可选）
		 * @returns {Promise<Array<{deviceId:string,name:string,localName?:string,RSSI?:number}>>}
		 */
		async discover({
			durationMs = 5000,
			services = [this.serviceUUID],
			allowDuplicatesKey = false,
		}: {
			durationMs?: number
			services?: string[]
			allowDuplicatesKey?: boolean
		} = {}): Promise<Array<{ deviceId: string; name: string; localName?: string; RSSI?: number }>> {
			await this.init();
			await uniAsync('startBluetoothDevicesDiscovery', {
				services: services ? services.map(normalizeUuid) : undefined,
				allowDuplicatesKey,
			});
			await sleep(durationMs);
			await uniAsync('stopBluetoothDevicesDiscovery', {});
			const res = await uniAsync<{ devices?: UniBleDeviceInfo[] }>('getBluetoothDevices', {});
			return (res.devices || []).map((d: UniBleDeviceInfo) => ({
				deviceId: d.deviceId,
				name: d.name || '',
				localName: d.localName,
				RSSI: d.RSSI,
			}));
		}

	/**
	 * 建立 BLE 连接，并自动完成：
		 * - 查找 service/characteristic
		 * - 打开 notify
		 */
		async connect({ deviceId }: { deviceId: string }) {
			if (!deviceId) throw new BmsProtocolError('deviceId is required for BLE connect');
			await this.init();
			this.deviceId = deviceId;

		// 连接前停止扫描（部分平台扫描中会影响连接/发现服务）
		try {
			await uniAsync('stopBluetoothDevicesDiscovery', {});
		} catch (e) {}

		if (this.logger?.info) {
			this.logger.info('[ble] connect()', { deviceId, serviceUUID: this.serviceUUID, writeCharUUID: this.writeCharUUID, notifyCharUUID: this.notifyCharUUID });
		}
		await uniAsync('createBLEConnection', { deviceId });
			this._connected = true;

			// 获取服务（部分平台刚连上时会返回空，做重试）
			const tryGetServices = async (): Promise<UniBleService[]> => {
				const srvRes = await uniAsync<{ services?: UniBleService[] }>('getBLEDeviceServices', { deviceId });
				return srvRes.services || [];
			};
			let services: UniBleService[] = [];
			for (let i = 0; i < 3; i += 1) {
				services = await tryGetServices();
				if (services.length) break;
				if (this.logger?.debug) this.logger.debug('[ble] getBLEDeviceServices empty, retry...', i + 1);
				await sleep(200);
			}
			if (!services.length) throw new BmsProtocolError('No BLE services found on device');
			const service = services.find((s: UniBleService) => normalizeUuid(s.uuid) === this.serviceUUID) || null;
			if (!service) throw new BmsProtocolError('Target BLE service not found', { expect: this.serviceUUID, services: services.map((s) => s.uuid) });
			this.serviceId = service.uuid;

			// 获取特征值（重试），并强制匹配固定 UUID（不做猜测）
			const tryGetChars = async (): Promise<UniBleCharacteristic[]> => {
				const chRes = await uniAsync<{ characteristics?: UniBleCharacteristic[] }>('getBLEDeviceCharacteristics', {
					deviceId,
					serviceId: this.serviceId,
				});
				return chRes.characteristics || [];
			};
			let chars: UniBleCharacteristic[] = [];
			for (let i = 0; i < 3; i += 1) {
				chars = await tryGetChars();
				if (chars.length) break;
				if (this.logger?.debug) this.logger.debug('[ble] getBLEDeviceCharacteristics empty, retry...', i + 1);
				await sleep(200);
			}
			if (!chars.length) throw new BmsProtocolError('No BLE characteristics found on service', { serviceId: this.serviceId });

			const writeChar = chars.find((c: UniBleCharacteristic) => normalizeUuid(c.uuid) === this.writeCharUUID) || null;
			const notifyChar = chars.find((c: UniBleCharacteristic) => normalizeUuid(c.uuid) === this.notifyCharUUID) || null;
			if (!writeChar) throw new BmsProtocolError('Write characteristic not found', { expect: this.writeCharUUID });
			if (!notifyChar) throw new BmsProtocolError('Notify characteristic not found', { expect: this.notifyCharUUID });

		this.writeCharId = writeChar.uuid;
		this.notifyCharId = notifyChar.uuid;

		// 打开 notify
		await uniAsync('notifyBLECharacteristicValueChange', {
			deviceId,
			serviceId: this.serviceId,
			characteristicId: this.notifyCharId,
			state: true,
		});

		// 注册 notify 回调
		const key = mkNotifyKey(deviceId, this.serviceId, this.notifyCharId);
		notifyCallbacks.set(key, (ab) => this._onNotify(ab));

		this._rxLogCount = 0;
		// 部分设备在打开 notify 后需要短暂准备时间
		await sleep(220);

		this.logger && this.logger.info && this.logger.info('[ble] connected:', { deviceId, serviceId: this.serviceId });
	}

	async disconnect() {
		if (!this.deviceId) return;
		const deviceId = this.deviceId;
		try {
			if (this.serviceId && this.notifyCharId) {
				const key = mkNotifyKey(deviceId, this.serviceId, this.notifyCharId);
				notifyCallbacks.delete(key);
			}
		} catch (e) {
			// ignore
		}

		try {
			await uniAsync('closeBLEConnection', { deviceId });
		} finally {
			this._connected = false;
			this.deviceId = null;
			this.serviceId = null;
			this.writeCharId = null;
			this.notifyCharId = null;
			}
		}

		_onNotify(arrayBuffer: ArrayBuffer) {
			try {
				if (this.logger?.debug && this._rxLogCount < 10) {
					this._rxLogCount += 1;
					const u8 = new Uint8Array(arrayBuffer);
					this.logger.debug(`[ble] rx chunk len=${u8.length} head=${u8ToHex(u8.slice(0, Math.min(24, u8.length)))}`);
				}
			} catch (e) {}
			this._collector.push(arrayBuffer);

			const expectBoot = !!this._pending?.expectBoot;
			while (true) {
				const frame = expectBoot ? this._collector.tryShiftOneBootFrame() : this._collector.tryShiftOneValidFrame();
				if (!frame) break;
				try {
					if (this.logger?.debug) {
						this.logger.debug(`[ble] rx frame len=${frame.length} hex=${u8ToHex(frame)}`);
					}
				} catch (e) {}
				this._tryResolvePending(frame);
			}
		}

		_tryResolvePending(frameBytes: Uint8Array) {
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
					return parsed.targetAddress === expect.targetAddress && parsed.sourceAddress === expect.sourceAddress && parsed.command === expect.functionCode;
				}
				const parsed = parseFrame(frameBytes);
				if (parsed.type === 'error') {
					return (
						parsed.targetAddress === expect.targetAddress &&
						parsed.sourceAddress === expect.sourceAddress &&
						parsed.functionCode === (expect.functionCode | 0x80)
					);
				}
				return (
					parsed.targetAddress === expect.targetAddress &&
					parsed.sourceAddress === expect.sourceAddress &&
					parsed.functionCode === expect.functionCode
				);
		} catch (e) {
			return false;
			}
		}

		async _writeFrameBytes(
			frameBytes: Uint8Array | ArrayLike<number>,
			{ chunkSize = this.writeChunkSize, chunkIntervalMs = this.writeChunkIntervalMs }: { chunkSize?: number; chunkIntervalMs?: number } = {}
		): Promise<void> {
			if (!this._connected) throw new BmsProtocolError('BLE is not connected');
			if (!this.deviceId || !this.serviceId || !this.writeCharId) throw new BmsProtocolError('BLE characteristic not ready');

		const bytes = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);

		for (let offset = 0; offset < bytes.length; offset += chunkSize) {
			const chunk = bytes.slice(offset, Math.min(bytes.length, offset + chunkSize));
			try {
				await uniAsync('writeBLECharacteristicValue', {
					deviceId: this.deviceId,
					serviceId: this.serviceId,
					characteristicId: this.writeCharId,
					// 目标特征值为 write without response，但部分运行时不支持 writeType 入参；失败时降级重试一次
					writeType: 'writeNoResponse',
					value: toArrayBuffer(chunk),
				});
			} catch (e: any) {
				const code = e?.code
				const msg = String(e?.errMsg || e?.message || e || '').toLowerCase()
				if (code === 10007 || msg.includes('property not support') || msg.includes('not support')) {
					await uniAsync('writeBLECharacteristicValue', {
						deviceId: this.deviceId,
						serviceId: this.serviceId,
						characteristicId: this.writeCharId,
						value: toArrayBuffer(chunk),
					});
				} else {
					throw e;
				}
			}
			if (chunkIntervalMs > 0 && offset + chunkSize < bytes.length) await sleep(chunkIntervalMs);
		}
	}

	/**
	 * 通讯层核心方法：发送请求帧，等待一帧有效回复。
	 * - 为避免“串包”，内部默认强制串行
	 */
	request(
		frameBytes: Uint8Array | ArrayLike<number>,
		{ timeoutMs = this.requestTimeoutMs }: { timeoutMs?: number } = {}
	): Promise<Uint8Array> {
		this._queue = this._queue.then(() => this._requestSerial(frameBytes, { timeoutMs }));
		return this._queue;
	}

	async _requestSerial(frameBytes: Uint8Array | ArrayLike<number>, { timeoutMs }: { timeoutMs: number }): Promise<Uint8Array> {
		if (this._pending) throw new BmsProtocolError('Previous request still pending');

		const req = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
		const expectBoot = req[0] === 0x55 && req[1] !== 0x7f;
		if (!expectBoot && req.length < 6) throw new BmsProtocolError('Invalid request frame bytes');
		if (expectBoot && req.length < 4) throw new BmsProtocolError('Invalid boot request frame bytes');

		// 协议要求帧间隔 >100ms，这里做一个最小间隔保护
		const now = Date.now();
		const delta = now - this._lastTxAt;
		if (delta < this.minFrameIntervalMs) await sleep(this.minFrameIntervalMs - delta);

		const expect = expectBoot
			? {
					functionCode: req[3] & 0xff,
					targetAddress: req[1] & 0xff, // host addr
					sourceAddress: req[2] & 0xff, // slave addr
				}
			: {
					functionCode: req[4] & 0xff,
					// 目标地址/来源地址：回复时应互换
					targetAddress: req[2] & 0xff, // host addr
					sourceAddress: req[3] & 0xff, // slave addr
				};

		const deferred = defer<Uint8Array>();
		const timer = setTimeout(() => {
			if (this._pending && this._pending.reject === deferred.reject) this._pending = null;
			try {
				if (this.logger?.warn) {
					this.logger.warn('[ble] request timeout snapshot', { expect, ...this._collector.snapshotHex() });
				}
			} catch (e) {}
			deferred.reject(new BmsProtocolError(`BLE request timeout after ${timeoutMs}ms`, { expect }));
		}, timeoutMs);
		this._pending = { resolve: deferred.resolve, reject: deferred.reject, expect, timer, expectBoot };
		const respPromise = deferred.promise;

		try {
			if (this.logger?.debug) this.logger.debug(`[ble] tx frame len=${req.length} hex=${u8ToHex(req)}`);
			await this._writeFrameBytes(req);
			this._lastTxAt = Date.now();

			// 某些设备/运行时不会主动推送 notify，需要通过 read 触发 value change（特征值含 Read 属性时）
			const pendingRef = this._pending;
			void (async () => {
				const delays = [220, 520];
				for (const ms of delays) {
					await sleep(ms);
					if (!this._pending || this._pending !== pendingRef) return;
					if (!this.deviceId || !this.serviceId || !this.notifyCharId) return;
					try {
						if (this.logger?.debug) this.logger.debug('[ble] probe read notify', { ms });
						await uniAsync('readBLECharacteristicValue', {
							deviceId: this.deviceId,
							serviceId: this.serviceId,
							characteristicId: this.notifyCharId,
						});
					} catch (e) {
						// ignore probe errors
					}
				}
			})();

			return await respPromise;
		} catch (e) {
			const pending = this._pending;
			if (pending) clearTimeout(pending.timer);
			this._pending = null;
			throw e;
		}
	}
	}

	export function createUniBleBmsTransport(options: UniBleBmsTransportOptions): UniBleBmsTransport {
		return new UniBleBmsTransport(options);
	}
