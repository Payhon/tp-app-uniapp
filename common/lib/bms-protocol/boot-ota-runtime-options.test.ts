import {
	getMqttBmsBootOtaRuntimeOptions,
	MOBILE_BOOT_FINALIZE_DELAY_MS,
	MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
	MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
	MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS,
	MOBILE_BOOT_RETRY_TIMEOUT_MS,
	MOBILE_BOOT_MAX_RETRIES,
	MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS,
	MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS,
	resolveBootPageBoundaryDelayMs,
} from './boot-ota-runtime-options'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

const options = getMqttBmsBootOtaRuntimeOptions()

assert(MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS === 800, 'shared BLE/MQTT non-finalize ACK timeout must be 800ms')
assert(options.queryTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'query ACK timeout must be 800ms')
assert(options.enterBootTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'enter ACK timeout must be 800ms')
assert(options.prepareTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'prepare ACK timeout must be 800ms')
assert(options.bootPacketTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'packet ACK timeout must be 800ms')
assert(options.finalizeDelayMs === MOBILE_BOOT_FINALIZE_DELAY_MS, '0x54 must be sent 300ms after the final 0x53 ACK')
assert(options.finalizeTimeoutMs === MOBILE_BOOT_FINALIZE_TIMEOUT_MS, '0x54 ACK timeout must be 5000ms')
assert(options.finalizeMaxAttempts === 4, '0x54 must allow three retries after the initial request')
assert(options.finalizeDisableAlternateWriteRetry, '0x54 must not start an alternate write retry window')
assert(
	options.finalizeTimeoutMs === MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
	'MQTT/4G 0x54 initial response window must be 5000ms'
)
assert(MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS === 0, '0x52 ACK must immediately start the first 0x53 like the legacy client')
assert(options.minFrameIntervalMs === 0 && options.packetDelayMs === 0, 'ordinary data packets must remain ACK-driven without fixed waits')
assert(MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS === 300, 'a confirmed 4KB boundary must wait 300ms before the next packet')
assert(options.pageBoundaryDelayMs === MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS, 'MQTT/4G must share the 300ms page boundary wait')
assert(options.requireFinalPacketAck, '0x54 must only start after the final data packet is acknowledged')
assert(
	MOBILE_BOOT_RETRY_TIMEOUT_MS === 450 && MOBILE_BOOT_MAX_RETRIES === 3,
	'all retries must wait 450ms, at most three retries'
)
assert(
	resolveBootPageBoundaryDelayMs(100, 1500) + 100 === MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS,
	'explicit hardware tuning overrides must still be capped at the post-ACK budget'
)
