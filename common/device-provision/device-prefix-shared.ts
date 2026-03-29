export type SupportedDeviceType = 'bms' | 'meter'

export const DEVICE_TYPE_BMS: SupportedDeviceType = 'bms'
export const DEVICE_TYPE_METER: SupportedDeviceType = 'meter'

export const DEVICE_MAC_PREFIXES = Object.freeze({
	[DEVICE_TYPE_BMS]: Object.freeze(['AC']),
	[DEVICE_TYPE_METER]: Object.freeze(['AA']),
}) as Readonly<Record<SupportedDeviceType, readonly string[]>>

export const SUPPORTED_DEVICE_TYPES = Object.freeze([
	DEVICE_TYPE_BMS,
	DEVICE_TYPE_METER,
]) as readonly SupportedDeviceType[]

function normalizeHex(input: unknown): string {
	return String(input || '')
		.trim()
		.replace(/^0x/i, '')
		.replace(/[^0-9a-fA-F]/g, '')
		.toUpperCase()
}

function normalizeMac(input: unknown): string | null {
	let hex = normalizeHex(input)
	if (hex.length < 12) return null
	while (hex.length > 12 && hex.endsWith('00')) {
		hex = hex.slice(0, -2)
	}
	if (!/^[0-9A-F]{12}$/.test(hex)) return null
	return hex
}

function hasPrefix(mac: string, prefixes: readonly string[] | undefined): boolean {
	const normalized = normalizeMac(mac)
	if (!normalized) return false
	return (prefixes || []).some((prefix) => normalized.startsWith(normalizeHex(prefix)))
}

export function resolveDeviceTypeByMac(mac: string): SupportedDeviceType | null {
	const normalized = normalizeMac(mac)
	if (!normalized) return null
	return SUPPORTED_DEVICE_TYPES.find((type) => hasPrefix(normalized, DEVICE_MAC_PREFIXES[type])) || null
}

export function isBmsMac(mac: string): boolean {
	return resolveDeviceTypeByMac(mac) === DEVICE_TYPE_BMS
}

export function isMeterMac(mac: string): boolean {
	return resolveDeviceTypeByMac(mac) === DEVICE_TYPE_METER
}
