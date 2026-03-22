declare function require(path: string): any

export type SupportedDeviceType = 'bms' | 'meter'

type DevicePrefixModule = {
	DEVICE_TYPE_BMS: 'bms'
	DEVICE_TYPE_METER: 'meter'
	DEVICE_MAC_PREFIXES: Record<SupportedDeviceType, readonly string[]>
	SUPPORTED_DEVICE_TYPES: readonly SupportedDeviceType[]
	resolveDeviceTypeByMac: (mac: string) => SupportedDeviceType | null
	isBmsMac: (mac: string) => boolean
	isMeterMac: (mac: string) => boolean
}

const devicePrefixModule = require('./device-prefix.js') as DevicePrefixModule

export const DEVICE_TYPE_BMS = devicePrefixModule.DEVICE_TYPE_BMS
export const DEVICE_TYPE_METER = devicePrefixModule.DEVICE_TYPE_METER
export const DEVICE_MAC_PREFIXES = devicePrefixModule.DEVICE_MAC_PREFIXES
export const SUPPORTED_DEVICE_TYPES = devicePrefixModule.SUPPORTED_DEVICE_TYPES
export const resolveDeviceTypeByMac = devicePrefixModule.resolveDeviceTypeByMac
export const isBmsMac = devicePrefixModule.isBmsMac
export const isMeterMac = devicePrefixModule.isMeterMac
