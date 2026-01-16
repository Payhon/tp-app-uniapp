import { BmsProtocolError, parseFrame } from './frame'
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
		const bytes = this._buf
		if (bytes.length < 5) return null

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

		for (let j = 1; j < this._buf.length; j += 1) {
			if (this._buf[j] !== 0xfd) continue
			const candidate = this._buf.slice(0, j + 1)
			try {
				parseBootFrame(candidate)
				this._buf = this._buf.slice(j + 1)
				return candidate
			} catch (e) {
				this._buf = this._buf.slice(1)
				return null
			}
		}
		return null
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
	minFrameIntervalMs?: number
	requestTimeoutMs?: number
	logger?: LoggerLike
}

// 基于后端 WebSocket 桥接的“MQTT透传”Transport（payload 为 JSON {hex}，由后端完成 MQTT publish/subscribe）
export class UniMqttSocketBmsTransport {
	wsUrl: string
	deviceId: string
	token: string
	minFrameIntervalMs: number
	requestTimeoutMs: number
	logger: LoggerLike

	// NOTE: 为兼容非HBuilderX/CI的TS环境，这里不强依赖 UniApp.SocketTask 类型
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _socketTask: any | null
	private _connected: boolean
	private _collector: FrameCollector
	private _queue: Promise<any>
	private _pending:
		| null
		| {
				resolve: (frame: Uint8Array) => void
				reject: (err: unknown) => void
				expect: ReqExpect
				timer: ReturnType<typeof setTimeout>
				expectBoot?: boolean
		  }

	private _lastTxAt: number

	constructor(options: UniMqttSocketBmsTransportOptions) {
		this.wsUrl = options.wsUrl
		this.deviceId = options.deviceId
		this.token = options.token
		this.minFrameIntervalMs = options.minFrameIntervalMs ?? 80
		this.requestTimeoutMs = options.requestTimeoutMs ?? 2500
		this.logger = options.logger ?? console

		this._socketTask = null
		this._connected = false
		this._collector = new FrameCollector({ logger: this.logger })
		this._queue = Promise.resolve()
		this._pending = null
		this._lastTxAt = 0
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

		const socketTask = uni.connectSocket({
			url: this.wsUrl,
			success: () => {},
			fail: (e: any) => reject(new BmsProtocolError('WebSocket connect failed', e)),
		})
		this._socketTask = socketTask

		socketTask.onOpen(() => {
			try {
				socketTask.send({
					data: JSON.stringify({ device_id: this.deviceId, token: this.token }),
					success: () => {
						this._connected = true
						resolve()
					},
					fail: (e: any) => reject(new BmsProtocolError('WebSocket auth send failed', e)),
				})
			} catch (e) {
				reject(e)
			}
		})

		socketTask.onClose(() => {
			this._connected = false
			if (this._pending) {
				const p = this._pending
				clearTimeout(p.timer)
				this._pending = null
				p.reject(new BmsProtocolError('WebSocket closed'))
			}
		})

		socketTask.onError((e: any) => {
			this._connected = false
			reject(new BmsProtocolError('WebSocket error', e))
		})

		socketTask.onMessage((res: { data: unknown }) => {
			try {
				const txt = typeof res.data === 'string' ? res.data : String(res.data || '')
				let payloadHex = ''
				try {
					const obj = JSON.parse(txt)
					payloadHex = String(obj?.hex || '')
				} catch {
					// ignore
				}
				if (!payloadHex) return
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
		if (this._pending) {
			const p = this._pending
			clearTimeout(p.timer)
			this._pending = null
			p.reject(new BmsProtocolError('Disconnected'))
		}
		try {
			this._socketTask?.close({})
		} catch {}
		this._socketTask = null
	}

	request(frameBytes: Uint8Array | ArrayLike<number>, { timeoutMs = this.requestTimeoutMs }: { timeoutMs?: number } = {}): Promise<Uint8Array> {
		this._queue = this._queue.then(() => this._requestSerial(frameBytes, { timeoutMs }))
		return this._queue
	}

	private async _requestSerial(frameBytes: Uint8Array | ArrayLike<number>, { timeoutMs }: { timeoutMs: number }): Promise<Uint8Array> {
		if (!this._connected || !this._socketTask) throw new BmsProtocolError('WebSocket is not connected')
		if (this._pending) throw new BmsProtocolError('Previous request still pending')

		const req = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes)
		const expectBoot = req[0] === 0x55 && req[1] !== 0x7f
		if (!expectBoot && req.length < 6) throw new BmsProtocolError('Invalid request frame bytes')
		if (expectBoot && req.length < 4) throw new BmsProtocolError('Invalid boot request frame bytes')

		const now = Date.now()
		const delta = now - this._lastTxAt
		if (delta < this.minFrameIntervalMs) await sleep(this.minFrameIntervalMs - delta)

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
				}

		const deferred = defer<Uint8Array>()
		const timer = setTimeout(() => {
			if (this._pending && this._pending.reject === deferred.reject) this._pending = null
			deferred.reject(new BmsProtocolError(`Socket request timeout after ${timeoutMs}ms`, { expect }))
		}, timeoutMs)
		this._pending = { resolve: deferred.resolve, reject: deferred.reject, expect, timer, expectBoot }

		try {
			const hex = bytesToHexUpper(req)
			this._socketTask.send({ data: hex })
			this._lastTxAt = Date.now()
			return await deferred.promise
		} catch (e) {
			const pending = this._pending
			if (pending) clearTimeout(pending.timer)
			this._pending = null
			throw e
		}
	}

	private _handleFrame(frameBytes: Uint8Array) {
		if (!this._pending) return
		const { expect, resolve, timer, expectBoot } = this._pending
		if (!this._isExpectedResponse(frameBytes, expect, expectBoot)) return
		clearTimeout(timer)
		this._pending = null
		resolve(frameBytes)
	}

	private _isExpectedResponse(frameBytes: Uint8Array, expect: ReqExpect, expectBoot?: boolean): boolean {
		try {
			if (expectBoot) {
				const parsed = parseBootFrame(frameBytes)
				return parsed.targetAddress === expect.targetAddress && parsed.sourceAddress === expect.sourceAddress && parsed.command === expect.functionCode
			}
			const parsed = parseFrame(frameBytes)
			if (parsed.type === 'error') {
				return (
					parsed.targetAddress === expect.targetAddress &&
					parsed.sourceAddress === expect.sourceAddress &&
					parsed.functionCode === (expect.functionCode | 0x80)
				)
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
