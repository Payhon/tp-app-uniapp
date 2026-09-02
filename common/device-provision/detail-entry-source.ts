export type DeviceDetailEntrySource = 'default' | 'scan' | 'ble_search'
export type DeviceDetailDiscoveryEntrySource = Exclude<DeviceDetailEntrySource, 'default'>

export function normalizeDeviceDetailEntrySource(value: unknown): DeviceDetailEntrySource {
	const normalized = String(value || '').trim()
	if (normalized === 'scan' || normalized === 'ble_search') return normalized
	return 'default'
}

export function normalizeDeviceDetailDiscoveryEntrySource(
	value: unknown
): DeviceDetailDiscoveryEntrySource | undefined {
	const normalized = normalizeDeviceDetailEntrySource(value)
	return normalized === 'default' ? undefined : normalized
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
