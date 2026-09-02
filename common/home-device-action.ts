const INVALID_DEVICE_ACTION_IDS = new Set(['undefined', 'null', '[object object]'])

export type HomeDeviceActionTarget = {
	id?: unknown
}

export const resolveHomeDeviceActionId = (target: HomeDeviceActionTarget | null | undefined): string => {
	if (!target || typeof target !== 'object') return ''
	const raw = target.id
	if (raw === undefined || raw === null) return ''

	const deviceId = String(raw).trim()
	if (!deviceId || INVALID_DEVICE_ACTION_IDS.has(deviceId.toLowerCase())) return ''
	return deviceId
}
