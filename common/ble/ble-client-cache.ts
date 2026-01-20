import { BmsClient, createUniBleBmsTransport, type UniBleBmsTransport } from '@/common/lib/bms-protocol'
import { mac12ToColon, normalizeMac, parseMacFromAdvertisement } from '@/common/device-provision/ble'

type FoundBleDevice = {
	deviceId: string
	name?: string
	localName?: string
	RSSI?: number
	advertisData?: ArrayBuffer
	advertisingData?: ArrayBuffer
}

export type BleClientEntry = {
	key: string
	mac: string
	deviceId: string
	client: BmsClient
	transport: UniBleBmsTransport
	connectedAt: number
	lastUsedAt: number
	maxReadRegisters?: number
	refCount: number
	cleanupTimer?: number | null
}

const cache = new Map<string, BleClientEntry>()
const inFlight = new Map<string, Promise<BleClientEntry | null>>()

const IDLE_DISCONNECT_MS = 30_000

const log = (event: string, data?: Record<string, unknown>) => {
	try {
		const ts = new Date().toISOString().slice(11, 23)
		console.log(`[ble-cache ${ts}] ${event}`, data || {})
	} catch (e) {}
}

const normalizeBleMac = (mac: unknown): string | null => {
	const m = normalizeMac(String(mac || ''))
	return m || null
}

const extractMacHex = (s: unknown) => {
	const raw = String(s || '').toUpperCase()
	const hex = raw.replace(/[^0-9A-F]/g, '')
	if (hex.length === 12) return hex
	const m = raw.match(/[0-9A-F]{12}/g)
	if (m && m.length) return m[m.length - 1]
	return ''
}

const discoverWithAdv = async ({ durationMs }: { durationMs: number }): Promise<FoundBleDevice[]> => {
	const found = new Map<string, FoundBleDevice>()

	const onFound = (res: { devices?: FoundBleDevice[] }) => {
		const list = (res && res.devices) || []
		for (const d of list) {
			if (!d?.deviceId) continue
			found.set(String(d.deviceId), d)
		}
	}

	const offFn = (uni as any).offBluetoothDeviceFound
	if (typeof offFn === 'function') offFn(onFound)
	uni.onBluetoothDeviceFound(onFound as any)

	try {
		await new Promise((resolve, reject) => {
			uni.startBluetoothDevicesDiscovery({
				allowDuplicatesKey: true,
				success: resolve,
				fail: reject,
			})
		})
		await new Promise((r) => setTimeout(r, durationMs))
	} finally {
		try {
			await new Promise((resolve) => uni.stopBluetoothDevicesDiscovery({ complete: resolve }))
		} catch (e) {}
	}
	return Array.from(found.values())
}

const pickCandidate = (list: FoundBleDevice[], targetMac: string) => {
	const candidates = (list || [])
		.map((d: any) => {
			const adv = (d as any).advertisData || (d as any).advertisingData || null
			const advMac = parseMacFromAdvertisement(adv)
			const idHex = extractMacHex(d?.deviceId)
			const nameHex = extractMacHex(d?.name || d?.localName)
			const ok =
				(advMac && advMac === targetMac) ||
				(idHex && idHex === targetMac) ||
				(nameHex && nameHex === targetMac) ||
				(String(d?.name || d?.localName || '').toUpperCase().includes(targetMac))
			return { d, ok, rssi: Number(d?.RSSI ?? -9999) }
		})
		.filter((x) => x.ok)
		.sort((a, b) => b.rssi - a.rssi)
	return candidates[0]?.d || null
}

let connectLock = Promise.resolve()
const runSerial = async <T>(fn: () => Promise<T>): Promise<T> => {
	const prev = connectLock
	let release: (() => void) | null = null
	connectLock = new Promise<void>((resolve) => {
		release = resolve
	})
	await prev
	try {
		return await fn()
	} finally {
		if (release) release()
	}
}

const touchEntry = (entry: BleClientEntry) => {
	entry.lastUsedAt = Date.now()
	if (entry.cleanupTimer != null) {
		clearTimeout(entry.cleanupTimer)
		entry.cleanupTimer = null
	}
}

const scheduleCleanup = (entry: BleClientEntry) => {
	if (entry.cleanupTimer != null) clearTimeout(entry.cleanupTimer)
	entry.cleanupTimer = setTimeout(async () => {
		if (entry.refCount > 0) return
		log('idle disconnect', { mac: entry.mac, deviceId: entry.deviceId })
		try {
			await entry.transport.disconnect()
		} catch (e) {}
		cache.delete(entry.key)
	}, IDLE_DISCONNECT_MS) as unknown as number
}

export const getBleClientEntry = (
	mac: unknown,
	options?: { touch?: boolean }
): BleClientEntry | null => {
	const key = normalizeBleMac(mac)
	if (!key) return null
	const entry = cache.get(key) || null
	if (entry && options?.touch) touchEntry(entry)
	return entry
}

