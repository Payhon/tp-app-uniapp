export type DeviceDetailConnType = 'bluetooth' | 'mqtt' | 'offline'

export type DashboardDeviceIdentifier = {
	kind: 'imei' | 'mac'
	value: string
	text: string
}

export type DashboardDeviceIdentifierInput = {
	connType: DeviceDetailConnType
	bmsCommType?: number | null
	imei?: unknown
	batteryBleMac?: unknown
	statusBleMac?: unknown
}

export const normalizeDetailUuid = (raw: unknown): string => String(raw ?? '').trim()

export const formatDetailMac = (raw: unknown): string => {
	const value = String(raw ?? '').trim()
	const hex = value.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
	if (hex.length !== 12) return value || '-'
	return hex.match(/.{2}/g)?.join(':') || value
}

export const resolveDashboardDeviceIdentifier = (
	input: DashboardDeviceIdentifierInput
): DashboardDeviceIdentifier => {
	const commType = Number(input.bmsCommType || 0)
	const usesFourGIdentifier = (commType === 2 || commType === 3) && input.connType !== 'bluetooth'

	if (usesFourGIdentifier) {
		const imei = String(input.imei ?? '').trim()
		const value = imei || '-'
		return {
			kind: 'imei',
			value,
			text: `IMEI: ${value}`,
		}
	}

	const batteryBleMac = String(input.batteryBleMac ?? '').trim()
	const statusBleMac = String(input.statusBleMac ?? '').trim()
	const value = formatDetailMac(batteryBleMac || statusBleMac)
	return {
		kind: 'mac',
		value,
		text: value,
	}
}
