import { BMS_FUNC, BmsProtocolError, buildReadFrame, parseFrame } from './frame'
import { parseBootFrame } from './boot-frame'

type LoggerLike = {
	debug?: (...args: any[]) => void
	info?: (...args: any[]) => void
	warn?: (...args: any[]) => void
	error?: (...args: any[]) => void
}

type ReqExpect = {
	functionCode: number
	targetAddress: number
	sourceAddress: number
	socketStartAddress?: number
	socketQuantity?: number
}

function isExpectedBootSourceAddress(expectedSourceAddress: number, parsedSourceAddress: number): boolean {
	const expect = expectedSourceAddress & 0xff
	const actual = parsedSourceAddress & 0xff
	if (expect === 0x00) return true
	if (actual === expect) return true
	return expect === 0xfc && (actual === 0x01 || actual === 0xfd)
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms))
}

function bytesToHexUpper(bytes: Uint8Array): string {
	let s = ''
	for (let i = 0; i < bytes.length; i += 1) s += (bytes[i] & 0xff).toString(16).padStart(2, '0')
	return s.toUpperCase()
}

function hexToBytes(hex: string): Uint8Array {
	const clean = String(hex || '')
		.trim()
		.replace(/^0x/i, '')
		.replace(/[^0-9a-fA-F]/g, '')
	if (!clean || clean.length % 2 !== 0) throw new BmsProtocolError('Invalid hex payload')
	const out = new Uint8Array(clean.length / 2)
	for (let i = 0; i < clean.length; i += 2) out[i / 2] = parseInt(clean.slice(i, i + 2), 16) & 0xff
	return out
}

const SOCKET_CLOUD_READ_START = 0x0900
const SOCKET_CLOUD_READ_END_EXCLUSIVE = 0x0924
const SOCKET_OWNER_FEATURE = 'mqtt_socket_owner_v1'
const SOCKET_READY_TIMEOUT_MS = 1200
const SOCKET_HEARTBEAT_MS = 15000
const MAX_BOOT_FRAME_BYTES = 2048
const DEFAULT_SLEEP_WAKEUP_IDLE_MS = 30000
const DEFAULT_SLEEP_WAKEUP_RESEND_DELAY_MS = 1200

export const MQTT_SOCKET_OCCUPIED_CODE = 'MQTT_SOCKET_OCCUPIED'

export class MqttSocketOccupiedError extends BmsProtocolError {
	code = MQTT_SOCKET_OCCUPIED_CODE
	retryAfterMs: number

	constructor(message: string, retryAfterMs = 30000) {
		super(message || 'MQTT socket occupied', { code: MQTT_SOCKET_OCCUPIED_CODE, retryAfterMs })
		this.name = 'MqttSocketOccupiedError'
		this.retryAfterMs = retryAfterMs
	}
}

export function isMqttSocketOccupiedError(err: unknown): boolean {
	const anyErr = err as any
	return !!anyErr && (anyErr.code === MQTT_SOCKET_OCCUPIED_CODE || anyErr?.extra?.code === MQTT_SOCKET_OCCUPIED_CODE)
}

function isSocketCloudReadRange(startAddress: number, quantity: number): boolean {
	if (!Number.isFinite(startAddress) || !Number.isFinite(quantity) || quantity <= 0) return false
	const endAddress = startAddress + quantity
	return startAddress >= SOCKET_CLOUD_READ_START && endAddress <= SOCKET_CLOUD_READ_END_EXCLUSIVE
}

function buildMqttSocketReadFrame(reqFrameBytes: Uint8Array): Uint8Array {
	if (reqFrameBytes.length < 9) return reqFrameBytes
	if (reqFrameBytes[0] !== 0x7f || reqFrameBytes[1] !== 0x55) return reqFrameBytes
	const func = reqFrameBytes[4] & 0xff
	if (func !== BMS_FUNC.READ_HOLDING_REGISTERS) return reqFrameBytes
	const sourceAddress = reqFrameBytes[2] & 0xff
	const startAddress = (reqFrameBytes[5] << 8) | reqFrameBytes[6]
	const quantity = (reqFrameBytes[7] << 8) | reqFrameBytes[8]
	if (!isSocketCloudReadRange(startAddress, quantity)) return reqFrameBytes
	return buildReadFrame({
		sourceAddress,
		targetAddress: 0xfa,
		functionCode: BMS_FUNC.SOCKET_READ,
		startAddress,
		quantity,
	})
}

