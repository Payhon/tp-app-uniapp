import {
	clearDeviceDetailHandoff,
	consumeDeviceDetailHandoff,
	peekDeviceDetailHandoff,
	saveDeviceDetailHandoff,
} from './detail-handoff'

const assert = (condition: unknown, message: string) => {
	if (!condition) throw new Error(message)
}

const storage = new Map<string, unknown>()
;(globalThis as any).uni = {
	getStorageSync(key: string) {
		return storage.get(key)
	},
	setStorageSync(key: string, value: unknown) {
		storage.set(key, value)
	},
	removeStorageSync(key: string) {
		storage.delete(key)
	},
}

clearDeviceDetailHandoff()

assert(
	saveDeviceDetailHandoff({
		deviceId: 'device-scan',
		bleMac: 'AC1122334455',
		bmsCommType: 2,
		entrySource: 'scan',
		source: 'provision_success',
		createdAt: Date.now(),
	}),
	'scan provision handoff should be saved'
)

const scanHandoff = peekDeviceDetailHandoff('device-scan')
assert(scanHandoff?.entrySource === 'scan', 'scan source must survive the provision handoff')
assert(consumeDeviceDetailHandoff('device-scan')?.entrySource === 'scan', 'scan handoff should be consumable once')
assert(!peekDeviceDetailHandoff('device-scan'), 'consumed handoff must not affect later ordinary detail entries')

assert(
	saveDeviceDetailHandoff({
		deviceId: 'device-ble-search',
		bleMac: 'AC6677889900',
		bmsCommType: 2,
		entrySource: 'ble_search',
		source: 'provision_success',
		createdAt: Date.now(),
	}),
	'BLE search provision handoff should be saved'
)
assert(
	consumeDeviceDetailHandoff('device-ble-search')?.entrySource === 'ble_search',
	'BLE search source must survive the provision handoff'
)

assert(
	saveDeviceDetailHandoff({
		deviceId: 'device-default',
		bleMac: 'AC0011223344',
		bmsCommType: 2,
		source: 'provision_success',
		createdAt: Date.now(),
	}),
	'default provision handoff should be saved'
)
assert(!consumeDeviceDetailHandoff('device-default')?.entrySource, 'default provision must not become a discovery entry')

console.log('device detail handoff tests passed')
