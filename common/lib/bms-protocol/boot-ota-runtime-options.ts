export type MqttBmsBootOtaRuntimeOptions<TLogger = unknown> = {
	queryTimeoutMs: number
	enterBootTimeoutMs: number
	enterBootTimeoutAsSuccess: boolean
	prepareTimeoutMs: number
	bootPacketTimeoutMs: number
	finalizeDelayMs: number
	finalizeTimeoutMs: number
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

export const MQTT_BMS_BOOT_PACKET_ACK_TIMEOUT_MS = 3000

export function getMqttBmsBootOtaRuntimeOptions<TLogger = unknown>(logger?: TLogger): MqttBmsBootOtaRuntimeOptions<TLogger> {
	return {
		queryTimeoutMs: 12000,
		enterBootTimeoutMs: 20000,
		enterBootTimeoutAsSuccess: true,
		prepareTimeoutMs: 20000,
		bootPacketTimeoutMs: MQTT_BMS_BOOT_PACKET_ACK_TIMEOUT_MS,
		finalizeDelayMs: 1500,
		finalizeTimeoutMs: 20000,
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
