export type MeterBmsOtaSessionMode = 'cloud' | 'instrument'

export type MeterBmsOtaAvailability = {
	visible: boolean
	enabled: boolean
	model: string
	version: string
}

function normalizeText(value: unknown): string {
	return value == null ? '' : String(value).trim()
}

export function normalizeBmsItemUuid(value: unknown): string {
	const normalized = normalizeText(value).replace(/[^0-9a-fA-F]/g, '').toUpperCase()
	return /^[0-9A-F]{32}$/.test(normalized) ? normalized : ''
}

export function resolveMeterBmsOtaAvailability(options: {
	connType: 'bluetooth' | 'mqtt' | 'offline'
	sessionMode: MeterBmsOtaSessionMode
	isMeterDevice: boolean
	hasClient: boolean
	hardwareModel: unknown
	softwareVersion: unknown
}): MeterBmsOtaAvailability {
	const model = normalizeText(options.hardwareModel)
	const version = normalizeText(options.softwareVersion)
	const visible =
		options.connType === 'bluetooth' && options.sessionMode === 'instrument' && options.isMeterDevice
	return {
		visible,
		enabled: visible && options.hasClient && model !== '' && version !== '',
		model,
		version,
	}
}

export function buildMeterBmsOtaCheckPayload(options: {
	itemUuid?: unknown
	model: unknown
	version: unknown
}): {
	model: string
	version: string
	item_uuid?: string
} {
	const model = normalizeText(options.model)
	const version = normalizeText(options.version)
	const itemUuid = normalizeBmsItemUuid(options.itemUuid)
	return {
		model,
		version,
		...(itemUuid ? { item_uuid: itemUuid } : {}),
	}
}
