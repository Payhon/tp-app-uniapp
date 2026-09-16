import { ref } from 'vue'

export type OtaDebugLogLevel = 'debug' | 'info' | 'warn' | 'error'
export type OtaDebugLogScope = 'ota' | 'bms-ota' | 'meter-ota' | 'ble' | 'boot' | 'socket' | 'download'

export type OtaDebugLogEntry = {
	id: number
	ts: string
	level: OtaDebugLogLevel
	scope: OtaDebugLogScope
	message: string
	data?: unknown
}

const STORAGE_KEY = '__ota_debug_logs__'
const LEGACY_STORAGE_KEY = '__meter_ota_debug_logs__'
const MAX_LOGS = 6000
const MAX_STRING_LEN = 4096
const MAX_ARRAY_LEN = 64
const MAX_OBJECT_KEYS = 64

let nextId = 1

type BootTransportFrameTrace = {
	direction: 'tx' | 'rx'
	packetSize: number
	sequence: number
	status?: number
}

let pendingBootTransportFrames: Partial<Record<'tx' | 'rx', OtaDebugLogEntry>> = {}
let bootPacketSize = 0
let lastBootTxSequence = -1
let lastBootRxSequence = -1
let otaWholeFrameWriteLogged = false

function formatTs(date = new Date()): string {
	const pad = (n: number, len = 2) => String(n).padStart(len, '0')
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

function truncateText(value: string, maxLen = MAX_STRING_LEN): string {
	if (value.length <= maxLen) return value
	const headLen = Math.max(20, Math.floor(maxLen * 0.58))
	const tailLen = Math.max(12, maxLen - headLen - 3)
	return `${value.slice(0, headLen)}...${value.slice(value.length - tailLen)}`
}

function sanitizeData(value: unknown, depth = 0): unknown {
	if (value == null) return value
	if (typeof value === 'string') return truncateText(value)
	if (typeof value === 'number' || typeof value === 'boolean') return value
	if (typeof value === 'bigint') return String(value)
	if (value instanceof Error) {
		const error = value as Error & { code?: unknown; errCode?: unknown; errMsg?: unknown; extra?: unknown }
		const out: Record<string, unknown> = {
			name: value.name,
			message: truncateText(value.message || String(value)),
		}
		if (error.code != null) out.code = sanitizeData(error.code, depth + 1)
		if (error.errCode != null) out.errCode = sanitizeData(error.errCode, depth + 1)
		if (error.errMsg != null) out.errMsg = sanitizeData(error.errMsg, depth + 1)
		if (error.extra != null) out.extra = sanitizeData(error.extra, depth + 1)
		return out
	}
	if (depth >= 3) return truncateText(String(value))
	if (Array.isArray(value)) {
		const out = value.slice(0, MAX_ARRAY_LEN).map((item) => sanitizeData(item, depth + 1))
		if (value.length > MAX_ARRAY_LEN) out.push(`...+${value.length - MAX_ARRAY_LEN}`)
		return out
	}
	if (typeof value === 'object') {
		const source = value as Record<string, unknown>
		const out: Record<string, unknown> = {}
		const keys = Object.keys(source).slice(0, MAX_OBJECT_KEYS)
		for (const key of keys) {
			out[key] = sanitizeData(source[key], depth + 1)
		}
		if (Object.keys(source).length > MAX_OBJECT_KEYS) {
			out.__truncated_keys__ = Object.keys(source).length - MAX_OBJECT_KEYS
		}
		return out
	}
	return truncateText(String(value))
}

function resetBootTransportTrace() {
	pendingBootTransportFrames = {}
	bootPacketSize = 0
	lastBootTxSequence = -1
	lastBootRxSequence = -1
	otaWholeFrameWriteLogged = false
}

function getLogHex(message: string, data: unknown): string {
	if (data && typeof data === 'object' && !Array.isArray(data)) {
		const hex = (data as Record<string, unknown>).hex
		if (typeof hex === 'string') return hex.replace(/\s+/g, '').toUpperCase()
	}
	return (message.match(/\bhex=([0-9a-f]+)/i)?.[1] || '').toUpperCase()
}

function parseBootTransportFrame(message: string, data: unknown): BootTransportFrameTrace | null {
	const direction = /\brx frame\b/i.test(message) ? 'rx' : /\btx frame\b/i.test(message) ? 'tx' : null
	if (!direction || !/^\[(?:ble|socket)\]/i.test(message)) return null
	const hex = getLogHex(message, data)
	if (!hex || hex.length % 2 !== 0) return null
	const bytes = hex.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) || []
	if (bytes.length < 9 || bytes[0] !== 0x55 || bytes[3] !== 0x53) return null
	const dataLen = ((bytes[4] & 0xff) << 8) | (bytes[5] & 0xff)
	if (bytes.length !== dataLen + 9) return null
	if (direction === 'tx') {
		if (dataLen < 2) return null
		return {
			direction,
			packetSize: dataLen - 2,
			sequence: ((bytes[6] & 0xff) << 8) | (bytes[7] & 0xff),
		}
	}
	if (dataLen !== 3) return null
	return {
		direction,
		packetSize: bootPacketSize,
		sequence: ((bytes[7] & 0xff) << 8) | (bytes[8] & 0xff),
		status: bytes[6] & 0xff,
	}
}

