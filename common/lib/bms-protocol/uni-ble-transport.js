import { BmsProtocolError, parseFrame } from './frame.js';

function toArrayBuffer(u8) {
	if (u8 instanceof ArrayBuffer) return u8;
	const bytes = u8 instanceof Uint8Array ? u8 : Uint8Array.from(u8);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUuid(uuid) {
	return String(uuid || '').toLowerCase();
}

function mkNotifyKey(deviceId, serviceId, characteristicId) {
	return `${deviceId}|${normalizeUuid(serviceId)}|${normalizeUuid(characteristicId)}`;
}

const notifyCallbacks = new Map();
let notifyListenerInstalled = false;

function ensureNotifyListener() {
	if (notifyListenerInstalled) return;
	// uniapp 没有 offBLECharacteristicValueChange，因此这里用“路由分发”的方式避免多实例冲突
	uni.onBLECharacteristicValueChange((res) => {
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
	constructor({ logger }) {
		this._logger = logger;
		this._buf = new Uint8Array(0);
	}

	push(arrayBufferOrBytes) {
		const chunk = arrayBufferOrBytes instanceof ArrayBuffer ? new Uint8Array(arrayBufferOrBytes) : new Uint8Array(arrayBufferOrBytes);
		const merged = new Uint8Array(this._buf.length + chunk.length);
		merged.set(this._buf, 0);
		merged.set(chunk, this._buf.length);
		this._buf = merged;
	}

	/**
	 * 尝试从缓冲区中提取一个“完整帧”：
	 * - 帧头：7F 55
	 * - 帧尾：FD
	 * - 使用 parseFrame 验证 CRC（不通过则继续向后找）
	 */
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
			// 没找到头码，清空（或保留最后 1 字节以避免头码跨包）
			this._buf = bytes.slice(Math.max(0, bytes.length - 1));
			return null;
		}
		if (start > 0) this._buf = bytes.slice(start);

		// 从头码之后寻找尾码
		for (let j = 2; j < this._buf.length; j += 1) {
			if (this._buf[j] !== 0xfd) continue;
			const candidate = this._buf.slice(0, j + 1);
			try {
				// 验证 CRC / 帧合法性
				parseFrame(candidate);
				this._buf = this._buf.slice(j + 1);
				return candidate;
			} catch (e) {
				// CRC 不通过时，继续找下一个尾码
				if (this._logger && this._logger.debug) this._logger.debug('[ble] drop invalid frame:', e && e.message);
			}
		}

		// 没有完整帧，保留缓冲
		return null;
	}
}

function uniAsync(apiName, args) {
	return new Promise((resolve, reject) => {
		uni[apiName]({
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
	constructor({
		serviceUUID = '0000ffc0-0000-1000-8000-00805f9b34fb',
		writeCharUUID = '0000ff03-0000-1000-8000-00805f9b34fb',
		notifyCharUUID = '0000ffc1-0000-1000-8000-00805f9b34fb',
		writeChunkSize = 20,
		writeChunkIntervalMs = 20,
		minFrameIntervalMs = 120,
		requestTimeoutMs = 1500,
		logger = console,
	} = {}) {
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
		this._queue = Promise.resolve(); // 串行化 request，避免并发导致“回复帧串包”
	}

	async init() {
		// 初始化蓝牙模块（必须调用）
		await uniAsync('openBluetoothAdapter', {});
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
	async discover({ durationMs = 5000, services = [this.serviceUUID], allowDuplicatesKey = false } = {}) {
		await this.init();
		await uniAsync('startBluetoothDevicesDiscovery', {
			services: services ? services.map(normalizeUuid) : undefined,
			allowDuplicatesKey,
		});
		await sleep(durationMs);
		await uniAsync('stopBluetoothDevicesDiscovery', {});
		const res = await uniAsync('getBluetoothDevices', {});
		return (res.devices || []).map((d) => ({
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
	async connect({ deviceId } = {}) {
		if (!deviceId) throw new BmsProtocolError('deviceId is required for BLE connect');
		await this.init();
		this.deviceId = deviceId;

		await uniAsync('createBLEConnection', { deviceId });
		this._connected = true;

		// 获取服务
		const srvRes = await uniAsync('getBLEDeviceServices', { deviceId });
		const services = srvRes.services || [];
		const service = services.find((s) => normalizeUuid(s.uuid) === this.serviceUUID) || services[0];
		if (!service) throw new BmsProtocolError('No BLE services found on device');
		this.serviceId = service.uuid;

		// 获取特征值
		const chRes = await uniAsync('getBLEDeviceCharacteristics', { deviceId, serviceId: this.serviceId });
		const chars = chRes.characteristics || [];
		const writeChar = chars.find((c) => normalizeUuid(c.uuid) === this.writeCharUUID) || chars.find((c) => c.properties && (c.properties.write || c.properties.writeNoResponse));
		const notifyChar = chars.find((c) => normalizeUuid(c.uuid) === this.notifyCharUUID) || chars.find((c) => c.properties && c.properties.notify);

		if (!writeChar) throw new BmsProtocolError('Write characteristic not found');
		if (!notifyChar) throw new BmsProtocolError('Notify characteristic not found');

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

	_onNotify(arrayBuffer) {
		this._collector.push(arrayBuffer);

		while (true) {
			const frame = this._collector.tryShiftOneValidFrame();
			if (!frame) break;
			this._tryResolvePending(frame);
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
		} catch (e) {
			return false;
		}
	}

	async _writeFrameBytes(frameBytes, { chunkSize = this.writeChunkSize, chunkIntervalMs = this.writeChunkIntervalMs } = {}) {
		if (!this._connected) throw new BmsProtocolError('BLE is not connected');
		if (!this.deviceId || !this.serviceId || !this.writeCharId) throw new BmsProtocolError('BLE characteristic not ready');

		const bytes = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);

		for (let offset = 0; offset < bytes.length; offset += chunkSize) {
			const chunk = bytes.slice(offset, Math.min(bytes.length, offset + chunkSize));
			await uniAsync('writeBLECharacteristicValue', {
				deviceId: this.deviceId,
				serviceId: this.serviceId,
				characteristicId: this.writeCharId,
				// 部分平台支持 writeType: 'writeNoResponse'
				writeType: 'writeNoResponse',
				value: toArrayBuffer(chunk),
			});
			if (chunkIntervalMs > 0 && offset + chunkSize < bytes.length) await sleep(chunkIntervalMs);
		}
	}

	/**
	 * 通讯层核心方法：发送请求帧，等待一帧有效回复。
	 * - 为避免“串包”，内部默认强制串行
	 */
	request(frameBytes, { timeoutMs = this.requestTimeoutMs } = {}) {
		this._queue = this._queue.then(() => this._requestSerial(frameBytes, { timeoutMs }));
		return this._queue;
	}

	async _requestSerial(frameBytes, { timeoutMs }) {
		if (this._pending) throw new BmsProtocolError('Previous request still pending');

		const req = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
		if (req.length < 6) throw new BmsProtocolError('Invalid request frame bytes');

		// 协议要求帧间隔 >100ms，这里做一个最小间隔保护
		const now = Date.now();
		const delta = now - this._lastTxAt;
		if (delta < this.minFrameIntervalMs) await sleep(this.minFrameIntervalMs - delta);

		const expect = {
			functionCode: req[4] & 0xff,
			// 目标地址/来源地址：回复时应互换
			targetAddress: req[2] & 0xff, // host addr
			sourceAddress: req[3] & 0xff, // slave addr
		};

		const respPromise = new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				if (this._pending && this._pending.reject === reject) this._pending = null;
				reject(new BmsProtocolError(`BLE request timeout after ${timeoutMs}ms`, { expect }));
			}, timeoutMs);
			this._pending = { resolve, reject, expect, timer };
		});

		try {
			await this._writeFrameBytes(req);
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

export function createUniBleBmsTransport(options) {
	return new UniBleBmsTransport(options);
}