function isSocketWakeupQueryFrame(reqFrameBytes: Uint8Array, expectBoot: boolean): boolean {
	if (expectBoot) return false
	if (reqFrameBytes.length < 9) return false
	if (reqFrameBytes[0] !== 0x7f || reqFrameBytes[1] !== 0x55) return false
	const func = reqFrameBytes[4] & 0xff
	return func === BMS_FUNC.READ_HOLDING_REGISTERS || func === BMS_FUNC.SOCKET_READ
}

export function shouldScheduleSocketWakeupResend(
	reqFrameBytes: Uint8Array | ArrayLike<number>,
	{
		expectBoot,
		lastResponseAt,
		now,
		idleMs,
		delayMs,
		timeoutMs,
	}: {
		expectBoot: boolean
		lastResponseAt: number
		now: number
		idleMs: number
		delayMs: number
		timeoutMs: number
	},
): boolean {
	const req = reqFrameBytes instanceof Uint8Array ? reqFrameBytes : Uint8Array.from(reqFrameBytes)
	if (!isSocketWakeupQueryFrame(req, expectBoot)) return false
	if (!Number.isFinite(delayMs) || delayMs <= 0) return false
	if (!Number.isFinite(timeoutMs) || timeoutMs <= delayMs + 200) return false
	if (!Number.isFinite(idleMs) || idleMs <= 0) return true
	if (!Number.isFinite(lastResponseAt) || lastResponseAt <= 0) return true
	return now - lastResponseAt >= idleMs
}

function formatErr(err: unknown): string {
	if (!err) return ''
	if (err instanceof Error) return err.message || String(err)
	if (typeof err === 'string') return err
	try {
		return JSON.stringify(err)
	} catch {
		return String(err)
	}
}

function bootHex(value: number): string {
	return `0x${(value & 0xff).toString(16).padStart(2, '0').toUpperCase()}`
}

function bootSeqHex(value: number): string {
	return `0x${(value & 0xffff).toString(16).padStart(4, '0').toUpperCase()}`
}

function getBootFrameTrace(bytes: Uint8Array | ArrayLike<number>): Record<string, unknown> | null {
	const u8 = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
	if (!u8 || u8.length < 6 || u8[0] !== 0x55) return null
	const dataLen = ((u8[4] & 0xff) << 8) | (u8[5] & 0xff)
	const command = u8[3] & 0xff
	const trace: Record<string, unknown> = {
		cmd: bootHex(command),
		sourceAddress: bootHex(u8[1] & 0xff),
		targetAddress: bootHex(u8[2] & 0xff),
		dataLen,
		frameLen: u8.length,
	}
	if (command === 0x53 && dataLen >= 2 && u8.length >= 8) {
		if (dataLen === 3 && u8.length >= 9) {
			const requested = ((u8[7] & 0xff) << 8) | (u8[8] & 0xff)
			trace.status = u8[6] & 0xff
			trace.requested = requested
			trace.requestedHex = bootSeqHex(requested)
			trace.ackForPacket = requested > 0 ? requested - 1 : undefined
			trace.ackForPacketHex = requested > 0 ? bootSeqHex(requested - 1) : undefined
		} else {
			const packetIndex = ((u8[6] & 0xff) << 8) | (u8[7] & 0xff)
			trace.packetIndex = packetIndex
			trace.packetIndexHex = bootSeqHex(packetIndex)
			trace.expectedAck = packetIndex + 1
			trace.expectedAckHex = bootSeqHex(packetIndex + 1)
			trace.packetDataBytes = Math.max(0, dataLen - 2)
		}
	}
	return trace
}

class FrameCollector {
	private _logger?: LoggerLike
	private _buf: Uint8Array

	constructor({ logger }: { logger?: LoggerLike }) {
		this._logger = logger
		this._buf = new Uint8Array(0)
	}

	push(bytes: Uint8Array | ArrayLike<number>) {
		const chunk = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
		const merged = new Uint8Array(this._buf.length + chunk.length)
		merged.set(this._buf, 0)
		merged.set(chunk, this._buf.length)
		this._buf = merged
	}

