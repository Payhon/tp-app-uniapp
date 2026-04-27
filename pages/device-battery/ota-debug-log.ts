import { ref } from 'vue'

export type OtaDebugLogLevel = 'debug' | 'info' | 'warn' | 'error'
export type OtaDebugLogScope = 'meter-ota' | 'ble' | 'boot' | 'download'

export type OtaDebugLogEntry = {
	id: number
	ts: string
	level: OtaDebugLogLevel
	scope: OtaDebugLogScope
	message: string
	data?: unknown
}

const STORAGE_KEY = '__meter_ota_debug_logs__'
const MAX_LOGS = 120
const MAX_STRING_LEN = 240
const MAX_ARRAY_LEN = 12
const MAX_OBJECT_KEYS = 18

let nextId = 1

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
		return {
			name: value.name,
			message: truncateText(value.message || String(value)),
		}
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

function readLogs(): OtaDebugLogEntry[] {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY)
		const list = Array.isArray(raw) ? raw : JSON.parse(String(raw || '[]'))
		if (!Array.isArray(list)) return []
		const normalized = list
			.map((item) => ({
				id: Number(item?.id || nextId++),
				ts: String(item?.ts || ''),
				level: String(item?.level || 'info') as OtaDebugLogLevel,
				scope: String(item?.scope || 'meter-ota') as OtaDebugLogScope,
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

export function appendOtaDebugLog(entry: {
	level?: OtaDebugLogLevel
	scope?: OtaDebugLogScope
	message: string
	data?: unknown
}) {
	const next: OtaDebugLogEntry = {
		id: nextId++,
		ts: formatTs(),
		level: entry.level || 'info',
		scope: entry.scope || 'meter-ota',
		message: entry.message,
		data: sanitizeData(entry.data),
	}
	otaDebugLogs.value = [...otaDebugLogs.value, next].slice(-MAX_LOGS)
	writeLogs(otaDebugLogs.value)
}

export function resetOtaDebugLog(sessionMeta?: unknown) {
	otaDebugLogs.value = []
	writeLogs([])
	if (sessionMeta) {
		appendOtaDebugLog({
			level: 'info',
			scope: 'meter-ota',
			message: 'debug session started',
			data: sessionMeta,
		})
	}
}

export function getOtaDebugLogs(): OtaDebugLogEntry[] {
	return otaDebugLogs.value.slice()
}

export function formatOtaDebugLogs(header?: unknown): string {
	const lines: string[] = []
	if (header) {
		lines.push('[meter-ota-debug] header')
		lines.push(stringifyData(sanitizeData(header)))
		lines.push('')
	}
	for (const item of otaDebugLogs.value) {
		const dataText = stringifyData(item.data)
		lines.push(
			`[${item.ts}] [${item.level.toUpperCase()}] [${item.scope}] ${item.message}${dataText ? ` ${dataText}` : ''}`
		)
	}
	return lines.join('\n')
}

export async function copyOtaDebugLogs(header?: unknown): Promise<void> {
	const data = formatOtaDebugLogs(header) || '[meter-ota-debug] empty'
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
