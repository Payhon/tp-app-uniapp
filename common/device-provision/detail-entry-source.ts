export type DeviceDetailEntrySource = 'default' | 'scan' | 'ble_search' | 'home'
export type DeviceDetailDiscoveryEntrySource = 'scan' | 'ble_search'

export function normalizeDeviceDetailEntrySource(value: unknown): DeviceDetailEntrySource {
	const normalized = String(value || '').trim()
	if (normalized === 'scan' || normalized === 'ble_search' || normalized === 'home') return normalized
	return 'default'
}

export function normalizeDeviceDetailDiscoveryEntrySource(
	value: unknown
): DeviceDetailDiscoveryEntrySource | undefined {
	const normalized = normalizeDeviceDetailEntrySource(value)
	return normalized === 'scan' || normalized === 'ble_search' ? normalized : undefined
}

export function resolveDeviceDetailEntrySource(input: {
	routeSource?: unknown
	handoffSource?: unknown
}): DeviceDetailEntrySource {
	const routeSource = normalizeDeviceDetailEntrySource(input.routeSource)
	if (routeSource !== 'default') return routeSource
	return normalizeDeviceDetailEntrySource(input.handoffSource)
}

export function shouldDisconnectBleOnDetailUnload(
	source: DeviceDetailEntrySource,
	options?: { bleCriticalOperationActive?: boolean }
): boolean {
	if (options?.bleCriticalOperationActive) return false
	return source === 'scan' || source === 'ble_search'
}

export function isQrScanDetailEntry(source: DeviceDetailEntrySource): boolean {
	return source === 'scan'
}

export function shouldUseFourGOnlineGrace(source: DeviceDetailEntrySource): boolean {
	return source === 'scan' || source === 'home'
}