	tryShiftOneValidFrame(): Uint8Array | null {
		const bytes = this._buf
		if (bytes.length < 6) return null

		let start = -1
		for (let i = 0; i < bytes.length - 1; i += 1) {
			if (bytes[i] === 0x7f && bytes[i + 1] === 0x55) {
				start = i
				break
			}
		}
		if (start < 0) {
			this._buf = bytes.slice(Math.max(0, bytes.length - 1))
			return null
		}
		if (start > 0) this._buf = bytes.slice(start)

		for (let j = 2; j < this._buf.length; j += 1) {
			if (this._buf[j] !== 0xfd) continue
			const candidate = this._buf.slice(0, j + 1)
			try {
				parseFrame(candidate)
				this._buf = this._buf.slice(j + 1)
				return candidate
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e)
				this._logger?.debug && this._logger.debug('[socket] drop invalid frame:', msg)
			}
		}
		return null
	}

	tryShiftOneBootFrame(): Uint8Array | null {
		for (;;) {
			const bytes = this._buf
			if (bytes.length < 9) return null

			let start = -1
			for (let i = 0; i < bytes.length; i += 1) {
				if (bytes[i] === 0x55) {
					start = i
					break
				}
			}
			if (start < 0) {
				this._buf = bytes.slice(Math.max(0, bytes.length - 1))
				return null
			}
			if (start > 0) this._buf = bytes.slice(start)

			if (this._buf.length < 9) return null
			const dataLen = ((this._buf[4] & 0xff) << 8) | (this._buf[5] & 0xff)
			const expectedLen = 1 + 1 + 1 + 1 + 2 + dataLen + 2 + 1
			if (expectedLen < 9 || expectedLen > MAX_BOOT_FRAME_BYTES) {
				this._logger?.debug &&
					this._logger.debug('[socket] drop invalid boot candidate length:', { dataLen, expectedLen })
				this._buf = this._buf.slice(1)
				continue
			}
			if (expectedLen > this._buf.length) return null
			const candidate = this._buf.slice(0, expectedLen)
			if (candidate[candidate.length - 1] !== 0xfd) {
				this._buf = this._buf.slice(1)
				continue
			}
			try {
				parseBootFrame(candidate)
				this._buf = this._buf.slice(expectedLen)
				return candidate
			} catch (e) {
				this._buf = this._buf.slice(1)
				continue
			}
		}
	}
}

function defer<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason?: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

export type UniMqttSocketBmsTransportOptions = {
	wsUrl: string
	deviceId: string
	token: string
	platform?: string
	minFrameIntervalMs?: number
	requestTimeoutMs?: number
	sleepWakeupIdleMs?: number
	sleepWakeupResendDelayMs?: number
	logger?: LoggerLike
}

// 基于后端 WebSocket 桥接的“MQTT透传”Transport（payload 为 JSON {hex}，由后端完成 MQTT publish/subscribe）
export class UniMqttSocketBmsTransport {
	wsUrl: string
	deviceId: string
	token: string
	platform: string
	minFrameIntervalMs: number
	requestTimeoutMs: number
	sleepWakeupIdleMs: number
	sleepWakeupResendDelayMs: number
	logger: LoggerLike

	// NOTE: 为兼容非HBuilderX/CI的TS环境，这里不强依赖 UniApp.SocketTask 类型
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _socketTask: any | null
	private _connected: boolean
	private _collector: FrameCollector
	private _queue: Promise<any>
	private _bridgeError: string
	private _pending:
		| null
		| {
				resolve: (frame: Uint8Array) => void
				reject: (err: unknown) => void
				expect: ReqExpect
				timer: ReturnType<typeof setTimeout>
				wakeupTimer?: ReturnType<typeof setTimeout> | null
				wakeupResent?: boolean
				expectBoot?: boolean
		  }

	private _lastTxAt: number
	private _lastResponseAt: number
	private _heartbeatTimer: ReturnType<typeof setInterval> | null

	constructor(options: UniMqttSocketBmsTransportOptions) {
		this.wsUrl = options.wsUrl
		this.deviceId = options.deviceId
		this.token = options.token
		this.platform = String(options.platform || '').trim()
		this.minFrameIntervalMs = options.minFrameIntervalMs ?? 80
		this.requestTimeoutMs = options.requestTimeoutMs ?? 10000
		this.sleepWakeupIdleMs = options.sleepWakeupIdleMs ?? DEFAULT_SLEEP_WAKEUP_IDLE_MS
		this.sleepWakeupResendDelayMs = options.sleepWakeupResendDelayMs ?? DEFAULT_SLEEP_WAKEUP_RESEND_DELAY_MS
		this.logger = options.logger ?? console

		this._socketTask = null
		this._connected = false
		this._collector = new FrameCollector({ logger: this.logger })
		this._queue = Promise.resolve()
		this._bridgeError = ''
		this._pending = null
		this._lastTxAt = 0
		this._lastResponseAt = 0
		this._heartbeatTimer = null
	}

