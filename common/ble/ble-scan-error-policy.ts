export type BleScanErrorKind = 'bluetooth_unavailable' | 'location_or_permission' | 'scan_too_frequent' | 'other'

export const BLE_SCAN_TOO_FREQUENT_CODES = new Set([-30008, 10008])
export const BLE_SCAN_TOO_FREQUENT_RETRY_DELAY_MS = 1000

function errorText(error: unknown): string {
	if (typeof error === 'string') return error
	if (!error || typeof error !== 'object') return ''
	const value = error as Record<string, unknown>
	return String(value.errMsg ?? value.message ?? '')
}

export function getBleScanErrorCode(error: unknown): number | null {
	if (error && typeof error === 'object') {
		const value = error as Record<string, unknown>
		for (const candidate of [value.errCode, value.code, value.errno]) {
			const parsed = Number(candidate)
			if (Number.isFinite(parsed)) return parsed
		}
	}

	const match = errorText(error).match(/(?:errCode|code|errno)\s*[=:]\s*(-?\d+)/i)
	if (!match) return null
	const parsed = Number(match[1])
	return Number.isFinite(parsed) ? parsed : null
}

export function classifyBleScanError(error: unknown): BleScanErrorKind {
	const code = getBleScanErrorCode(error)
	if (code === 10001) return 'bluetooth_unavailable'
	if (code === 10012) return 'location_or_permission'
	if (code != null && BLE_SCAN_TOO_FREQUENT_CODES.has(code)) return 'scan_too_frequent'

	const message = errorText(error).toLowerCase()
	if (message.includes('location') || message.includes('permission')) return 'location_or_permission'
	return 'other'
}
