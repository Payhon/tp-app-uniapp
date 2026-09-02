import {
	BLE_MANUAL_SCAN_DURATION_MS,
	BLE_QR_SCAN_DURATION_MS,
	canRunScheduledBleScanAutoStart,
	isBleScanAutoStartRequested,
	resolveBleScanDurationMs,
	shouldScheduleBleScanAutoStart,
} from './ble-scan-entry-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

assert(isBleScanAutoStartRequested('1'), 'auto_start=1 should request automatic scanning')
assert(!isBleScanAutoStartRequested('0'), 'auto_start=0 should not request automatic scanning')
assert(!isBleScanAutoStartRequested(undefined), 'missing auto_start should preserve manual entry behavior')

assert(
	shouldScheduleBleScanAutoStart({ requested: true, consumed: false, mode: 'manual' }),
	'first marked manual entry should schedule automatic scanning'
)
assert(
	!shouldScheduleBleScanAutoStart({ requested: false, consumed: false, mode: 'manual' }),
	'unmarked manual entry should not schedule automatic scanning'
)
assert(
	!shouldScheduleBleScanAutoStart({ requested: true, consumed: true, mode: 'manual' }),
	'repeated onShow should not schedule automatic scanning again'
)
assert(
	shouldScheduleBleScanAutoStart({ requested: false, consumed: false, mode: 'qr', targetMac: 'AC1122334455' }),
	'QR matching with a valid target should automatically start without auto_start=1'
)
assert(
	!shouldScheduleBleScanAutoStart({ requested: true, consumed: true, mode: 'qr', targetMac: 'AC1122334455' }),
	'QR matching should not automatically restart after the entry has been consumed'
)
for (const targetMac of [undefined, null, '', 'invalid', 'AC1122', 'AC112233445566']) {
	assert(
		!shouldScheduleBleScanAutoStart({ requested: true, consumed: false, mode: 'qr', targetMac }),
		'QR matching must not automatically start without a valid normalized target MAC'
	)
}
assert(
	!shouldScheduleBleScanAutoStart({ requested: false, consumed: false, mode: 'manual', targetMac: 'AC1122334455' }),
	'a target MAC alone must not enable automatic scanning for an unmarked manual entry'
)

const runnableInput = {
	pageVisible: true,
	blockedByLoginGuard: false,
	starting: false,
	isScanning: false,
	visibilityGeneration: 1,
	scheduledVisibilityGeneration: 1,
}
assert(canRunScheduledBleScanAutoStart(runnableInput), 'current visible generation should run the scheduled scan')
assert(
	!canRunScheduledBleScanAutoStart({ ...runnableInput, pageVisible: false }),
	'hidden page should block a scheduled scan'
)
assert(
	!canRunScheduledBleScanAutoStart({ ...runnableInput, blockedByLoginGuard: true }),
	'login guard should block a scheduled scan'
)
assert(
	!canRunScheduledBleScanAutoStart({ ...runnableInput, starting: true }),
	'an existing scan startup should block duplicate startup'
)
assert(
	!canRunScheduledBleScanAutoStart({ ...runnableInput, isScanning: true }),
	'an active scan should block duplicate startup'
)
assert(
	!canRunScheduledBleScanAutoStart({ ...runnableInput, visibilityGeneration: 2 }),
	'a stale onShow task must not start scanning after resume'
)

assert(resolveBleScanDurationMs('manual') === BLE_MANUAL_SCAN_DURATION_MS, 'manual scans should stop after 15 seconds')
assert(BLE_MANUAL_SCAN_DURATION_MS === 15_000, 'manual scan duration should be 15 seconds')
assert(resolveBleScanDurationMs('qr') === BLE_QR_SCAN_DURATION_MS, 'QR matching should preserve the 30 second duration')
assert(BLE_QR_SCAN_DURATION_MS === 30_000, 'QR scan duration should remain 30 seconds')

console.log('BLE scan entry policy tests passed')
