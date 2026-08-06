import { shouldShowHomeDeviceStatus } from './home-device-status'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

assert(
	shouldShowHomeDeviceStatus({ bmsCommType: 2, connectType: 'mqtt', isOnline: true }),
	'4G online device should show its status badge'
)
assert(
	!shouldShowHomeDeviceStatus({ bmsCommType: 2, connectType: 'offline', isOnline: false }),
	'4G type 2 offline device should hide its status badge'
)
assert(
	!shouldShowHomeDeviceStatus({ bmsCommType: 3, connectType: 'offline', isOnline: false }),
	'4G type 3 offline device should hide its status badge'
)
assert(
	shouldShowHomeDeviceStatus({ bmsCommType: 1, connectType: 'offline', isOnline: false }),
	'non-4G offline device should keep its status badge'
)
assert(
	shouldShowHomeDeviceStatus({ bmsCommType: 2, connectType: 'bluetooth', isOnline: false }),
	'active Bluetooth connection should keep its Bluetooth status badge'
)

console.log('home device status tests passed')