	get connected() {
		return this._connected
	}

	async connect(): Promise<void> {
		if (this._connected) return
		if (!this.wsUrl) throw new BmsProtocolError('wsUrl is required')
		if (!this.deviceId) throw new BmsProtocolError('deviceId is required')
		if (!this.token) throw new BmsProtocolError('token is required')

		const { promise, resolve, reject } = defer<void>()
		let settled = false
		let readyTimer: ReturnType<typeof setTimeout> | null = null
		const clearReadyTimer = () => {
			if (readyTimer) clearTimeout(readyTimer)
			readyTimer = null
		}
		const finishReady = () => {
			if (settled) return
			settled = true
			clearReadyTimer()
			this._connected = true
			this._startHeartbeat()
			resolve()
		}
		const failReady = (err: unknown) => {
			if (settled) return
			settled = true
			clearReadyTimer()
			this._connected = false
			this._stopHeartbeat()
			reject(err)
		}

		const socketTask = uni.connectSocket({
			url: this.wsUrl,
			success: () => {},
			fail: (e: any) => failReady(new BmsProtocolError('WebSocket connect failed', e)),
		})
		this._socketTask = socketTask

		socketTask.onOpen(() => {
			try {
				const initPayload: Record<string, unknown> = {
					device_id: this.deviceId,
					token: this.token,
					features: [SOCKET_OWNER_FEATURE],
				}
				if (this.platform) initPayload.platform = this.platform
				socketTask.send({
					data: JSON.stringify(initPayload),
					success: () => {
						readyTimer = setTimeout(() => finishReady(), SOCKET_READY_TIMEOUT_MS)
					},
					fail: (e: any) => failReady(new BmsProtocolError('WebSocket auth send failed', e)),
				})
			} catch (e) {
				failReady(e)
			}
		})

		socketTask.onClose(() => {
			this._connected = false
			this._stopHeartbeat()
			if (!settled) {
				failReady(new BmsProtocolError(this._bridgeError || 'WebSocket closed'))
			}
			if (this._pending) {
				const p = this._pending
				this._clearPendingTimers(p)
				this._pending = null
				p.reject(new BmsProtocolError(this._bridgeError || 'WebSocket closed'))
			}
		})

		socketTask.onError((e: any) => {
			this._connected = false
			this._stopHeartbeat()
			const err = new BmsProtocolError('WebSocket error', e)
			if (!settled) failReady(err)
			if (this._pending) {
				const p = this._pending
				this._clearPendingTimers(p)
				this._pending = null
				p.reject(err)
			}
		})

		socketTask.onMessage((res: { data: unknown }) => {
			try {
				const txt = typeof res.data === 'string' ? res.data : String(res.data || '')
				if (txt === 'pong') return
				let payloadHex = ''
				let obj: any = null
				try {
					obj = JSON.parse(txt)
				} catch {
					// ignore
				}
				const controlType = String(obj?.type || '').trim()
				if (controlType === 'socket_ready') {
					finishReady()
					return
				}
				if (controlType === 'socket_occupied') {
					const err = new MqttSocketOccupiedError(String(obj?.message || 'MQTT socket occupied'), Number(obj?.retry_after_ms || 30000))
					this._bridgeError = err.message
					this._rejectPending(err)
					failReady(err)
					try {
						socketTask.close({})
					} catch (e) {}
					return
				}
				if (controlType === 'socket_error') {
					const err = new BmsProtocolError(String(obj?.message || 'MQTT socket error'), obj)
					this._bridgeError = err.message
					this._rejectPending(err)
					failReady(err)
					try {
						socketTask.close({})
					} catch (e) {}
					return
				}
				payloadHex = String(obj?.hex || '')
				if (!payloadHex) {
					this._bridgeError = txt
					const err = new BmsProtocolError(txt || 'WebSocket bridge rejected')
					if (!settled) {
						failReady(err)
					} else if (this._pending) {
						this._rejectPending(err)
					}
					try {
						socketTask.close({})
					} catch (e) {}
					return
				}
				const bytes = hexToBytes(payloadHex)
				this._collector.push(bytes)
				const expectBoot = !!this._pending?.expectBoot
				for (;;) {
					const frame = expectBoot ? this._collector.tryShiftOneBootFrame() : this._collector.tryShiftOneValidFrame()
					if (!frame) break
					this._handleFrame(frame)
				}
			} catch (e) {
				this.logger?.debug && this.logger.debug('[socket] onMessage parse failed:', e)
			}
		})

		await promise
	}

