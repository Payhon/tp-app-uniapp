import {
	isQrScanDetailEntry,
	normalizeDeviceDetailDiscoveryEntrySource,
	normalizeDeviceDetailEntrySource,
	resolveDeviceDetailEntrySource,
	shouldDisconnectBleOnDetailUnload,
	shouldUseFourGOnlineGrace,
} from './detail-entry-source'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

assert(normalizeDeviceDetailEntrySource('scan') === 'scan', 'QR scan source should be preserved')
assert(normalizeDeviceDetailEntrySource('ble_search') === 'ble_search', 'BLE search source should be preserved')
assert(normalizeDeviceDetailEntrySource('home') === 'home', 'home source should be preserved')
assert(normalizeDeviceDetailEntrySource('unknown') === 'default', 'unknown sources should use the safe default')
assert(!normalizeDeviceDetailDiscoveryEntrySource('default'), 'default source should not be propagated as discovery')
assert(!normalizeDeviceDetailDiscoveryEntrySource('home'), 'home source should not leak into discovery handoffs')

assert(
	resolveDeviceDetailEntrySource({ routeSource: 'ble_search', handoffSource: 'scan' }) === 'ble_search',
	'explicit route source should win over stale handoff source'
)
assert(
	resolveDeviceDetailEntrySource({ handoffSource: 'scan' }) === 'scan',
	'handoff source should survive provision redirect'
)

assert(shouldDisconnectBleOnDetailUnload('scan'), 'QR scan detail should disconnect idle BLE on unload')
assert(shouldDisconnectBleOnDetailUnload('ble_search'), 'BLE search detail should disconnect idle BLE on unload')
assert(!shouldDisconnectBleOnDetailUnload('default'), 'ordinary device-list detail should preserve warm BLE')
assert(
	!shouldDisconnectBleOnDetailUnload('ble_search', { bleCriticalOperationActive: true }),
	'active BLE OTA should preserve the existing deferred cleanup behavior'
)
assert(isQrScanDetailEntry('scan'), 'QR scan source should retain scan-only policies')
assert(!isQrScanDetailEntry('ble_search'), 'BLE search must not enable QR-only policies')
assert(shouldUseFourGOnlineGrace('scan'), 'QR scan should enable the 4G online grace')
assert(shouldUseFourGOnlineGrace('home'), 'home device list should enable the 4G online grace')
assert(!shouldUseFourGOnlineGrace('default'), 'other detail entries must not enable the 4G online grace')
assert(!shouldUseFourGOnlineGrace('ble_search'), 'BLE search must not enable the 4G online grace')

console.log('device detail entry source tests passed')
