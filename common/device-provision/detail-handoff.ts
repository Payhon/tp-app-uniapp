import { normalizeHex, normalizeMac } from './ble'
import {
	normalizeDeviceDetailDiscoveryEntrySource,
	type DeviceDetailDiscoveryEntrySource,
} from './detail-entry-source'

export type DeviceDetailHandoffSource = 'provision_success'

export type DeviceDetailHandoff = {
	deviceId: string
	bleMac: string
	deviceName?: string
	itemUuid?: string
	bmsCommType?: number | null
	entrySource?: DeviceDetailDiscoveryEntrySource
	source: DeviceDetailHandoffSource
	createdAt: number
}

const STORAGE_KEY = '__DEVICE_DETAIL_HANDOFF__'
const HANDOFF_TTL_MS = 30_000

const normalizePayload = (payload: Partial<DeviceDetailHandoff> | null | undefined): DeviceDetailHandoff | null => {
	if (!payload) return null
	const deviceId = String(payload.deviceId || '').trim()
	const bleMac = normalizeMac(String(payload.bleMac || ''))
	if (!deviceId || !bleMac) return null
	const itemUuid = payload.itemUuid ? normalizeHex(payload.itemUuid) : ''
	return {
		deviceId,
		bleMac,
		deviceName: String(payload.deviceName || '').trim() || undefined,
		itemUuid: itemUuid || undefined,
		bmsCommType: payload.bmsCommType == null ? null : Number(payload.bmsCommType),
		entrySource: normalizeDeviceDetailDiscoveryEntrySource(payload.entrySource),
		source: payload.source === 'provision_success' ? 'provision_success' : 'provision_success',
		createdAt: Number(payload.createdAt || Date.now()),
	}
}

const readStoredHandoff = (): DeviceDetailHandoff | null => {
	try {
		return normalizePayload(uni.getStorageSync(STORAGE_KEY) as Partial<DeviceDetailHandoff>)
	} catch (e) {
		return null
	}
}

const isFresh = (payload: DeviceDetailHandoff | null): payload is DeviceDetailHandoff => {
	if (!payload) return false
	return Date.now() - payload.createdAt <= HANDOFF_TTL_MS
}

export const saveDeviceDetailHandoff = (payload: Partial<DeviceDetailHandoff>) => {
	const normalized = normalizePayload(payload)
	if (!normalized) return false
	try {
		uni.setStorageSync(STORAGE_KEY, normalized)
		return true
	} catch (e) {
		return false
	}
}

export const peekDeviceDetailHandoff = (deviceId?: string | null): DeviceDetailHandoff | null => {
	const payload = readStoredHandoff()
	if (!isFresh(payload)) {
		clearDeviceDetailHandoff()
		return null
	}
	if (deviceId && String(deviceId).trim() !== payload.deviceId) return null
	return payload
}

export const consumeDeviceDetailHandoff = (deviceId?: string | null): DeviceDetailHandoff | null => {
	const payload = peekDeviceDetailHandoff(deviceId)
	if (!payload) return null
	clearDeviceDetailHandoff()
	return payload
}

export const clearDeviceDetailHandoff = () => {
	try {
		uni.removeStorageSync(STORAGE_KEY)
	} catch (e) {}
}