export const retainBleClient = (mac: unknown) => {
	const key = normalizeBleMac(mac)
	if (!key) return null
	const entry = cache.get(key) || null
	if (!entry) return null
	entry.refCount += 1
	touchEntry(entry)
	return entry
}

export const releaseBleClient = (mac: unknown) => {
	const key = normalizeBleMac(mac)
	if (!key) return
	const entry = cache.get(key)
	if (!entry) return
	entry.refCount = Math.max(0, entry.refCount - 1)
	if (entry.refCount === 0) scheduleCleanup(entry)
}

export const canBleAutoConnect = (commType: unknown, bleMac: unknown) => {
	const mac = normalizeBleMac(bleMac)
	if (!mac) return { ok: false, mac: null }
	const ct = Number(commType || 0)
	if (ct === 1 || ct === 3) return { ok: true, mac }
	if (!Number.isFinite(ct) || ct === 0) return { ok: true, mac }
	return { ok: false, mac: null }
}

type ConnectBleOptions = {
	mac: unknown
	maxReadRegisters?: number
	force?: boolean
	probe?: boolean
}

const closeEntry = async (entry: BleClientEntry) => {
	try {
		if (entry.cleanupTimer != null) {
			clearTimeout(entry.cleanupTimer)
			entry.cleanupTimer = null
		}
		await entry.transport.disconnect()
	} catch (e) {}
	cache.delete(entry.key)
}

export const connectBleClient = async ({
	mac,
	maxReadRegisters,
	force = false,
	probe = false,
}: ConnectBleOptions): Promise<BleClientEntry | null> => {
	const key = normalizeBleMac(mac)
	if (!key) return null

	const desiredMax = Number.isFinite(maxReadRegisters as number) ? Number(maxReadRegisters) : undefined
	const cached = cache.get(key)
	if (cached && !force) {
		if (desiredMax != null && cached.maxReadRegisters !== desiredMax) {
			log('maxReadRegisters mismatch, reconnect', { mac: key, cached: cached.maxReadRegisters, desired: desiredMax })
			await closeEntry(cached)
		} else if (probe) {
			try {
				await cached.client.readUuid()
				touchEntry(cached)
				return cached
			} catch (e) {
				log('probe failed, reconnect', { mac: key })
				await closeEntry(cached)
			}
		} else {
			touchEntry(cached)
			return cached
		}
	}

	const existing = inFlight.get(key)
	if (existing) return existing

	const task = runSerial(async () => {
		log('connect start', { mac: key })
		const transport = createUniBleBmsTransport({})
		try {
			const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : ({} as any)
			const platform = String((sys as any)?.platform || '').toLowerCase()
			const isAndroid = platform === 'android'

			if (isAndroid) {
				const directCandidates = [
					mac12ToColon(key),
					mac12ToColon(key).toLowerCase(),
					key,
					key.toLowerCase(),
				].filter(Boolean)
				for (const cand of directCandidates) {
					try {
						log('direct connect try', { deviceId: cand, mac: key })
						await transport.connect({ deviceId: cand })
						const client = new BmsClient({ transport, maxReadRegisters: desiredMax })
						const entry: BleClientEntry = {
							key,
							mac: key,
							deviceId: cand,
							client,
							transport,
							connectedAt: Date.now(),
							lastUsedAt: Date.now(),
							maxReadRegisters: desiredMax,
							refCount: 0,
							cleanupTimer: null,
						}
						log('direct connect ok', { deviceId: cand, mac: key })
						return entry
					} catch (e) {
						log('direct connect failed', { deviceId: cand, mac: key })
						try {
							await transport.disconnect()
						} catch (e2) {}
					}
				}
			}

			try {
				await transport.init()
			} catch (e) {
				log('ble init failed', { mac: key })
			}

			const list = await discoverWithAdv({ durationMs: 5000 })
			const hit = pickCandidate(list, key)
			if (!hit?.deviceId) {
				log('discover no match', { mac: key, found: Array.isArray(list) ? list.length : 0 })
				return null
			}

			log('discover connect try', { deviceId: hit.deviceId, mac: key })
			await transport.connect({ deviceId: hit.deviceId })
			const client = new BmsClient({ transport, maxReadRegisters: desiredMax })
			const entry: BleClientEntry = {
				key,
				mac: key,
				deviceId: hit.deviceId,
				client,
				transport,
				connectedAt: Date.now(),
				lastUsedAt: Date.now(),
				maxReadRegisters: desiredMax,
				refCount: 0,
				cleanupTimer: null,
			}
			log('discover connect ok', { deviceId: hit.deviceId, mac: key })
			return entry
		} catch (e) {
			log('connect failed', { mac: key })
			try {
				await transport.disconnect()
			} catch (e2) {}
			return null
		}
	})

	inFlight.set(key, task)
	try {
		const entry = await task
		if (entry) cache.set(key, entry)
		return entry
	} finally {
		inFlight.delete(key)
	}
}
