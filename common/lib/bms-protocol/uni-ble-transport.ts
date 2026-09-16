import { BmsProtocolError, parseFrame } from './frame'
import { isExpectedBootResponse, parseBootFrame } from './boot-frame'
import { BMS_BLE_NOTIFY_UUID, BMS_BLE_SERVICE_UUID, BMS_BLE_WRITE_UUID } from './ble-uuids'
import type { BmsRequestOptions, LoggerLike } from './types'
import { acquireBleDiscoveryLease } from '@/common/ble/ble-discovery-coordinator'

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
	properties?: { write?: boolean; writeNoResponse?: boolean; notify?: boolean; read?: boolean }
}

type ReqExpect = { functionCode: number; targetAddress: number; sourceAddress: number; bootRequested?: number }

type BleCapability = boolean | null

type NativeWriteDiagnostic = {
	attempt: number
	writeType: 'write' | 'writeNoResponse'
	outcome: 'pending' | 'success' | 'failure' | 'timeout' | 'late_success' | 'late_failure'
	rttMs?: number
	errCode?: unknown
	errMsg?: string
}

type ReadProbeDiagnostic = {
	outcome: 'started' | 'success' | 'failure' | 'timeout'
	rttMs?: number
	errCode?: unknown
	errMsg?: string
}

function isBootRequestFrame(frameBytes: Uint8Array | ArrayLike<number>): boolean {
	return frameBytes.length >= 4 && (frameBytes[0] & 0xff) === 0x55 && (frameBytes[1] & 0xff) !== 0x7f
}

