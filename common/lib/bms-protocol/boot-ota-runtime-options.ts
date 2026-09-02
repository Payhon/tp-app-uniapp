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
	finalizeAssumeSuccessOnTimeout: boolean
	terminalPacketWriteErrorAsComplete: boolean
	requireFinalPacketAck: boolean
	minFrameIntervalMs: number
	minFrameIntervalMode: 'set'
	packetDelayMs: number
	pageBoundaryDelayMs: number
	adaptiveSlowdownOnPacketTimeout: boolean
	adaptivePacketDelayMs: number
	adaptivePageBoundaryDelayMs: number
	tracePacketTiming: boolean
	logger?: TLogger
}

export const MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS = 600
export const MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS = 300
export const MOBILE_BOOT_PACKET_RETRY_DELAY_MS = 220
export const MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS = 600
export const MOBILE_BOOT_FINALIZE_DELAY_MS = 300
export const MOBILE_BOOT_FINALIZE_TIMEOUT_MS = 5000
export const MOBILE_BOOT_WRITE_API_SOFT_TIMEOUT_MS = 300
export const BLE_BOOT_FINALIZE_SEND_INTERVAL_MS = 800
export const BLE_BOOT_FINALIZE_SEND_COUNT = 8
export const BLE_BOOT_FINALIZE_TIMEOUT_MS = 6400
export const BLE_BOOT_FINALIZE_BURST_INTERVALS_MS = Object.freeze(
	Array.from(
		{ length: BLE_BOOT_FINALIZE_SEND_COUNT - 1 },
		(_, index) => BLE_BOOT_FINALIZE_SEND_INTERVAL_MS * (index + 1)
	)
)

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
		finalizeMaxAttempts: 1,
		finalizeDisableAlternateWriteRetry: true,
		finalizeAssumeSuccessOnTimeout: false,
		terminalPacketWriteErrorAsComplete: false,
		requireFinalPacketAck: true,
		minFrameIntervalMs: 40,
		minFrameIntervalMode: 'set',
		packetDelayMs: 0,
		pageBoundaryDelayMs: 100,
		adaptiveSlowdownOnPacketTimeout: true,
		adaptivePacketDelayMs: 180,
		adaptivePageBoundaryDelayMs: 1200,
		tracePacketTiming: true,
		logger,
	}
}
