import { classifyBleScanError, getBleScanErrorCode } from './ble-scan-error-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

const frequentError = {
	errMsg: 'startBluetoothDevicesDiscovery:fail system error, scanning too frequently (code=-30008)',
}
assert(getBleScanErrorCode(frequentError) === -30008, 'error code should be parsed from the runtime message')
assert(classifyBleScanError(frequentError) === 'scan_too_frequent', 'frequent scanning must not be treated as Bluetooth disabled')
const positiveFrequentError = {
	errMsg: 'startBluetoothDevicesDiscovery:fail:system error, scanning too frequently (code=10008)',
}
assert(getBleScanErrorCode(positiveFrequentError) === 10008, 'positive runtime throttle code should be parsed')
assert(classifyBleScanError(positiveFrequentError) === 'scan_too_frequent', '10008 should use scan throttle recovery')
assert(
	classifyBleScanError({ errCode: 10001, errMsg: 'startBluetoothDevicesDiscovery:fail' }) === 'bluetooth_unavailable',
	'10001 should be treated as Bluetooth unavailable'
)
assert(
	classifyBleScanError({ errCode: 10012, errMsg: 'location service disabled' }) === 'location_or_permission',
	'10012 should be treated as a location or permission problem'
)
assert(
	classifyBleScanError({ errMsg: 'startBluetoothDevicesDiscovery:fail system error' }) === 'other',
	'the Bluetooth API name alone must not trigger the Bluetooth-disabled dialog'
)

console.log('BLE scan error policy tests passed')