type PendingReq = {
	resolve: (frameBytes: Uint8Array) => void
	reject: (err: unknown) => void
	expect: ReqExpect
	expectBoot?: boolean
	bootFrameSubmitted?: boolean
	writeFallbackUsed?: boolean
	nativeWrites?: NativeWriteDiagnostic[]
	readProbe?: ReadProbeDiagnostic
	rxChunkCount?: number
	rxByteCount?: number
	lastRxHex?: string
	unexpectedFrameCount?: number
	lastUnexpectedFrameHex?: string
	timer: ReturnType<typeof setTimeout>
	createdAt: number
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

function readCapability(value: unknown): BleCapability {
	return typeof value === 'boolean' ? value : null;
}

function nativeErrorDiagnostic(error: unknown): { errCode?: unknown; errMsg: string } {
	const value = error && typeof error === 'object' ? error as Record<string, unknown> : {};
	return {
		errCode: value.errCode ?? value.code,
		errMsg: String(value.errMsg ?? value.message ?? error ?? '').slice(0, 240),
	};
}

function isPropertyNotSupported(error: unknown): boolean {
	const { errCode, errMsg } = nativeErrorDiagnostic(error);
	const normalized = errMsg.toLowerCase();
	return Number(errCode) === 10007 || normalized.includes('property not support');
}

function mkNotifyKey(deviceId: string, serviceId: string, characteristicId: string): string {
	return `${deviceId}|${normalizeUuid(serviceId)}|${normalizeUuid(characteristicId)}`;
}

const notifyCallbacks = new Map<string, (value: ArrayBuffer) => void>();
let notifyListenerInstalled = false;
const connectionStateCallbacks = new Map<string, (connected: boolean) => void>();
let connectionStateListenerInstalled = false;

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

function ensureConnectionStateListener() {
	if (connectionStateListenerInstalled) return;
	const api = (uni as Record<string, any>).onBLEConnectionStateChange;
	if (typeof api !== 'function') return;
	api((res: { deviceId?: string; connected?: boolean }) => {
		try {
			const callback = connectionStateCallbacks.get(String(res?.deviceId || ''));
			callback?.(res?.connected === true);
		} catch (e) {
			// ignore
		}
	});
	connectionStateListenerInstalled = true;
}

class FrameCollector {
	private _logger?: LoggerLike
	private _buf: Uint8Array
	private _invalidBootFrameCount: number
	private _lastBootParseError: string

	constructor({ logger }: { logger?: LoggerLike }) {
		this._logger = logger;
		this._buf = new Uint8Array(0);
		this._invalidBootFrameCount = 0;
		this._lastBootParseError = '';
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

	reset() {
		this._buf = new Uint8Array(0);
		this._invalidBootFrameCount = 0;
		this._lastBootParseError = '';
	}

	snapshotHex({ headBytes = 24, tailBytes = 24 }: { headBytes?: number; tailBytes?: number } = {}) {
		const len = this._buf.length;
		const head = this._buf.slice(0, Math.min(headBytes, len));
		const tail = this._buf.slice(Math.max(0, len - tailBytes), len);
		return {
			len,
			headHex: u8ToHex(head),
			tailHex: u8ToHex(tail),
			invalidBootFrameCount: this._invalidBootFrameCount,
			lastBootParseError: this._lastBootParseError,
		};
	}

	private _noteInvalidBootFrame(error: unknown) {
		this._invalidBootFrameCount = Math.min(9999, this._invalidBootFrameCount + 1);
		this._lastBootParseError = String(error instanceof Error ? error.message : error || '').slice(0, 240);
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
			} else if (functionCode === 0x03 || functionCode === 0x4c || functionCode === 0x4d || functionCode === 0xff) {
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
		for (;;) {
			const bytes = this._buf;
			if (bytes.length < 9) return null;

			let start = -1;
			for (let i = 0; i < bytes.length; i += 1) {
				if (bytes[i] === 0x55 && (i === 0 || bytes[i - 1] !== 0x7f)) {
					start = i;
					break;
				}
			}
			if (start < 0) {
				this._noteInvalidBootFrame('boot header not found');
				this._buf = bytes.slice(Math.max(0, bytes.length - 1));
				return null;
			}
			if (start > 0) this._buf = bytes.slice(start);

			if (this._buf.length < 9) return null;
			const dataLen = (this._buf[4] << 8) | this._buf[5];
			const expectedLen = dataLen + 9;
			if (this._buf[3] < 0x50 || this._buf[3] > 0x54 || expectedLen > 2048) {
				this._noteInvalidBootFrame(`invalid boot command/length: ${this._buf[3]}/${expectedLen}`);
				this._buf = this._buf.slice(1);
				continue;
			}
			if (expectedLen > this._buf.length) return null;
			const candidate = this._buf.slice(0, expectedLen);
			try {
				parseBootFrame(candidate);
				this._buf = this._buf.slice(expectedLen);
				return candidate;
			} catch (e) {
				this._noteInvalidBootFrame(e);
				this._buf = this._buf.slice(1);
			}
		}
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

function uniAsyncBestEffort(apiName: string, args: Record<string, unknown>, timeoutMs = 1200): Promise<void> {
	return new Promise((resolve) => {
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(() => {
			finish();
		}, timeoutMs);
		try {
			(uni as Record<string, any>)[apiName]({
				...args,
				success: finish,
				fail: finish,
				complete: finish,
			});
		} catch (e) {
			finish();
		}
	});
}

function uniAsyncSoftTimeout<T = unknown>(
	apiName: string,
	args: Record<string, unknown>,
	{
		timeoutMs = 1200,
		timeoutValue,
	}: {
		timeoutMs?: number
		timeoutValue: T
	}
): Promise<T> {
	return new Promise((resolve, reject) => {
		let settled = false;
		const finishResolve = (value: T) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(value);
		};
		const finishReject = (err: unknown) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			reject(err);
		};
		const timer = setTimeout(() => {
			finishResolve(timeoutValue);
		}, timeoutMs);
		try {
			(uni as Record<string, any>)[apiName]({
				...args,
				success: (res: T) => finishResolve(res),
				fail: finishReject,
			});
		} catch (e) {
			finishReject(e);
		}
	});
}

function uniAsyncHardTimeout<T = unknown>(
	apiName: string,
	args: Record<string, unknown>,
	{ timeoutMs = 6000 }: { timeoutMs?: number } = {}
): Promise<T> {
	return new Promise((resolve, reject) => {
		let settled = false;
		const finishResolve = (value: T) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(value);
		};
		const finishReject = (err: unknown) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			reject(err);
		};
		const timer = setTimeout(() => {
			finishReject(new BmsProtocolError(`${apiName} timeout after ${timeoutMs}ms`));
		}, timeoutMs);
		try {
			(uni as Record<string, any>)[apiName]({
				...args,
				success: (res: T) => finishResolve(res),
				fail: finishReject,
			});
		} catch (e) {
			finishReject(e);
		}
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
	private _platform: string
	private _writeSupportsNoResponse: BleCapability
	private _writeSupportsResponse: BleCapability
	private _notifySupportsRead: boolean
	private _bootForceWriteNoResponse: boolean
	private _bootReadProbeDisabled: boolean
	private _preferWriteWithResponse: boolean
	private _bleApiTimeoutMarker: { __bleApiTimeout: true }
	private _iosWriteAckUnreliable: boolean
	private _iosWriteTimeoutLogged: boolean
	private _lastWriteTimeoutLogAt: number
	private _bootSessionExclusive: boolean
	private _cancelPendingConnect: (() => void) | null
	private _disconnectTask: Promise<void> | null = null
	private _disconnectError: unknown = null
	private _nativeConnectSettled: Promise<void> | null = null
	private _connectionGeneration = 0
	private _disconnectListeners = new Set<() => void>()
	private _notifyCallback = (value: ArrayBuffer) => this._onNotify(value)
	private _connectionCallback = (connected: boolean) => this._onConnectionStateChange(connected)

	onDisconnect(listener: () => void): () => void {
		this._disconnectListeners.add(listener)
		return () => { this._disconnectListeners.delete(listener) }
	}
	getDisconnectError(): unknown { return this._disconnectError }

	cancelPendingRequest(): void {
		this._connectionGeneration++
		const pending = this._pending
		if (!pending) return
		clearTimeout(pending.timer)
		this._pending = null
		this._collector.reset()
		pending.reject(new BmsProtocolError('BLE request canceled'))
	}

	private _detachConnectionRoutes(): void {
		if (!this.deviceId) return
		if (connectionStateCallbacks.get(this.deviceId) === this._connectionCallback) connectionStateCallbacks.delete(this.deviceId)
		if (this.serviceId && this.notifyCharId) {
			const key = mkNotifyKey(this.deviceId, this.serviceId, this.notifyCharId)
			if (notifyCallbacks.get(key) === this._notifyCallback) notifyCallbacks.delete(key)
		}
	}

	private _notifyDisconnected(): void {
		this._connectionGeneration++
		this._collector.reset()
		this._writeSupportsResponse = null
		this._writeSupportsNoResponse = null
		this._notifySupportsRead = false
		this._preferWriteWithResponse = false
		this._bootForceWriteNoResponse = false
		this._bootReadProbeDisabled = false
		for (const listener of [...this._disconnectListeners]) {
			try { listener() } catch (e) { /* one observer must not prevent cleanup */ }
		}
	}

	constructor({
		serviceUUID = BMS_BLE_SERVICE_UUID,
		writeCharUUID = BMS_BLE_WRITE_UUID,
		notifyCharUUID = BMS_BLE_NOTIFY_UUID,
		writeChunkSize = 185,
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
		this._platform = '';
		this._writeSupportsNoResponse = null;
		this._writeSupportsResponse = null;
		this._notifySupportsRead = false;
		this._bootForceWriteNoResponse = false;
		this._bootReadProbeDisabled = false;
		this._preferWriteWithResponse = false;
		this._bleApiTimeoutMarker = { __bleApiTimeout: true };
		this._iosWriteAckUnreliable = false;
		this._iosWriteTimeoutLogged = false;
		this._lastWriteTimeoutLogAt = 0;
		this._bootSessionExclusive = false;
		this._cancelPendingConnect = null;
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
		ensureConnectionStateListener();
	}

	async destroy() {
		try {
			await this.disconnect();
		} catch (e) {
			// ignore
		}
		const lease = await acquireBleDiscoveryLease('uni-ble-transport:destroy');
		try {
			await uniAsyncBestEffort('closeBluetoothAdapter', {});
		} catch (e) {
			// ignore
		} finally {
			lease.release();
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
			const lease = await acquireBleDiscoveryLease('uni-ble-transport:discover');
			let discoveryStarted = false;
			try {
				await this.init();
				await uniAsync('startBluetoothDevicesDiscovery', {
					services: services ? services.map(normalizeUuid) : undefined,
					allowDuplicatesKey,
				});
				discoveryStarted = true;
				await sleep(durationMs);
				const res = await uniAsync<{ devices?: UniBleDeviceInfo[] }>('getBluetoothDevices', {});
				return (res.devices || []).map((d: UniBleDeviceInfo) => ({
					deviceId: d.deviceId,
					name: d.name || '',
					localName: d.localName,
					RSSI: d.RSSI,
				}));
			} finally {
				try {
					if (discoveryStarted) await uniAsyncBestEffort('stopBluetoothDevicesDiscovery', {});
				} finally {
					lease.release();
				}
			}
		}

	/**
	 * 建立 BLE 连接，并自动完成：
		 * - 查找 service/characteristic
		 * - 打开 notify
		 */
	async connect({ deviceId }: { deviceId: string }) {
		if (this._disconnectTask) await this._disconnectTask;
		this._disconnectTask = null;
		this._disconnectError = null;
		if (!deviceId) throw new BmsProtocolError('deviceId is required for BLE connect');
		this._cancelPendingConnect?.();
		let connectCancelled = false;
		let rejectPendingConnect!: (error: unknown) => void;
		const pendingConnectCancelled = new Promise<never>((_, reject) => {
			rejectPendingConnect = reject;
		});
		const cancelPendingConnect = () => {
			if (connectCancelled) return;
			connectCancelled = true;
			rejectPendingConnect(new BmsProtocolError('BLE connect cancelled'));
		};
		const throwIfConnectCancelled = () => {
			if (connectCancelled) throw new BmsProtocolError('BLE connect cancelled');
		};
		const waitForConnect = <T>(promise: Promise<T>): Promise<T> =>
			Promise.race([promise, pendingConnectCancelled]);
		this._cancelPendingConnect = cancelPendingConnect;

		let discoveryLease: Awaited<ReturnType<typeof acquireBleDiscoveryLease>> | null = null;
		const discoveryLeasePromise = acquireBleDiscoveryLease(`uni-ble-transport:connect:${deviceId}`);
		try {
			try {
				discoveryLease = await waitForConnect(discoveryLeasePromise);
			} catch (e) {
				// 租约队列本身不可取消；若稍后仍完成交接，必须立即归还，不能阻塞手动扫描。
				void discoveryLeasePromise.then((lateLease) => lateLease.release(), () => undefined);
				throw e;
			}
		await waitForConnect(this.init());
		this.deviceId = deviceId;
		const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : ({} as any);
		const platform = String((sys as any)?.platform || '').toLowerCase();
		const isIOS = platform === 'ios';
		this._platform = platform;
		const serviceRetryCount = isIOS ? 8 : 4;
		const charRetryCount = isIOS ? 10 : 4;
		const serviceRetryDelayMs = isIOS ? 300 : 200;
		const charRetryDelayMs = isIOS ? 320 : 200;

		// 连接前停止扫描（部分平台扫描中会影响连接/发现服务）
		try {
			await waitForConnect(uniAsyncBestEffort('stopBluetoothDevicesDiscovery', {}));
		} catch (e) {
			throwIfConnectCancelled();
		}
		await waitForConnect(sleep(120));

		if (this.logger?.info) {
			this.logger.info('[ble] connect()', { deviceId, serviceUUID: this.serviceUUID, writeCharUUID: this.writeCharUUID, notifyCharUUID: this.notifyCharUUID, platform });
		}
		let connectTimer: ReturnType<typeof setTimeout> | undefined;
		try {
			const nativeConnect = uniAsync('createBLEConnection', { deviceId });
			this._nativeConnectSettled = nativeConnect.then(() => undefined, () => undefined);
			await waitForConnect(Promise.race([nativeConnect, new Promise<never>((_, reject) => {
				connectTimer = setTimeout(() => reject(new BmsProtocolError('BLE connect timeout')), isIOS ? 9000 : 6500);
			})]));
		} catch (e) {
			this._connected = false;
			void this.disconnect().catch(() => undefined);
			throw e;
		} finally {
			if (connectTimer) clearTimeout(connectTimer);
		}
		this._connected = true;

		if (isIOS) {
			// iOS 端 createBLEConnection 成功后，服务树准备可能明显滞后，先留一点缓冲。
			await waitForConnect(sleep(220));
		}

		// 获取服务（部分平台刚连上时会返回空或目标服务尚未可见，做重试）
		let services: UniBleService[] = [];
		let service: UniBleService | null = null;
		let lastServiceError: unknown = null;
		for (let i = 0; i < serviceRetryCount; i += 1) {
			try {
				const srvRes = await waitForConnect(uniAsync<{ services?: UniBleService[] }>('getBLEDeviceServices', { deviceId }));
				services = srvRes.services || [];
				service = services.find((s: UniBleService) => normalizeUuid(s.uuid) === this.serviceUUID) || null;
				if (service) break;
				if (this.logger?.debug) {
					this.logger.debug('[ble] target service not ready, retry...', {
						attempt: i + 1,
						services: services.map((s) => s.uuid),
						expect: this.serviceUUID,
					});
				}
			} catch (e) {
				lastServiceError = e;
				if (this.logger?.debug) this.logger.debug('[ble] getBLEDeviceServices failed, retry...', { attempt: i + 1, error: e });
			}
			await waitForConnect(sleep(serviceRetryDelayMs));
		}
		if (!service) {
			if (!services.length && lastServiceError) throw lastServiceError;
			if (!services.length) throw new BmsProtocolError('No BLE services found on device');
			throw new BmsProtocolError('Target BLE service not found', { expect: this.serviceUUID, services: services.map((s) => s.uuid) });
		}
		this.serviceId = service.uuid;

		// 获取特征值（重试），并强制匹配固定 UUID（不做猜测）
		let chars: UniBleCharacteristic[] = [];
		let lastCharError: unknown = null;
		for (let i = 0; i < charRetryCount; i += 1) {
			try {
				const chRes = await waitForConnect(uniAsync<{ characteristics?: UniBleCharacteristic[] }>('getBLEDeviceCharacteristics', {
					deviceId,
					serviceId: this.serviceId,
				}));
				chars = chRes.characteristics || [];
				if (chars.length) break;
				if (this.logger?.debug) this.logger.debug('[ble] getBLEDeviceCharacteristics empty, retry...', { attempt: i + 1, serviceId: this.serviceId });
			} catch (e) {
				lastCharError = e;
				if (this.logger?.debug) this.logger.debug('[ble] getBLEDeviceCharacteristics failed, retry...', { attempt: i + 1, serviceId: this.serviceId, error: e });
			}
			await waitForConnect(sleep(charRetryDelayMs));
		}
		if (!chars.length) {
			if (lastCharError) throw lastCharError;
			throw new BmsProtocolError('No BLE characteristics found on service', { serviceId: this.serviceId });
		}

		const writeChar = chars.find((c: UniBleCharacteristic) => normalizeUuid(c.uuid) === this.writeCharUUID) || null;
		const notifyChar = chars.find((c: UniBleCharacteristic) => normalizeUuid(c.uuid) === this.notifyCharUUID) || null;
		if (!writeChar) throw new BmsProtocolError('Write characteristic not found', { expect: this.writeCharUUID, chars: chars.map((c) => c.uuid) });
		if (!notifyChar) throw new BmsProtocolError('Notify characteristic not found', { expect: this.notifyCharUUID, chars: chars.map((c) => c.uuid) });
		const writeProps = writeChar.properties || {};
		const notifyProps = notifyChar.properties || {};
		this._writeSupportsNoResponse = readCapability(writeProps.writeNoResponse);
		this._writeSupportsResponse = readCapability(writeProps.write);
		this._notifySupportsRead = notifyProps.read === true;
		this._bootForceWriteNoResponse = false;
		this._bootReadProbeDisabled = false;
		this._preferWriteWithResponse = isIOS && this._writeSupportsResponse === true;
		if (this.logger?.info) {
			this.logger.info('[ble] write characteristic properties', {
				deviceId,
				writeCharacteristicId: writeChar.uuid,
				properties: writeProps,
				supportsWrite: this._writeSupportsResponse,
				supportsWriteNoResponse: this._writeSupportsNoResponse,
				preferWriteWithResponse: this._preferWriteWithResponse,
			});
			this.logger.info('[ble] notify characteristic properties', {
				deviceId,
				notifyCharacteristicId: notifyChar.uuid,
				properties: notifyProps,
				supportsRead: this._notifySupportsRead,
			});
		}

		this.writeCharId = writeChar.uuid;
		this.notifyCharId = notifyChar.uuid;

		// 打开 notify
		await waitForConnect(uniAsync('notifyBLECharacteristicValueChange', {
			deviceId,
			serviceId: this.serviceId,
			characteristicId: this.notifyCharId,
			state: true,
		}));

			// 注册 notify 回调
			const key = mkNotifyKey(deviceId, this.serviceId, this.notifyCharId);
			notifyCallbacks.set(key, this._notifyCallback);
			this._registerConnectionStateCallback();

			this._rxLogCount = 0;
			const postConnectWarmupMs = isIOS ? 820 : 220;
			if (this.logger?.info) {
				this.logger.info('[ble] post-connect warmup', { deviceId, platform, warmupMs: postConnectWarmupMs });
			}
			// 部分设备在打开 notify 后需要短暂准备时间，iOS App 端首包前需要更长稳定窗口
			await waitForConnect(sleep(postConnectWarmupMs));
			await waitForConnect(this._primeNotifyValue('connect_ready'));
			if (!this._connected) throw new BmsProtocolError('BLE disconnected during connection warmup');

			this.logger && this.logger.info && this.logger.info('[ble] connected:', { deviceId, serviceId: this.serviceId });
			} finally {
				discoveryLease?.release();
				if (this._cancelPendingConnect === cancelPendingConnect) this._cancelPendingConnect = null;
			}
		}

	disconnect(): Promise<void> {
		if (!this._disconnectTask) this._disconnectTask = this._disconnectNative()
		return this._disconnectTask
	}

	private async _disconnectNative(): Promise<void> {
		const cancelPendingConnect = this._cancelPendingConnect;
		this._cancelPendingConnect = null;
		cancelPendingConnect?.();
		const pending = this._pending;
		if (pending) {
			const command = pending.expectBoot ? pending.expect.functionCode & 0xff : undefined;
			clearTimeout(pending.timer);
			this._pending = null;
			this._collector.reset();
			pending.reject(new BmsProtocolError('BLE connection disconnected by app', {
				bootFrameSubmitted: false,
				command,
				deviceId: this.deviceId,
			}));
		}
		if (!this.deviceId) return;
		const deviceId = this.deviceId;
		this._detachConnectionRoutes();
		this._connected = false;
		this._notifyDisconnected();

		try {
			// A late native create must finish before its close; never close a subsequent connection.
			await this._nativeConnectSettled;
			await uniAsync('closeBLEConnection', { deviceId });
			} catch (e) {
				this._disconnectError = e;
				const diagnostic = nativeErrorDiagnostic(e);
				if (Number(diagnostic.errCode) !== 10006 && !/no connection|not connected/i.test(diagnostic.errMsg)) throw e;
			} finally {
				this._connected = false;
				this.deviceId = null;
				this.serviceId = null;
				this.writeCharId = null;
				this.notifyCharId = null;
				this._platform = '';
				this._writeSupportsNoResponse = null;
				this._writeSupportsResponse = null;
				this._notifySupportsRead = false;
				this._bootForceWriteNoResponse = false;
				this._bootReadProbeDisabled = false;
				this._preferWriteWithResponse = false;
				this._iosWriteAckUnreliable = false;
				this._iosWriteTimeoutLogged = false;
				this._bootSessionExclusive = false;
				this._lastWriteTimeoutLogAt = 0;
			}
		}

		_registerConnectionStateCallback() {
			if (!this.deviceId) return;
			ensureConnectionStateListener();
			connectionStateCallbacks.set(this.deviceId, this._connectionCallback);
		}

		_onConnectionStateChange(connected: boolean) {
			this._connected = connected;
			if (connected) return;
			const pending = this._pending;
			if (!pending) {
				this._detachConnectionRoutes();
				this._notifyDisconnected();
				return;
			}
			const command = pending.expectBoot ? pending.expect.functionCode & 0xff : undefined;
			const finalizeSubmitted = command === 0x54 && pending.bootFrameSubmitted === true;
			clearTimeout(pending.timer);
			this._pending = null;
			this._collector.reset();
			pending.reject(new BmsProtocolError('BLE connection disconnected', {
				bootFrameSubmitted: finalizeSubmitted,
				command,
				deviceId: this.deviceId,
			}));
			this._detachConnectionRoutes();
			this._notifyDisconnected();
		}

		_getWriteApiSoftTimeoutMs() {
			if (this._platform !== 'ios') return 4000;
			return this._iosWriteAckUnreliable ? 180 : 320;
		}

		_noteWriteApiTimeout(meta: {
			characteristicId: string
			writeWithResponse: boolean
			chunkLen: number
			fallback?: boolean
			softTimeoutMs?: number
		}) {
			if (this._platform === 'ios' && !this._iosWriteAckUnreliable) {
				this._iosWriteAckUnreliable = true;
				if (this.logger?.info) {
					this.logger.info('[ble] ios write callback latency diagnostic, switch to fast soft-timeout', {
						deviceId: this.deviceId,
						serviceId: this.serviceId,
						characteristicId: meta.characteristicId,
					});
				}
			}
			if (this._platform === 'ios' && !meta.fallback) {
				if (this._iosWriteTimeoutLogged) return;
				this._iosWriteTimeoutLogged = true;
				if (this.logger?.info) {
					this.logger.info('[ble] writeBLECharacteristicValue callback latency diagnostic on ios, rely on notify response', {
						deviceId: this.deviceId,
						serviceId: this.serviceId,
						characteristicId: meta.characteristicId,
						writeWithResponse: meta.writeWithResponse,
						chunkLen: meta.chunkLen,
						softTimeoutMs: meta.softTimeoutMs ?? this._getWriteApiSoftTimeoutMs(),
					});
				}
				return;
			}
			const now = Date.now();
			if (this.logger?.warn && (now - this._lastWriteTimeoutLogAt > 8000 || !!meta.fallback)) {
				this._lastWriteTimeoutLogAt = now;
				this.logger.warn('[ble] writeBLECharacteristicValue timeout, continue waiting for notify', {
					deviceId: this.deviceId,
					serviceId: this.serviceId,
					characteristicId: meta.characteristicId,
					writeWithResponse: meta.writeWithResponse,
					chunkLen: meta.chunkLen,
					fallback: !!meta.fallback,
					softTimeoutMs: meta.softTimeoutMs ?? this._getWriteApiSoftTimeoutMs(),
				});
			}
		}

		_onNotify(arrayBuffer: ArrayBuffer) {
			const expectBoot = this._bootSessionExclusive || !!this._pending?.expectBoot;
			const pending = this._pending;
			if (pending?.expectBoot) {
				const chunk = new Uint8Array(arrayBuffer);
				pending.rxChunkCount = Math.min(9999, (pending.rxChunkCount || 0) + 1);
				pending.rxByteCount = Math.min(1_000_000, (pending.rxByteCount || 0) + chunk.length);
				pending.lastRxHex = u8ToHex(chunk.slice(0, Math.min(32, chunk.length)));
			}
			try {
				if (!expectBoot && this.logger?.debug && this._rxLogCount < 10) {
					this._rxLogCount += 1;
					const u8 = new Uint8Array(arrayBuffer);
					this.logger.debug(`[ble] rx chunk len=${u8.length} head=${u8ToHex(u8.slice(0, Math.min(24, u8.length)))}`);
				}
			} catch (e) {}
			this._collector.push(arrayBuffer);

			while (true) {
				const frame = expectBoot ? this._collector.tryShiftOneBootFrame() : this._collector.tryShiftOneValidFrame();
				if (!frame) break;
				this._tryResolvePending(frame);
				try {
					if (this.logger?.debug) {
						this.logger.debug(`[ble] rx frame len=${frame.length} hex=${u8ToHex(frame)}`);
					}
				} catch (e) {}
			}
		}

		_tryResolvePending(frameBytes: Uint8Array) {
			if (!this._pending) return;
			const pending = this._pending;
			const { expect, resolve, timer, expectBoot } = pending;
			if (!this._isExpectedResponse(frameBytes, expect, expectBoot)) {
				if (expectBoot) {
					pending.unexpectedFrameCount = Math.min(9999, (pending.unexpectedFrameCount || 0) + 1);
					pending.lastUnexpectedFrameHex = u8ToHex(frameBytes.slice(0, Math.min(32, frameBytes.length)));
				}
				return;
			}
			clearTimeout(timer);
			this._pending = null;
			resolve(frameBytes);
		}

		_isExpectedResponse(frameBytes: Uint8Array, expect: ReqExpect, expectBoot?: boolean): boolean {
			try {
				if (expectBoot) {
					return isExpectedBootResponse(frameBytes, expect);
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
			{
				chunkSize = this.writeChunkSize,
				chunkIntervalMs = this.writeChunkIntervalMs,
				writeWithResponse = false,
				writeApiTimeoutMs,
				isRequestActive,
			}: { chunkSize?: number; chunkIntervalMs?: number; writeWithResponse?: boolean; writeApiTimeoutMs?: number; isRequestActive?: () => boolean } = {}
		): Promise<void> {
			if (!this._connected) throw new BmsProtocolError('BLE is not connected');
			const generation = this._connectionGeneration;
			if (!this.deviceId || !this.serviceId || !this.writeCharId) throw new BmsProtocolError('BLE characteristic not ready');

			const bytes = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
			const isBootDataFrame = isBootRequestFrame(bytes) && bytes[3] === 0x53;
			if (isBootDataFrame && bytes.length > chunkSize) {
				throw new BmsProtocolError(`boot_ble_frame_exceeds_mtu:${bytes.length}/${chunkSize}`);
			}
			if (this._bootSessionExclusive && isBootRequestFrame(bytes)) {
				const pending = this._pending;
				const command = bytes[3] & 0xff;
				const sequence = command === 0x53 && bytes.length >= 8 ? ((bytes[6] << 8) | bytes[7]) : undefined;
				let directWriteFallbackUsed = false;
				let directNativeWrites: NativeWriteDiagnostic[] = [];
				const belongsToPending = () => {
					if (!pending) return isRequestActive ? isRequestActive() : true;
					if (this._pending !== pending) return false;
					return isRequestActive
						? isRequestActive()
						: pending.expectBoot === true && pending.expect.functionCode === command;
				};
				const rejectPendingWrite = (error: unknown): BmsProtocolError | null => {
					if (!pending || !belongsToPending()) return null;
					clearTimeout(pending.timer);
					this._pending = null;
					const nativeError = error && typeof error === 'object'
						? error as Record<string, unknown>
						: { error: String(error || '') };
					const writeError = new BmsProtocolError('BLE OTA write failed', {
						...nativeError,
						...nativeErrorDiagnostic(error),
						bootFrameSubmitted: pending.bootFrameSubmitted === true,
						command,
						sequence,
						nativeWrites: pending.nativeWrites,
					});
					pending.reject(writeError);
					this.logger?.error?.('[ble] OTA whole-frame write failed', writeError);
					return writeError;
				};
				const withResponse = this._writeSupportsResponse === true && (this._platform === 'android'
					? !this._bootForceWriteNoResponse
					: writeWithResponse || this._preferWriteWithResponse);
				const initialWriteType: NativeWriteDiagnostic['writeType'] = withResponse ? 'write' : 'writeNoResponse';
				const submitWrite = (writeType: NativeWriteDiagnostic['writeType']) => {
					if (!belongsToPending()) return;
					const startedAt = Date.now();
					const previousWrites = pending?.nativeWrites || directNativeWrites;
					const diagnostic: NativeWriteDiagnostic = {
						attempt: previousWrites.length + 1,
						writeType,
						outcome: 'pending',
					};
					const nextWrites = [...previousWrites.slice(-1), diagnostic];
					if (pending) pending.nativeWrites = nextWrites;
					else directNativeWrites = nextWrites;
					let callbackFinished = false;
					let callbackTimedOut = false;
					const callbackTimer = setTimeout(() => {
						if (callbackFinished) return;
						callbackTimedOut = true;
						diagnostic.outcome = 'timeout';
						diagnostic.rttMs = Date.now() - startedAt;
						if (belongsToPending()) {
							this.logger?.warn?.('[ble] OTA native write callback timeout', {
								command,
								sequence,
								attempt: diagnostic.attempt,
								writeType,
								nativeRttMs: diagnostic.rttMs,
							});
						}
					}, 300);

					const finishSuccess = () => {
						if (callbackFinished) return;
						callbackFinished = true;
						clearTimeout(callbackTimer);
						diagnostic.outcome = callbackTimedOut || !belongsToPending() ? 'late_success' : 'success';
						diagnostic.rttMs = Date.now() - startedAt;
					};
					const finishFailure = (error: unknown) => {
						if (callbackFinished) return;
						callbackFinished = true;
						clearTimeout(callbackTimer);
						const active = belongsToPending();
						const errorDiagnostic = nativeErrorDiagnostic(error);
						diagnostic.outcome = callbackTimedOut || !active ? 'late_failure' : 'failure';
						diagnostic.rttMs = Date.now() - startedAt;
						diagnostic.errCode = errorDiagnostic.errCode;
						diagnostic.errMsg = errorDiagnostic.errMsg;
						if (!active) {
							this.logger?.warn?.('[ble] OTA late native write failure ignored after ACK', {
								command,
								sequence,
								...diagnostic,
							});
							return;
						}
						if (
							this._platform === 'android' &&
							writeType === 'write' &&
							isPropertyNotSupported(error) &&
							(pending ? pending.writeFallbackUsed !== true : !directWriteFallbackUsed) &&
							this._writeSupportsNoResponse !== false
						) {
							if (pending) pending.writeFallbackUsed = true;
							else directWriteFallbackUsed = true;
							this._bootForceWriteNoResponse = true;
							this.logger?.warn?.('[ble] OTA write unsupported, fallback to writeNoResponse', {
								command,
								sequence,
								...errorDiagnostic,
							});
							submitWrite('writeNoResponse');
							return;
						}
						rejectPendingWrite(error);
					};

					try {
						uni.writeBLECharacteristicValue({
							deviceId: this.deviceId,
							serviceId: this.serviceId,
							characteristicId: this.writeCharId,
							...(writeType === 'write'
								? (this._platform === 'android' ? { writeType: 'write' } : {})
								: { writeType: 'writeNoResponse' }),
							value: toArrayBuffer(bytes),
							success: finishSuccess,
							fail: finishFailure,
						});
					} catch (error) {
						finishFailure(error);
					}
				};

				// ACK 是推进 OTA 的唯一依据；原生成功回调只用于诊断。
				this._lastTxAt = Date.now();
				if (pending && belongsToPending() && command === 0x54) pending.bootFrameSubmitted = true;
				submitWrite(initialWriteType);
				this.logger?.debug?.('[ble] OTA whole-frame write', {
					sentAt: this._lastTxAt,
					frameLen: bytes.length,
					writeCapacity: chunkSize,
					writeType: initialWriteType,
				});
				return;
			}
			const hasExplicitWriteApiTimeout = Number.isFinite(writeApiTimeoutMs) && Number(writeApiTimeoutMs) > 0;
			const effectiveWriteApiTimeoutMs =
				hasExplicitWriteApiTimeout
					? Math.max(1, Number(writeApiTimeoutMs))
					: this._getWriteApiSoftTimeoutMs();
			const chunkCount = Math.max(1, Math.ceil(bytes.length / Math.max(1, chunkSize)));
			const totalChunkIntervalMs = Math.max(0, chunkCount - 1) * Math.max(0, chunkIntervalMs);
			const effectiveChunkWriteApiTimeoutMs = hasExplicitWriteApiTimeout
				? Math.max(1, Math.floor(Math.max(1, effectiveWriteApiTimeoutMs - totalChunkIntervalMs) / chunkCount))
				: effectiveWriteApiTimeoutMs;
			if (isBootDataFrame && this.logger?.debug) {
				this.logger.debug('[ble] OTA data write config', {
					frameLen: bytes.length,
					attPayloadSize: chunkSize,
					writeWithResponse: !!writeWithResponse && this._writeSupportsResponse === true,
				});
			}

			for (let offset = 0; offset < bytes.length; offset += chunkSize) {
				if (generation !== this._connectionGeneration) throw new BmsProtocolError('BLE connection changed');
				if (isRequestActive && !isRequestActive()) return;
				const chunk = bytes.slice(offset, Math.min(bytes.length, offset + chunkSize));
				const shouldWriteWithResponse =
					writeWithResponse ||
					(this._preferWriteWithResponse && this._writeSupportsResponse === true);
				try {
					const writeRes = await uniAsyncSoftTimeout<Record<string, unknown> | { __bleApiTimeout: true }>('writeBLECharacteristicValue', {
						deviceId: this.deviceId,
						serviceId: this.serviceId,
						characteristicId: this.writeCharId,
						// 目标特征值为 write without response，但部分运行时不支持 writeType 入参；失败时降级重试一次
						...(shouldWriteWithResponse ? {} : { writeType: 'writeNoResponse' }),
						value: toArrayBuffer(chunk),
					}, {
						timeoutMs: effectiveChunkWriteApiTimeoutMs,
						timeoutValue: this._bleApiTimeoutMarker,
					});
					if ((writeRes as { __bleApiTimeout?: true })?.__bleApiTimeout) {
						this._noteWriteApiTimeout({
							characteristicId: this.writeCharId,
							writeWithResponse: shouldWriteWithResponse,
							chunkLen: chunk.length,
							softTimeoutMs: effectiveChunkWriteApiTimeoutMs,
						});
					}
				} catch (e: any) {
					if (generation !== this._connectionGeneration) throw e;
					if (isRequestActive && !isRequestActive()) return;
					const code = e?.code
					const msg = String(e?.errMsg || e?.message || e || '').toLowerCase()
					if (code === 10007 || msg.includes('property not support') || msg.includes('not support')) {
						const writeRes = await uniAsyncSoftTimeout<Record<string, unknown> | { __bleApiTimeout: true }>('writeBLECharacteristicValue', {
							deviceId: this.deviceId,
							serviceId: this.serviceId,
							characteristicId: this.writeCharId,
							value: toArrayBuffer(chunk),
						}, {
							timeoutMs: effectiveChunkWriteApiTimeoutMs,
							timeoutValue: this._bleApiTimeoutMarker,
						});
						if ((writeRes as { __bleApiTimeout?: true })?.__bleApiTimeout) {
							this._noteWriteApiTimeout({
								characteristicId: this.writeCharId,
								writeWithResponse: true,
								chunkLen: chunk.length,
								fallback: true,
								softTimeoutMs: effectiveChunkWriteApiTimeoutMs,
							});
						}
					} else {
						throw e;
					}
				}
			if (chunkIntervalMs > 0 && offset + chunkSize < bytes.length) await sleep(chunkIntervalMs);
		}
	}

		async writeFrame(
			frameBytes: Uint8Array | ArrayLike<number>,
			{ writeWithResponse = false }: { writeWithResponse?: boolean } = {}
		): Promise<void> {
			const bytes = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
			const generation = this._connectionGeneration;
			const now = Date.now();
			const delta = now - this._lastTxAt;
			if (delta < this.minFrameIntervalMs) await sleep(this.minFrameIntervalMs - delta);
			if (generation !== this._connectionGeneration) throw new BmsProtocolError('BLE connection changed');
			const expectBoot = isBootRequestFrame(bytes);
			if (!expectBoot) this.logger?.debug?.(`[ble] tx frame len=${bytes.length} hex=${u8ToHex(bytes)}`);
			const writeTask = this._writeFrameBytes(bytes, { writeWithResponse });
			if (expectBoot) this.logger?.debug?.(`[ble] tx frame len=${bytes.length} hex=${u8ToHex(bytes)}`);
			await writeTask;
			if (!this._bootSessionExclusive || !isBootRequestFrame(bytes)) this._lastTxAt = Date.now();
		}

	async setMtu(mtu: number): Promise<number | null> {
		if (!this.deviceId) throw new BmsProtocolError('deviceId is required for setMtu');
		const api = (uni as Record<string, any>)?.setBLEMTU;
		if (typeof api !== 'function') throw new BmsProtocolError('setBLEMTU not supported');
		const desired = Math.min(512, Math.max(23, Math.floor(mtu)));
		const res = await uniAsyncHardTimeout<{ mtu?: number }>(
			'setBLEMTU',
			{ deviceId: this.deviceId, mtu: desired },
			{ timeoutMs: 3000 }
		);
		const actual = Number.isInteger(res?.mtu) && Number(res.mtu) >= 23 ? Number(res.mtu) : null;
		if (actual != null) this.writeChunkSize = actual - 3;
		if (this.logger?.info) {
			this.logger.info('[ble] MTU ready', {
				requestedMtu: desired,
				actualMtu: actual,
				actualMtuSource: actual == null ? 'unknown' : 'reported',
				writeCapacity: this.writeChunkSize,
			});
		}
		return actual;
	}

	supportsWriteWithResponse(): boolean {
		return this._writeSupportsResponse === true;
	}

	async getRssi(): Promise<number | null> {
		if (!this.deviceId) return null;
		const api = (uni as Record<string, any>)?.getBLEDeviceRSSI;
		if (typeof api !== 'function') return null;
		const res = await uniAsyncHardTimeout<{ RSSI?: number }>(
			'getBLEDeviceRSSI',
			{ deviceId: this.deviceId },
			{ timeoutMs: 1000 }
		);
		return Number.isFinite(res?.RSSI as number) ? Number(res.RSSI) : null;
	}

	async beginExclusiveBootSession({ drainTimeoutMs = 1200 }: { drainTimeoutMs?: number } = {}): Promise<void> {
		if (this._bootSessionExclusive) throw new BmsProtocolError('BLE transport is already reserved for OTA');
		if (this._writeSupportsResponse !== true && this._writeSupportsNoResponse === false) {
			throw new BmsProtocolError('BLE write characteristic does not support write or writeNoResponse');
		}
		this._registerConnectionStateCallback();
		this._bootForceWriteNoResponse = false;
		this._bootReadProbeDisabled = false;
		this._bootSessionExclusive = true;
		const pending = this._pending;
		if (pending) {
			clearTimeout(pending.timer);
			this._pending = null;
			this._collector.reset();
			pending.reject(new BmsProtocolError('BLE request canceled for OTA exclusive session'));
		}

		let timer: ReturnType<typeof setTimeout> | null = null;
		const drained = await Promise.race([
			this._queue.then(() => true, () => true),
			new Promise<boolean>((resolve) => {
				timer = setTimeout(() => resolve(false), Math.max(100, drainTimeoutMs));
			}),
		]);
		if (timer) clearTimeout(timer);
		if (!drained) {
			this._bootSessionExclusive = false;
			throw new BmsProtocolError('BLE request queue did not drain for OTA');
		}
		this._queue = Promise.resolve(new Uint8Array(0));
		this._collector.reset();
		if (this.logger?.info) {
			this.logger.info('[ble] OTA exclusive session ready', {
				platform: this._platform,
				deviceId: this.deviceId,
				writeCharacteristicId: this.writeCharId,
				notifyCharacteristicId: this.notifyCharId,
				supportsWrite: this._writeSupportsResponse,
				supportsWriteNoResponse: this._writeSupportsNoResponse,
				supportsNotifyRead: this._notifySupportsRead,
				writeCapabilitySource:
					this._writeSupportsResponse == null && this._writeSupportsNoResponse == null
						? 'legacy-unknown'
						: 'reported',
			});
		}
	}

	endExclusiveBootSession(): void {
		if (!this._bootSessionExclusive) return;
		const pending = this._pending;
		if (pending?.expectBoot) {
			clearTimeout(pending.timer);
			this._pending = null;
			pending.reject(new BmsProtocolError('BLE OTA session ended'));
		}
		this._bootSessionExclusive = false;
		this._bootForceWriteNoResponse = false;
		this._bootReadProbeDisabled = false;
		this._collector.reset();
		if (this.logger?.info) this.logger.info('[ble] OTA exclusive session ended');
	}

	/**
	 * 通讯层核心方法：发送请求帧，等待一帧有效回复。
	 * - 为避免“串包”，内部默认强制串行
	 */
	request(
		frameBytes: Uint8Array | ArrayLike<number>,
		{
			timeoutMs = this.requestTimeoutMs,
			bootAckGraceMs,
			writeApiTimeoutMs,
			suppressTimeoutLog = false,
			disableAlternateWriteRetry = false,
		}: BmsRequestOptions = {}
	): Promise<Uint8Array> {
		if (this._bootSessionExclusive && !isBootRequestFrame(frameBytes)) {
			return Promise.reject(new BmsProtocolError('BLE transport is reserved for OTA'));
		}
		const generation = this._connectionGeneration;
		this._queue = this._queue
				.catch(() => new Uint8Array(0))
				.then(() => {
					if (generation !== this._connectionGeneration) throw new BmsProtocolError('BLE connection changed');
					return this._requestWithFallback(frameBytes, {
						timeoutMs,
						bootAckGraceMs,
						writeApiTimeoutMs,
						writeWithResponse: false,
					suppressTimeoutLog,
					disableAlternateWriteRetry,
				})
			});
		return this._queue;
	}

	requestWithResponse(
		frameBytes: Uint8Array | ArrayLike<number>,
		{
			timeoutMs = this.requestTimeoutMs,
			bootAckGraceMs,
			writeApiTimeoutMs,
			suppressTimeoutLog = false,
			disableAlternateWriteRetry = false,
		}: BmsRequestOptions = {}
	): Promise<Uint8Array> {
		if (this._bootSessionExclusive && !isBootRequestFrame(frameBytes)) {
			return Promise.reject(new BmsProtocolError('BLE transport is reserved for OTA'));
		}
		const generation = this._connectionGeneration;
		this._queue = this._queue
				.catch(() => new Uint8Array(0))
				.then(() => {
					if (generation !== this._connectionGeneration) throw new BmsProtocolError('BLE connection changed');
					return this._requestWithFallback(frameBytes, {
						timeoutMs,
						bootAckGraceMs,
						writeApiTimeoutMs,
						writeWithResponse: true,
					suppressTimeoutLog,
					disableAlternateWriteRetry,
				})
			});
		return this._queue;
	}

		async _primeNotifyValue(reason: string): Promise<void> {
			if (!this.deviceId || !this.serviceId || !this.notifyCharId) return;
			try {
				if (this.logger?.debug) this.logger.debug('[ble] prime notify read', { reason });
				const readRes = await uniAsyncSoftTimeout<Record<string, unknown> | { __bleApiTimeout: true }>('readBLECharacteristicValue', {
					deviceId: this.deviceId,
					serviceId: this.serviceId,
					characteristicId: this.notifyCharId,
				}, {
					timeoutMs: this._platform === 'ios' ? 1200 : 3000,
					timeoutValue: this._bleApiTimeoutMarker,
				});
				if ((readRes as { __bleApiTimeout?: true })?.__bleApiTimeout && this.logger?.warn) {
					this.logger.warn('[ble] prime notify read timeout', { reason });
				}
			} catch (e) {
				// ignore prime read errors
			}
		}

	async _requestWithFallback(
		frameBytes: Uint8Array | ArrayLike<number>,
		{
			timeoutMs,
			bootAckGraceMs,
			writeApiTimeoutMs,
			writeWithResponse,
			suppressTimeoutLog,
			disableAlternateWriteRetry,
		}: {
			timeoutMs: number
			bootAckGraceMs?: number
			writeApiTimeoutMs?: number
			writeWithResponse?: boolean
			suppressTimeoutLog?: boolean
			disableAlternateWriteRetry?: boolean
		}
	): Promise<Uint8Array> {
		const generation = this._connectionGeneration;
		if (this._bootSessionExclusive && !isBootRequestFrame(frameBytes)) {
			throw new BmsProtocolError('BLE transport is reserved for OTA');
		}
		try {
			return await this._requestSerial(frameBytes, {
				timeoutMs,
				bootAckGraceMs,
				writeApiTimeoutMs,
				writeWithResponse,
				suppressTimeoutLog,
			});
		} catch (e) {
			if (generation !== this._connectionGeneration) throw e;
			const msg = String((e as any)?.message || (e as any)?.errMsg || e || '');
			const canRetryWithAlternateWriteMode =
				this._platform === 'ios' &&
				!isBootRequestFrame(frameBytes) &&
				!writeWithResponse &&
				!suppressTimeoutLog &&
				!disableAlternateWriteRetry &&
				msg.includes('BLE request timeout') &&
				this._writeSupportsResponse === true &&
				this._writeSupportsNoResponse === true;
			if (!canRetryWithAlternateWriteMode) throw e;
			if (this.logger?.warn) {
				this.logger.warn('[ble] request timeout, retry with alternate write mode', {
					preferWriteWithResponse: this._preferWriteWithResponse,
				});
			}
			const prev = this._preferWriteWithResponse;
			this._preferWriteWithResponse = !prev;
			try {
				await this._primeNotifyValue('timeout_retry');
				await sleep(120);
				if (generation !== this._connectionGeneration) throw new BmsProtocolError('BLE connection changed');
				return await this._requestSerial(frameBytes, {
					timeoutMs,
					writeApiTimeoutMs,
					writeWithResponse: false,
					suppressTimeoutLog,
				});
			} finally {
				if (generation === this._connectionGeneration) this._preferWriteWithResponse = prev;
			}
		}
	}

		async _requestSerial(
			frameBytes: Uint8Array | ArrayLike<number>,
			{
				timeoutMs,
				bootAckGraceMs = 0,
				writeApiTimeoutMs,
				writeWithResponse,
				suppressTimeoutLog,
			}: BmsRequestOptions & { timeoutMs: number; writeWithResponse?: boolean }
		): Promise<Uint8Array> {
		if (this._pending) {
			const ageMs = Date.now() - (this._pending.createdAt || 0);
			if (ageMs > timeoutMs + 500) {
				try {
					clearTimeout(this._pending.timer);
				} catch (e) {}
				if (this.logger?.warn) {
					this.logger.warn('[ble] clear stale pending request before retry', {
						ageMs,
						expect: this._pending.expect,
						expectBoot: !!this._pending.expectBoot,
					});
				}
				this._pending = null;
				this._collector.reset();
			} else {
				throw new BmsProtocolError('Previous request still pending');
			}
		}

		const req = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
		const expectBoot = req[0] === 0x55 && req[1] !== 0x7f;
		if (!expectBoot && req.length < 6) throw new BmsProtocolError('Invalid request frame bytes');
		if (expectBoot && req.length < 9) throw new BmsProtocolError('Invalid boot request frame bytes');

		// 协议要求帧间隔 >100ms，这里做一个最小间隔保护
		const now = Date.now();
		const delta = now - this._lastTxAt;
		if (delta < this.minFrameIntervalMs) await sleep(this.minFrameIntervalMs - delta);
		if (this._bootSessionExclusive && !expectBoot) {
			throw new BmsProtocolError('BLE transport is reserved for OTA');
		}

		const expect: ReqExpect = expectBoot
			? {
					functionCode: req[3] & 0xff,
					targetAddress: req[1] & 0xff, // host addr
					sourceAddress: req[2] & 0xff, // slave addr
					bootRequested: req[3] === 0x53 && req.length >= 11 ? ((req[6] << 8) | req[7]) + 1 : undefined,
				}
			: {
					functionCode: req[4] & 0xff,
					// 目标地址/来源地址：回复时应互换
					targetAddress: req[2] & 0xff, // host addr
					sourceAddress: req[3] & 0xff, // slave addr
				};

		const deferred = defer<Uint8Array>();
		const graceMs = expect.bootRequested != null ? Math.max(0, bootAckGraceMs) : 0;
		// 清空上一次请求遗留的残包，避免超时后的半帧污染下一次请求。
		this._collector.reset();
		const timer = setTimeout(() => {
			const pending = this._pending;
			if (pending?.reject !== deferred.reject) return;
			const timeoutDiagnostic = {
				...this._collector.snapshotHex(),
				rxChunkCount: pending.rxChunkCount || 0,
				rxByteCount: pending.rxByteCount || 0,
				lastRxHex: pending.lastRxHex || '',
				unexpectedFrameCount: pending.unexpectedFrameCount || 0,
				lastUnexpectedFrameHex: pending.lastUnexpectedFrameHex || '',
				nativeWrites: (pending.nativeWrites || []).map((item) => ({ ...item })),
				readProbe: pending.readProbe ? { ...pending.readProbe } : undefined,
			};
			this._pending = null;
			try {
				if (!suppressTimeoutLog && this.logger?.warn) {
					this.logger.warn('[ble] request timeout snapshot', { expect, ...timeoutDiagnostic });
				}
			} catch (e) {}
			this._collector.reset();
			deferred.reject(new BmsProtocolError(`BLE request timeout after ${timeoutMs}ms + ${graceMs}ms grace`, {
				expect,
				bootAckGraceMs: graceMs,
				...timeoutDiagnostic,
			}));
		}, timeoutMs + graceMs);
		this._pending = {
			resolve: deferred.resolve,
			reject: deferred.reject,
			expect,
			timer,
			expectBoot,
			createdAt: Date.now(),
			nativeWrites: [],
			rxChunkCount: 0,
			rxByteCount: 0,
			unexpectedFrameCount: 0,
		};
		const respPromise = deferred.promise;
		const pendingRef = this._pending;
		if (
			this._platform === 'android' &&
			expectBoot &&
			expect.functionCode === 0x53 &&
			graceMs > 0 &&
			this._notifySupportsRead &&
			!this._bootReadProbeDisabled
		) {
			setTimeout(() => {
				if (this._pending !== pendingRef || !this.deviceId || !this.serviceId || !this.notifyCharId) return;
				const startedAt = Date.now();
				pendingRef.readProbe = { outcome: 'started' };
				this.logger?.debug?.('[ble] OTA probe read notify', { requested: expect.bootRequested, ms: timeoutMs });
				void uniAsyncSoftTimeout<Record<string, unknown> | { __bleApiTimeout: true }>('readBLECharacteristicValue', {
					deviceId: this.deviceId,
					serviceId: this.serviceId,
					characteristicId: this.notifyCharId,
				}, {
					timeoutMs: Math.max(1, Math.min(180, graceMs || 180)),
					timeoutValue: this._bleApiTimeoutMarker,
				}).then((readRes) => {
					const timedOut = (readRes as { __bleApiTimeout?: true })?.__bleApiTimeout === true;
					pendingRef.readProbe = {
						outcome: timedOut ? 'timeout' : 'success',
						rttMs: Date.now() - startedAt,
					};
				}, (error) => {
					const diagnostic = nativeErrorDiagnostic(error);
					pendingRef.readProbe = {
						outcome: 'failure',
						rttMs: Date.now() - startedAt,
						...diagnostic,
					};
					if (isPropertyNotSupported(error)) this._bootReadProbeDisabled = true;
				});
			}, timeoutMs);
		}
		// 普通请求的写 API 尚未返回时，OTA 也可能取消它；先挂接拒绝处理。
		void respPromise.catch(() => undefined);

		try {
			if (!expectBoot) this.logger?.debug?.(`[ble] tx frame len=${req.length} hex=${u8ToHex(req)}`);
			const writeTask = this._writeFrameBytes(req, {
				writeWithResponse: !!writeWithResponse, writeApiTimeoutMs,
				isRequestActive: () => this._pending === pendingRef,
			});
			if (expectBoot) this.logger?.debug?.(`[ble] tx frame len=${req.length} hex=${u8ToHex(req)}`);
			// 取消/超时立即释放队列；普通 ACK 仍保留原来的写 API 等待语义。
			await Promise.race([writeTask, respPromise.then(() => writeTask)]);
			if (!this._bootSessionExclusive || !expectBoot) this._lastTxAt = Date.now();

			// 某些设备/运行时不会主动推送 notify，需要通过 read 触发 value change（特征值含 Read 属性时）
			if (!expectBoot) void (async () => {
				const delays = [220, 520, 900, 1400, 2100, 3000, 4200, 5600, 7200, 9000, 11000, 13000];
				for (let idx = 0; idx < delays.length; idx += 1) {
					const ms = delays[idx];
					const prev = idx === 0 ? 0 : delays[idx - 1];
					await sleep(ms - prev);
					if (this._bootSessionExclusive || !this._pending || this._pending !== pendingRef) return;
					if (!this.deviceId || !this.serviceId || !this.notifyCharId) return;
					try {
						if (this.logger?.debug) this.logger.debug('[ble] probe read notify', { ms });
						const readRes = await uniAsyncSoftTimeout<Record<string, unknown> | { __bleApiTimeout: true }>('readBLECharacteristicValue', {
							deviceId: this.deviceId,
							serviceId: this.serviceId,
							characteristicId: this.notifyCharId,
						}, {
							timeoutMs: this._platform === 'ios' ? 1200 : 3000,
							timeoutValue: this._bleApiTimeoutMarker,
						});
						if ((readRes as { __bleApiTimeout?: true })?.__bleApiTimeout && this.logger?.warn) {
							this.logger.warn('[ble] probe read notify timeout', { ms });
						}
					} catch (e) {
						// ignore probe errors
					}
				}
			})();

			return await respPromise;
		} catch (e) {
			const pending = this._pending;
			if (pending?.reject === deferred.reject) {
				clearTimeout(pending.timer);
				this._pending = null;
				this._collector.reset();
			}
			throw e;
		}
	}
	}

	export function createUniBleBmsTransport(options: UniBleBmsTransportOptions): UniBleBmsTransport {
		return new UniBleBmsTransport(options);
	}
