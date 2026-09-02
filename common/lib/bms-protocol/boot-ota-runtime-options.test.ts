import {
	BLE_BOOT_FINALIZE_BURST_INTERVALS_MS,
	BLE_BOOT_FINALIZE_SEND_COUNT,
	BLE_BOOT_FINALIZE_SEND_INTERVAL_MS,
	BLE_BOOT_FINALIZE_TIMEOUT_MS,
	getMqttBmsBootOtaRuntimeOptions,
	MOBILE_BOOT_FINALIZE_DELAY_MS,
	MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
	MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
	MOBILE_BOOT_PACKET_RETRY_DELAY_MS,
	MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS,
	MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS,
	resolveBootPageBoundaryDelayMs,
} from './boot-ota-runtime-options'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

const options = getMqttBmsBootOtaRuntimeOptions()

assert(MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS === 600, 'shared BLE/MQTT non-finalize ACK timeout must be 600ms')
assert(options.queryTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'query ACK timeout must be 600ms')
assert(options.enterBootTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'enter ACK timeout must be 600ms')
assert(options.prepareTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'prepare ACK timeout must be 600ms')
assert(options.bootPacketTimeoutMs === MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS, 'packet ACK timeout must be 600ms')
assert(options.finalizeDelayMs === MOBILE_BOOT_FINALIZE_DELAY_MS, '0x54 must be sent 300ms after the final 0x53 ACK')
assert(options.finalizeTimeoutMs === MOBILE_BOOT_FINALIZE_TIMEOUT_MS, '0x54 ACK timeout must be 5000ms')
assert(options.finalizeMaxAttempts === 1, '0x54 must use a single response window')
assert(options.finalizeDisableAlternateWriteRetry, '0x54 must not start an alternate write retry window')
assert(BLE_BOOT_FINALIZE_SEND_INTERVAL_MS === 800, 'BLE 0x54 resend interval must be 800ms')
assert(BLE_BOOT_FINALIZE_SEND_COUNT === 8, 'BLE 0x54 must be sent eight times including the initial send')
assert(BLE_BOOT_FINALIZE_TIMEOUT_MS === 6400, 'BLE 0x54 response window must be 6400ms')
assert(
	BLE_BOOT_FINALIZE_BURST_INTERVALS_MS.join(',') === '800,1600,2400,3200,4000,4800,5600',
	'BLE 0x54 must have seven scheduled resends ending at 5600ms'
)
assert(
	options.finalizeTimeoutMs === MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
	'MQTT/4G 0x54 must remain a single 5000ms response window'
)
assert(MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS === 300, '0x52 ACK to first 0x53 delay must be 300ms')
assert(
	MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS + MOBILE_BOOT_PACKET_RETRY_DELAY_MS === 820,
	'non-finalize timeout plus packet retry delay must be 820ms'
)
assert(
	resolveBootPageBoundaryDelayMs(100, 1500) + 100 === MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS,
	'adaptive packet and page-boundary delays must be capped at the post-ACK budget'
)