function isBootDataRawLog(message: string, data: unknown): boolean {
	if (!/^\[boot\]\s+(?:tx|rx)$/i.test(message.trim())) return false
	const hex = getLogHex(message, data)
	return hex.length >= 8 && Number.parseInt(hex.slice(6, 8), 16) === 0x53
}

function bufferedLogs(): OtaDebugLogEntry[] {
	return [...(deferredLogs ?? otaDebugLogs.value), ...Object.values(pendingBootTransportFrames)]
		.sort((left, right) => left.id - right.id)
		.slice(-MAX_LOGS)
}

function flushPendingBootTransportFrames() {
	const pending = Object.values(pendingBootTransportFrames).sort((left, right) => left.id - right.id)
	pendingBootTransportFrames = {}
	if (!pending.length) return
	if (deferredLogs != null) {
		deferredLogs.push(...pending)
		deferredLogs.sort((left, right) => left.id - right.id)
		deferredLogs.splice(0, Math.max(0, deferredLogs.length - MAX_LOGS))
		return
	}
	otaDebugLogs.value = [...otaDebugLogs.value, ...pending].sort((left, right) => left.id - right.id).slice(-MAX_LOGS)
}

function shouldKeepBootTransportFrame(trace: BootTransportFrameTrace): boolean {
	if (trace.direction === 'tx') {
		const isRetry = lastBootTxSequence >= 0 && trace.sequence <= lastBootTxSequence
		if (trace.packetSize > bootPacketSize) bootPacketSize = trace.packetSize
		lastBootTxSequence = trace.sequence
		return trace.sequence === 0 || isRetry || (trace.sequence > 0 && trace.sequence * bootPacketSize % 4096 === 0)
	}
	const isRetry = lastBootRxSequence >= 0 && trace.sequence <= lastBootRxSequence
	lastBootRxSequence = trace.sequence
	return trace.status !== 0 || trace.sequence === 1 || isRetry ||
		(trace.packetSize > 0 && trace.sequence * trace.packetSize % 4096 === 0)
}

function readLogs(): OtaDebugLogEntry[] {
	try {
		let raw = uni.getStorageSync(STORAGE_KEY)
		if (!raw) raw = uni.getStorageSync(LEGACY_STORAGE_KEY)
		const list = Array.isArray(raw) ? raw : JSON.parse(String(raw || '[]'))
		if (!Array.isArray(list)) return []
		const normalized = list
			.map((item) => ({
				id: Number(item?.id || nextId++),
				ts: String(item?.ts || ''),
				level: String(item?.level || 'info') as OtaDebugLogLevel,
				scope: String(item?.scope || 'ota') as OtaDebugLogScope,
				message: String(item?.message || ''),
				data: item?.data,
			}))
			.filter((item) => item.ts && item.message)
			.slice(-MAX_LOGS)
		const maxId = normalized.reduce((max, item) => Math.max(max, item.id), 0)
		nextId = Math.max(nextId, maxId + 1)
		return normalized
	} catch (e) {
		return []
	}
}

function writeLogs(logs: OtaDebugLogEntry[]) {
	try {
		uni.setStorageSync(STORAGE_KEY, logs.slice(-MAX_LOGS))
	} catch (e) {}
}

