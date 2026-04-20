import { normalizeMac } from '@/common/device-provision/ble'

type BleDeviceIdMemoryEntry = {
	mac: string
	platform: string
	deviceId: string
	updatedAt: number
}

const STORAGE_KEY = '__ble_device_id_memory__'

const normalizePlatform = (platform: unknown) => String(platform || '').trim().toLowerCase()

const normalizeEntry = (entry: Partial<BleDeviceIdMemoryEntry>): BleDeviceIdMemoryEntry | null => {
	const mac = normalizeMac(String(entry?.mac || ''))
	const platform = normalizePlatform(entry?.platform)
	const deviceId = String(entry?.deviceId || '').trim()
	const updatedAt = Number(entry?.updatedAt || Date.now())
	if (!mac || !platform || !deviceId) return null
	return {
		mac,
		platform,
		deviceId,
		updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
	}
}

const readStore = (): Record<string, BleDeviceIdMemoryEntry> => {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY)
		if (!raw || typeof raw !== 'object') return {}
		const next: Record<string, BleDeviceIdMemoryEntry> = {}
		for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
			const normalized = normalizeEntry(value as Partial<BleDeviceIdMemoryEntry>)
			if (normalized) next[key] = normalized
		}
		return next
	} catch (e) {
		return {}
	}
}

const writeStore = (store: Record<string, BleDeviceIdMemoryEntry>) => {
	try {
		uni.setStorageSync(STORAGE_KEY, store)
	} catch (e) {}
}

const buildKey = (mac: unknown, platform: unknown) => {
	const normalizedMac = normalizeMac(String(mac || ''))
	const normalizedPlatform = normalizePlatform(platform)
	if (!normalizedMac || !normalizedPlatform) return ''
	return `${normalizedPlatform}:${normalizedMac}`
}

export const getRememberedBleDeviceId = (mac: unknown, platform: unknown): string => {
	const key = buildKey(mac, platform)
	if (!key) return ''
	const entry = readStore()[key]
	return entry?.deviceId ? String(entry.deviceId).trim() : ''
}

export const rememberBleDeviceId = ({
	mac,
	platform,
	deviceId,
}: {
	mac: unknown
	platform: unknown
	deviceId: unknown
}) => {
	const key = buildKey(mac, platform)
	if (!key) return
	const normalized = normalizeEntry({
		mac: String(mac || ''),
		platform: String(platform || ''),
		deviceId: String(deviceId || ''),
		updatedAt: Date.now(),
	})
	if (!normalized) return
	const store = readStore()
	store[key] = normalized
	writeStore(store)
}

export const clearRememberedBleDeviceId = (mac: unknown, platform: unknown) => {
	const key = buildKey(mac, platform)
	if (!key) return
	const store = readStore()
	if (!store[key]) return
	delete store[key]
	writeStore(store)
}
