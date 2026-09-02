export type BleScanEntryMode = 'manual' | 'qr'

export const BLE_MANUAL_SCAN_DURATION_MS = 15_000
export const BLE_QR_SCAN_DURATION_MS = 30_000

export function isBleScanAutoStartRequested(value: unknown): boolean {
	return String(value ?? '').trim() === '1'
}

export function shouldScheduleBleScanAutoStart(input: {
	requested: boolean
	consumed: boolean
	mode: BleScanEntryMode
	targetMac?: string | null
}): boolean {
	if (input.consumed) return false
	// 二维码入口已表达查找目标设备的意图，不依赖普通搜索的 auto_start 参数。
	if (input.mode === 'qr') return /^[0-9a-f]{12}$/i.test(input.targetMac || '')
	return input.requested
}

export function canRunScheduledBleScanAutoStart(input: {
	pageVisible: boolean
	blockedByLoginGuard: boolean
	starting: boolean
	isScanning: boolean
	visibilityGeneration: number
	scheduledVisibilityGeneration: number
}): boolean {
	return (
		input.pageVisible &&
		!input.blockedByLoginGuard &&
		!input.starting &&
		!input.isScanning &&
		input.visibilityGeneration === input.scheduledVisibilityGeneration
	)
}

export function resolveBleScanDurationMs(mode: BleScanEntryMode): number {
	return mode === 'qr' ? BLE_QR_SCAN_DURATION_MS : BLE_MANUAL_SCAN_DURATION_MS
}