function stringifyData(data: unknown): string {
	if (data == null || data === '') return ''
	try {
		return JSON.stringify(data)
	} catch (e) {
		return String(data)
	}
}

export const otaDebugLogs = ref<OtaDebugLogEntry[]>(readLogs())
let deferredLogs: OtaDebugLogEntry[] | null = null

export function setOtaDebugLogDeferred(deferred: boolean) {
	if (deferred) {
		if (deferredLogs == null) deferredLogs = otaDebugLogs.value.slice()
		return
	}
	if (deferredLogs == null) return
	flushPendingBootTransportFrames()
	otaDebugLogs.value = deferredLogs
	deferredLogs = null
	writeLogs(otaDebugLogs.value)
}

export function appendOtaDebugLog(entry: {
	level?: OtaDebugLogLevel
	scope?: OtaDebugLogScope
	message: string
	data?: unknown
}) {
	if (/OTA exclusive session ready/i.test(entry.message)) resetBootTransportTrace()
	if (/OTA exclusive session ended/i.test(entry.message)) flushPendingBootTransportFrames()
	if (isBootDataRawLog(entry.message, entry.data)) return
	if (/^\[ble\] OTA whole-frame write$/i.test(entry.message.trim())) {
		if (otaWholeFrameWriteLogged) return
		otaWholeFrameWriteLogged = true
	}
	if (/^\[socket\] boot request timing$/i.test(entry.message.trim())) {
		const data = entry.data as Record<string, unknown> | null
		if (data?.cmd === '0x53' || data?.cmd === 0x53) return
	}
	const next: OtaDebugLogEntry = {
		id: nextId++,
		ts: formatTs(),
		level: entry.level || 'info',
		scope: entry.scope || 'meter-ota',
		message: entry.message,
		data: sanitizeData(entry.data),
	}
	const transportFrame = parseBootTransportFrame(entry.message, entry.data)
	if (transportFrame) {
		const previous = pendingBootTransportFrames[transportFrame.direction]
		if (shouldKeepBootTransportFrame(transportFrame)) {
			if (previous) delete pendingBootTransportFrames[transportFrame.direction]
		} else {
			pendingBootTransportFrames[transportFrame.direction] = next
			return
		}
	}
	if (deferredLogs != null) {
		// ponytail: Boot 期间仅保留最近 6000 条内存日志；强退恢复若有需要再加低频落盘。
		deferredLogs.push(next)
		if (deferredLogs.length > MAX_LOGS) deferredLogs.shift()
		return
	}
	otaDebugLogs.value = [...otaDebugLogs.value, next].slice(-MAX_LOGS)
	writeLogs(otaDebugLogs.value)
}

export function resetOtaDebugLog(sessionMeta?: unknown) {
	resetBootTransportTrace()
	if (deferredLogs != null) {
		deferredLogs = []
	} else {
		otaDebugLogs.value = []
		writeLogs([])
		try {
			uni.removeStorageSync(LEGACY_STORAGE_KEY)
		} catch (e) {}
	}
	if (sessionMeta) {
		appendOtaDebugLog({
			level: 'info',
			scope: 'ota',
			message: 'debug session started',
			data: sessionMeta,
		})
	}
}

export function getOtaDebugLogs(): OtaDebugLogEntry[] {
	return bufferedLogs()
}

export function formatOtaDebugLogs(header?: unknown): string {
	const lines: string[] = []
	if (header) {
		lines.push('[ota-debug] header')
		lines.push(stringifyData(sanitizeData(header)))
		lines.push('')
	}
	for (const item of bufferedLogs()) {
		const dataText = stringifyData(item.data)
		lines.push(
			`[${item.ts}] [${item.level.toUpperCase()}] [${item.scope}] ${item.message}${dataText ? ` ${dataText}` : ''}`
		)
	}
	return lines.join('\n')
}

export async function copyOtaDebugLogs(header?: unknown): Promise<void> {
	const data = formatOtaDebugLogs(header) || '[ota-debug] empty'
	await new Promise<void>((resolve, reject) => {
		try {
			uni.setClipboardData({
				data,
				success: () => resolve(),
				fail: reject,
			})
		} catch (e) {
			reject(e)
		}
	})
}