	async disconnect(): Promise<void> {
		this._connected = false
		this._stopHeartbeat()
		if (this._pending) {
			const p = this._pending
			this._clearPendingTimers(p)
			this._pending = null
			p.reject(new BmsProtocolError('Disconnected'))
		}
		try {
			this._socketTask?.close({})
		} catch {}
		this._socketTask = null
	}

	private _startHeartbeat() {
		this._stopHeartbeat()
		this._heartbeatTimer = setInterval(() => {
			if (!this._connected || !this._socketTask) return
			try {
				this._socketTask.send({ data: 'ping' })
			} catch (e) {}
		}, SOCKET_HEARTBEAT_MS)
	}

	private _stopHeartbeat() {
		if (this._heartbeatTimer) clearInterval(this._heartbeatTimer)
		this._heartbeatTimer = null
	}

	private _rejectPending(err: unknown) {
		if (!this._pending) return
		const p = this._pending
		this._clearPendingTimers(p)
		this._pending = null
		p.reject(err)
	}

	private _clearPendingTimers(pending: { timer: ReturnType<typeof setTimeout>; wakeupTimer?: ReturnType<typeof setTimeout> | null }) {
		clearTimeout(pending.timer)
		if (pending.wakeupTimer) clearTimeout(pending.wakeupTimer)
		pending.wakeupTimer = null
	}

	request(frameBytes: Uint8Array | ArrayLike<number>, { timeoutMs = this.requestTimeoutMs }: { timeoutMs?: number } = {}): Promise<Uint8Array> {
		this._queue = this._queue.catch(() => undefined).then(() => this._requestSerial(frameBytes, { timeoutMs }))
		return this._queue
	}

	private async _requestSerial(frameBytes: Uint8Array | ArrayLike<number>, { timeoutMs }: { timeoutMs: number }): Promise<Uint8Array> {
		if (!this._connected || !this._socketTask) throw new BmsProtocolError('WebSocket is not connected')
		if (this._pending) throw new BmsProtocolError('Previous request still pending')

		const serialStartedAt = Date.now()
		const rawReq = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes)
		const req = buildMqttSocketReadFrame(rawReq)
		const expectBoot = req[0] === 0x55 && req[1] !== 0x7f
		const bootTrace = expectBoot ? getBootFrameTrace(req) : null
		if (!expectBoot && req.length < 6) throw new BmsProtocolError('Invalid request frame bytes')
		if (expectBoot && req.length < 9) throw new BmsProtocolError('Invalid boot request frame bytes')

		const now = Date.now()
		const delta = now - this._lastTxAt
		let waitBeforeSendMs = 0
		if (delta < this.minFrameIntervalMs) {
			waitBeforeSendMs = this.minFrameIntervalMs - delta
			await sleep(waitBeforeSendMs)
		}

		const expect: ReqExpect = expectBoot
			? {
					functionCode: req[3] & 0xff,
					targetAddress: req[1] & 0xff,
					sourceAddress: req[2] & 0xff,
				}
			: {
					functionCode: req[4] & 0xff,
					targetAddress: req[2] & 0xff,
					sourceAddress: req[3] & 0xff,
					socketStartAddress:
						(req[4] & 0xff) === BMS_FUNC.SOCKET_READ && req.length >= 9 ? ((req[5] & 0xff) << 8) | (req[6] & 0xff) : undefined,
					socketQuantity:
						(req[4] & 0xff) === BMS_FUNC.SOCKET_READ && req.length >= 9 ? ((req[7] & 0xff) << 8) | (req[8] & 0xff) : undefined,
				}

		const deferred = defer<Uint8Array>()
		const timer = setTimeout(() => {
			if (this._pending && this._pending.reject === deferred.reject) {
				const p = this._pending
				this._clearPendingTimers(p)
				this._pending = null
			}
			deferred.reject(new BmsProtocolError(`Socket request timeout after ${timeoutMs}ms`, { expect }))
		}, timeoutMs)
		this._pending = { resolve: deferred.resolve, reject: deferred.reject, expect, timer, expectBoot }

