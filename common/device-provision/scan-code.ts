import { normalizeHex, normalizeMac } from './ble'

export type AddDeviceScanCode =
	| { type: 'mac'; value: string }
	| { type: 'uuid'; value: string }

/**
 * 扫码添加补充说明：
 * - 扫码结果可能是 MAC（12 hex，如 AC502C2D6462）
 * - 也可能是 UUID（32 hex，对应后端 device_batteries.item_uuid）
 */
export function parseAddDeviceScanCode(raw: string): AddDeviceScanCode | null {
	const hex = normalizeHex(raw)
	const mac = normalizeMac(hex)
	if (mac) return { type: 'mac', value: mac }
	if (/^[0-9A-F]{32}$/.test(hex)) return { type: 'uuid', value: hex }
	return null
}

