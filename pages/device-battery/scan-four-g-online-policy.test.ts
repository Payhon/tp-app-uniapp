import {
	SCAN_FOUR_G_ONLINE_GRACE_MS,
	createScanFourGOnlineState,
	getScanFourGOnlineOverrideExpiresAt,
	isScanFourGOnlineOverrideActive,
	markScanFourGValidResponse,
	shouldStartScanFourGOnlineGrace,
	startScanFourGOnlineGrace,
} from './scan-four-g-online-policy'

const assert = (condition: unknown, message: string) => {
	if (!condition) throw new Error(message)
}

const empty = createScanFourGOnlineState()
assert(!isScanFourGOnlineOverrideActive(empty, 1_000), 'non-scan detail must not enable the online override')
assert(
	!shouldStartScanFourGOnlineGrace({ scanEntry: false, isFourGDevice: true }),
	'ordinary 4G detail entry must not start the scan grace'
)
assert(
	!shouldStartScanFourGOnlineGrace({ scanEntry: true, isFourGDevice: false }),
	'BLE-only scan detail must not start the 4G grace'
)
assert(
	shouldStartScanFourGOnlineGrace({ scanEntry: true, isFourGDevice: true }),
	'scan 4G detail should start the grace'
)

const started = startScanFourGOnlineGrace({ sessionKey: 'cloud:A:1', nowMs: 1_000 })
assert(isScanFourGOnlineOverrideActive(started, 1_000), 'scan 4G detail should be online immediately')
assert(isScanFourGOnlineOverrideActive(started, 60_999), 'scan grace should remain online before 60 seconds')
assert(!isScanFourGOnlineOverrideActive(started, 61_000), 'scan grace should expire after 60 seconds without a response')
assert(
	getScanFourGOnlineOverrideExpiresAt(started) === 1_000 + SCAN_FOUR_G_ONLINE_GRACE_MS,
	'initial expiry should be based on the detail 4G confirmation time'
)

const confirmed = markScanFourGValidResponse(started, { sessionKey: 'cloud:A:1', nowMs: 56_000 })
assert(isScanFourGOnlineOverrideActive(confirmed, 61_000), 'a valid response should keep the detail online past the initial deadline')
assert(!isScanFourGOnlineOverrideActive(confirmed, 116_000), 'the response protection should expire after 60 seconds of silence')

const recovered = markScanFourGValidResponse(started, { sessionKey: 'cloud:A:1', nowMs: 70_000 })
assert(isScanFourGOnlineOverrideActive(recovered, 70_000), 'a late valid response should restore local online state')

const staleSession = markScanFourGValidResponse(started, { sessionKey: 'cloud:B:2', nowMs: 30_000 })
assert(staleSession === started, 'a response from another detail session must be ignored')

console.log('scan 4G online policy tests passed')