		try {
			const hex = bytesToHexUpper(req)
			const txStartedAt = Date.now()
			this._socketTask.send({ data: hex })
			this._lastTxAt = Date.now()
			if (
				shouldScheduleSocketWakeupResend(req, {
					expectBoot,
					lastResponseAt: this._lastResponseAt,
					now: txStartedAt,
					idleMs: this.sleepWakeupIdleMs,
					delayMs: this.sleepWakeupResendDelayMs,
					timeoutMs,
				})
			) {
				const resendDelayMs = Math.max(0, this.sleepWakeupResendDelayMs)
				const wakeupTimer = setTimeout(() => {
					const pending = this._pending
					if (!pending || pending.reject !== deferred.reject || pending.wakeupResent || !this._socketTask) return
					pending.wakeupResent = true
					this._socketTask.send({ data: hex })
					this._lastTxAt = Date.now()
					this.logger?.info &&
						this.logger.info('[socket] wakeup resend query', {
							delayMs: resendDelayMs,
							idleMs: this.sleepWakeupIdleMs,
							timeoutMs,
							expect,
						})
				}, resendDelayMs)
				if (this._pending && this._pending.reject === deferred.reject) {
					this._pending.wakeupTimer = wakeupTimer
				} else {
					clearTimeout(wakeupTimer)
				}
			}
			const respBytes = await deferred.promise
			if (bootTrace) {
				this.logger?.info &&
					this.logger.info('[socket] boot request timing', {
						...bootTrace,
						timeoutMs,
						minFrameIntervalMs: this.minFrameIntervalMs,
						waitBeforeSendMs,
						rttMs: Date.now() - txStartedAt,
						totalMs: Date.now() - serialStartedAt,
						response: getBootFrameTrace(respBytes),
					})
			}
			return respBytes
		} catch (e) {
			if (bootTrace) {
				this.logger?.warn &&
					this.logger.warn('[socket] boot request failed', {
						...bootTrace,
						timeoutMs,
						minFrameIntervalMs: this.minFrameIntervalMs,
						waitBeforeSendMs,
						elapsedMs: Date.now() - serialStartedAt,
						err: formatErr(e),
					})
			}
			const pending = this._pending
			if (pending) this._clearPendingTimers(pending)
			this._pending = null
			throw e
		}
	}

	private _handleFrame(frameBytes: Uint8Array) {
		if (!this._pending) return
		const { expect, resolve, expectBoot } = this._pending
		if (!this._isExpectedResponse(frameBytes, expect, expectBoot)) return
		this._lastResponseAt = Date.now()
		this._clearPendingTimers(this._pending)
		this._pending = null
		resolve(frameBytes)
	}

	private _isExpectedResponse(frameBytes: Uint8Array, expect: ReqExpect, expectBoot?: boolean): boolean {
		try {
			if (expectBoot) {
				const parsed = parseBootFrame(frameBytes)
				if (parsed.targetAddress !== expect.targetAddress) return false
				const expectedCommand = expect.functionCode & 0xff
				const actualCommand = parsed.command & 0xff
				if (actualCommand !== expectedCommand) {
					if (expectedCommand !== 0x54 || actualCommand !== 0x53) return false
				}
				return isExpectedBootSourceAddress(expect.sourceAddress, parsed.sourceAddress)
			}
			const parsed = parseFrame(frameBytes)
			if (parsed.type === 'error') {
				return (
					parsed.targetAddress === expect.targetAddress &&
					parsed.sourceAddress === expect.sourceAddress &&
					parsed.functionCode === (expect.functionCode | 0x80)
				)
			}
			if (parsed.functionCode === BMS_FUNC.SOCKET_READ && expect.functionCode === BMS_FUNC.SOCKET_READ) {
				if (parsed.targetAddress !== expect.targetAddress) return false
				if ((expect.sourceAddress & 0xff) !== 0xfa && parsed.sourceAddress !== expect.sourceAddress) return false
				if (expect.socketStartAddress != null && expect.socketQuantity != null) {
					const socketRead = parsed as { socketStartAddress?: number; socketQuantity?: number }
					const respStart = socketRead.socketStartAddress
					const respQty = socketRead.socketQuantity
					if (respStart == null || respQty == null) return false
					const reqStart = expect.socketStartAddress
					const reqEnd = reqStart + expect.socketQuantity
					const respEnd = respStart + respQty
					return Math.max(reqStart, respStart) < Math.min(reqEnd, respEnd)
				}
				return true
			}
			return parsed.targetAddress === expect.targetAddress && parsed.sourceAddress === expect.sourceAddress && parsed.functionCode === expect.functionCode
		} catch {
			return false
		}
	}
}

export function createUniMqttSocketBmsTransport(options: UniMqttSocketBmsTransportOptions): UniMqttSocketBmsTransport {
	return new UniMqttSocketBmsTransport(options)
}
