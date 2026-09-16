export type MqttBmsBootOtaRuntimeOptions<TLogger = unknown> = {
	queryTimeoutMs: number
	enterBootTimeoutMs: number
	enterBootTimeoutAsSuccess: boolean
	prepareTimeoutMs: number
	bootPacketTimeoutMs: number
	finalizeDelayMs: number
	finalizeTimeoutMs: number
	finalizeMaxAttempts: number
	finalizeDisableAlternateWriteRetry: boolean
	requireFinalPacketAck: boolean
	minFrameIntervalMs: number
	minFrameIntervalMode: 'set'
	packetDelayMs: number
	pageBoundaryDelayMs: number
	tracePacketTiming: boolean
	logger?: TLogger
}

export const MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS = 800
export const MOBILE_BOOT_RETRY_TIMEOUT_MS = 450
export const MOBILE_BOOT_MAX_RETRIES = 3
export const MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS = 0
export const MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS = 600
export const MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS = 300
export const MOBILE_BOOT_FINALIZE_DELAY_MS = 300
export const MOBILE_BOOT_FINALIZE_TIMEOUT_MS = 5000
export const MOBILE_BOOT_WRITE_API_SOFT_TIMEOUT_MS = 300

export function clampBootPacketDelayMs(delayMs: number | undefined): number {
	return Math.min(MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS, Math.max(0, delayMs ?? 0))
}

export function resolveBootPageBoundaryDelayMs(packetDelayMs: number, pageBoundaryDelayMs: number | undefined): number {
	const packetDelay = clampBootPacketDelayMs(packetDelayMs)
	const remainingBudget = Math.max(0, MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS - packetDelay)
	return Math.min(remainingBudget, Math.max(0, pageBoundaryDelayMs ?? 0))
}

export function getMqttBmsBootOtaRuntimeOptions<TLogger = unknown>(logger?: TLogger): MqttBmsBootOtaRuntimeOptions<TLogger> {
	return {
		queryTimeoutMs: MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
		enterBootTimeoutMs: MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
		enterBootTimeoutAsSuccess: true,
		prepareTimeoutMs: MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
		bootPacketTimeoutMs: MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
		finalizeDelayMs: MOBILE_BOOT_FINALIZE_DELAY_MS,
		finalizeTimeoutMs: MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
		finalizeMaxAttempts: MOBILE_BOOT_MAX_RETRIES + 1,
		finalizeDisableAlternateWriteRetry: true,
		requireFinalPacketAck: true,
		minFrameIntervalMs: 0,
		minFrameIntervalMode: 'set',
		packetDelayMs: 0,
		pageBoundaryDelayMs: MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS,
		tracePacketTiming: false,
		logger,
	}
}
