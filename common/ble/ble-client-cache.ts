import { BmsClient, createUniBleBmsTransport, type UniBleBmsTransport } from '@/common/lib/bms-protocol'
import { mac12ToColon, normalizeMac, parseMacFromAdvertisement } from '@/common/device-provision/ble'
import { getRememberedBleDeviceId, rememberBleDeviceId } from './ble-device-id-memory'

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

export type AdoptBleClientConnectionOptions = {
	mac: unknown
	deviceId: string
	client: BmsClient
	transport: UniBleBmsTransport
	maxReadRegisters?: number
}

const cache = new Map<string, BleClientEntry>()
const inFlight = new Map<string, Promise<BleClientEntry | null>>()

const IDLE_DISCONNECT_MS = 30_000
const CONNECT_LOCK_WAIT_TIMEOUT_MS = 8_000
const CANCELLED_CONNECT_LOCK_WAIT_TIMEOUT_MS = 1_200
let connectEpoch = 0
let cancelledConnectFastWaitUntil = 0

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

const isDeviceIdCompatibleWithTarget = (deviceId: unknown, targetMac: string): boolean => {
	const raw = String(deviceId || '').trim().toUpperCase()
	if (/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(raw)) return true
	const explicitMac = raw.match(/(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}/)
	if (explicitMac) return normalizeMac(explicitMac[0]) === targetMac
	const idHex = extractMacHex(raw)
	return !idHex || idHex === targetMac
}

const pushCompatibleCandidate = (out: string[], value: unknown, targetMac: string) => {
	const next = String(value || '').trim()
	if (!next || out.includes(next)) return
	if (!isDeviceIdCompatibleWithTarget(next, targetMac)) {
		log('ignore incompatible deviceId candidate', { deviceId: next, mac: targetMac })
		return
	}
	out.push(next)
}

const bytesToHex = (bytes: Uint8Array, maxBytes?: number) => {
	const limit = maxBytes ? Math.min(bytes.length, maxBytes) : bytes.length
	let out = ''
	for (let i = 0; i < limit; i += 1) out += (bytes[i] & 0xff).toString(16).padStart(2, '0')
	return (bytes.length > limit ? `${out}...` : out).toUpperCase()
}

const normalizeHexPreview = (input: string, maxChars: number) => {
	const hex = String(input || '')
		.trim()
		.replace(/^0x/i, '')
		.replace(/[^0-9a-fA-F]/g, '')
		.toUpperCase()
	if (!hex) return ''
	return hex.length > maxChars ? `${hex.slice(0, maxChars)}...` : hex
}

const toHexPreview = (data: unknown, maxBytes = 32): string => {
	if (!data) return ''
	if (typeof data === 'string') return normalizeHexPreview(data, maxBytes * 2)
	if (data instanceof Uint8Array) return bytesToHex(data, maxBytes)
	if (data instanceof ArrayBuffer) return bytesToHex(new Uint8Array(data), maxBytes)
	if (typeof data === 'object') {
		const obj = data as Record<string, unknown>
		const manuf = obj.manufacturerData || obj.manufacturerdata
		if (manuf) return toHexPreview(manuf, maxBytes)
	}
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
		try {
			const cleanupOffFn = (uni as any).offBluetoothDeviceFound
			if (typeof cleanupOffFn === 'function') cleanupOffFn(onFound)
		} catch (e) {}
	}
	return Array.from(found.values())
}

const discoverWithAdvAbortable = async ({
	durationMs,
	epoch,
	mac,
}: {
	durationMs: number
	epoch: number
	mac: string
}): Promise<FoundBleDevice[]> => {
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
		assertConnectActive(epoch, mac)
		await new Promise((resolve, reject) => {
			uni.startBluetoothDevicesDiscovery({
				allowDuplicatesKey: true,
				success: resolve,
				fail: reject,
			})
		})
		const stepMs = 250
		let elapsed = 0
		while (elapsed < durationMs) {
			assertConnectActive(epoch, mac)
			const waitMs = Math.min(stepMs, durationMs - elapsed)
			await new Promise((r) => setTimeout(r, waitMs))
			elapsed += waitMs
		}
		assertConnectActive(epoch, mac)
	} finally {
		try {
			await new Promise((resolve) => uni.stopBluetoothDevicesDiscovery({ complete: resolve }))
		} catch (e) {}
		try {
			const cleanupOffFn = (uni as any).offBluetoothDeviceFound
			if (typeof cleanupOffFn === 'function') cleanupOffFn(onFound)
		} catch (e) {}
	}
	return Array.from(found.values())
}

const buildAdvSummary = (d: any, targetMac?: string) => {
	const adv = (d as any).advertisData || (d as any).advertisingData || null
	const advMac = parseMacFromAdvertisement(adv) || parseMacFromAdvertisement(d)
	const idHex = extractMacHex(d?.deviceId)
	const nameHex = extractMacHex(d?.name || d?.localName)
	const advLen = adv instanceof ArrayBuffer ? adv.byteLength : adv instanceof Uint8Array ? adv.length : undefined
	const ok =
		!!targetMac &&
		((advMac && advMac === targetMac) ||
			(idHex && idHex === targetMac) ||
			(nameHex && nameHex === targetMac) ||
			String(d?.name || d?.localName || '').toUpperCase().includes(targetMac))
	return {
		deviceId: d?.deviceId,
		name: d?.name,
		localName: d?.localName,
		rssi: d?.RSSI,
		advMac,
		idHex,
		nameHex,
		advLen,
		advHex: toHexPreview(adv, 32),
		manufHex: toHexPreview((d as any).manufacturerData || (d as any).manufacturerdata, 32),
		ok,
	}
}

const pickCandidate = (list: FoundBleDevice[], targetMac: string) => {
	const candidates = (list || [])
		.map((d: any) => {
			const summary = buildAdvSummary(d, targetMac)
			return { d, summary, rssi: Number(d?.RSSI ?? -9999) }
		})
		.filter((x) => x.summary.ok)
		.sort((a, b) => b.rssi - a.rssi)
	return {
		hit: candidates[0]?.d || null,
		summaries: (list || []).map((d: any) => buildAdvSummary(d, targetMac)),
	}
}

const summarizeDeviceLines = (summaries: ReturnType<typeof buildAdvSummary>[]) => {
	return summaries
		.map((s) => {
			const name = String(s.name || s.localName || '')
			const namePart = name ? ` name=${name}` : ''
			const advMac = s.advMac ? ` advMac=${s.advMac}` : ''
			const advLen = typeof s.advLen === 'number' ? ` advLen=${s.advLen}` : ''
			const advHex = s.advHex ? ` advHex=${s.advHex}` : ''
			const manufHex = s.manufHex ? ` manufHex=${s.manufHex}` : ''
			const idHex = s.idHex ? ` idHex=${s.idHex}` : ''
			const nameHex = s.nameHex ? ` nameHex=${s.nameHex}` : ''
			return `id=${s.deviceId || ''} rssi=${s.rssi ?? ''}${namePart}${advMac}${advLen}${advHex}${manufHex}${idHex}${nameHex}`
		})
		.join(' | ')
}

const createBleClientEntry = ({
	key,
	deviceId,
	transport,
	maxReadRegisters,
}: {
	key: string
	deviceId: string
	transport: UniBleBmsTransport
	maxReadRegisters?: number
}): BleClientEntry => {
	return {
		key,
		mac: key,
		deviceId,
		client: new BmsClient({ transport, maxReadRegisters }),
		transport,
		connectedAt: Date.now(),
		lastUsedAt: Date.now(),
		maxReadRegisters,
		refCount: 0,
		cleanupTimer: null,
	}
}

const waitConnectTaskSettled = async (task: Promise<unknown>, timeoutMs: number): Promise<boolean> => {
	let settled = false
	await Promise.race([
		task.then(
			() => {
				settled = true
			},
			() => {
				settled = true
			}
		),
		new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
	])
	return settled
}

let connectLock = Promise.resolve()
const runSerial = async <T>(fn: () => Promise<T>): Promise<T> => {
	const prev = connectLock
	let release!: () => void
	connectLock = new Promise<void>((resolve) => {
		release = resolve
	})
	const waitTimeoutMs =
		Date.now() < cancelledConnectFastWaitUntil ? CANCELLED_CONNECT_LOCK_WAIT_TIMEOUT_MS : CONNECT_LOCK_WAIT_TIMEOUT_MS
	const prevSettled = await waitConnectTaskSettled(prev, waitTimeoutMs)
	if (!prevSettled) {
		log('connect lock wait timeout, continue next task', { timeoutMs: waitTimeoutMs })
	}
	try {
		return await fn()
	} finally {
		release()
	}
}

class BleConnectCancelledError extends Error {
	constructor(message = 'ble connect cancelled') {
		super(message)
		this.name = 'BleConnectCancelledError'
	}
}

const assertConnectActive = (epoch: number, mac: string) => {
	if (epoch !== connectEpoch) {
		log('connect cancelled', { mac, epoch, active_epoch: connectEpoch })
		throw new BleConnectCancelledError()
	}
}

const buildIosDirectCandidates = (mac: string, preferredDeviceId?: string) => {
	const out: string[] = []
	const push = (value: unknown) => pushCompatibleCandidate(out, value, mac)
	push(preferredDeviceId)
	const cached = cache.get(mac)
	if (cached?.deviceId) push(cached.deviceId)
	push(getRememberedBleDeviceId(mac, 'ios'))
	return out
}

const connectDirectCandidate = async ({
	label,
	key,
	epoch,
	platform,
	deviceId,
	transport,
	maxReadRegisters,
}: {
	label: string
	key: string
	epoch: number
	platform: string
	deviceId: string
	transport: UniBleBmsTransport
	maxReadRegisters?: number
}) => {
	assertConnectActive(epoch, key)
	log(`${label} try`, { deviceId, mac: key })
	await transport.connect({ deviceId })
	assertConnectActive(epoch, key)
	rememberBleDeviceId({ mac: key, platform, deviceId })
	const entry = createBleClientEntry({ key, deviceId, transport, maxReadRegisters })
	log(`${label} ok`, { deviceId, mac: key })
	return entry
}

const discoverBleCandidate = async ({
	key,
	epoch,
	durationsMs,
}: {
	key: string
	epoch: number
	durationsMs: number[]
}) => {
	const found = new Map<string, FoundBleDevice>()
	for (let i = 0; i < durationsMs.length; i += 1) {
		const durationMs = durationsMs[i]
		log('discover fallback start', { mac: key, durationMs, phase: i + 1, totalPhases: durationsMs.length })
		const list = await discoverWithAdvAbortable({ durationMs, epoch, mac: key })
		assertConnectActive(epoch, key)
		for (const item of list || []) {
			if (!item?.deviceId) continue
			found.set(String(item.deviceId), item)
		}
		const merged = Array.from(found.values())
		const { hit, summaries } = pickCandidate(merged, key)
		if (hit?.deviceId) {
			log('discover fallback hit', { mac: key, deviceId: hit.deviceId, phase: i + 1, found: merged.length })
			return { hit, summaries }
		}
		log('discover fallback timeout', { mac: key, durationMs, phase: i + 1, found: merged.length })
	}
	const merged = Array.from(found.values())
	return { hit: null, summaries: merged.map((d: any) => buildAdvSummary(d, key)) }
}

export const invalidateBleConnectAttempts = (reason = 'manual') => {
	connectEpoch += 1
	cancelledConnectFastWaitUntil = Date.now() + 3_000
	log('invalidate connect attempts', { reason, epoch: connectEpoch })
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

export const disconnectBleClient = async (mac: unknown): Promise<boolean> => {
	const key = normalizeBleMac(mac)
	if (!key) return false
	const pending = inFlight.get(key)
	if (pending) {
		try {
			await pending
		} catch (e) {}
	}
	const entry = cache.get(key)
	if (!entry) return false
	try {
		if (entry.cleanupTimer != null) {
			clearTimeout(entry.cleanupTimer)
			entry.cleanupTimer = null
		}
		entry.refCount = 0
		await entry.transport.disconnect()
		log('manual disconnect', { mac: key, deviceId: entry.deviceId })
		return true
	} catch (e) {
		log('manual disconnect failed', { mac: key, deviceId: entry.deviceId })
		return false
	} finally {
		cache.delete(key)
	}
}

export const canBleAutoConnect = (commType: unknown, bleMac: unknown) => {
	const mac = normalizeBleMac(bleMac)
	if (!mac) return { ok: false, mac: null }
	const ct = Number(commType || 0)
	// 生产数据可能存在 bms_comm_type 与设备实际能力不同步；只要有有效 BLE MAC 就允许尝试 BLE 连接。
	if (!Number.isFinite(ct) || ct === 0 || ct === 1 || ct === 2 || ct === 3) return { ok: true, mac }
	return { ok: true, mac }
}

type ConnectBleOptions = {
	mac: unknown
	maxReadRegisters?: number
	force?: boolean
	probe?: boolean
	preferredDeviceId?: string
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

export const adoptBleClientConnection = async ({
	mac,
	deviceId,
	client,
	transport,
	maxReadRegisters,
}: AdoptBleClientConnectionOptions): Promise<BleClientEntry | null> => {
	const key = normalizeBleMac(mac)
	const normalizedDeviceId = String(deviceId || '').trim()
	if (!key || !normalizedDeviceId || !client || !transport) return null
	const pending = inFlight.get(key)
	if (pending) {
		try {
			await pending
		} catch (e) {}
	}
	const existing = cache.get(key)
	if (existing && existing.transport !== transport) {
		await closeEntry(existing)
	}
	const entry: BleClientEntry = {
		key,
		mac: key,
		deviceId: normalizedDeviceId,
		client,
		transport,
		connectedAt: existing?.transport === transport ? existing.connectedAt : Date.now(),
		lastUsedAt: Date.now(),
		maxReadRegisters:
			Number.isFinite(maxReadRegisters as number) ? Number(maxReadRegisters) : existing?.maxReadRegisters,
		refCount: existing?.transport === transport ? existing.refCount : 0,
		cleanupTimer: null,
	}
	cache.set(key, entry)
	if (entry.refCount === 0) scheduleCleanup(entry)
	log('adopt connection', { mac: key, deviceId: normalizedDeviceId, refCount: entry.refCount })
	return entry
}

export const connectBleClient = async ({
	mac,
	maxReadRegisters,
	force = false,
	probe = false,
	preferredDeviceId,
}: ConnectBleOptions): Promise<BleClientEntry | null> => {
	const key = normalizeBleMac(mac)
	if (!key) return null
	const epoch = connectEpoch

	const desiredMax = Number.isFinite(maxReadRegisters as number) ? Number(maxReadRegisters) : undefined
	const cached = cache.get(key)
	if (cached && force) {
		log('force reconnect closes cached entry first', {
			mac: key,
			deviceId: cached.deviceId,
			refCount: cached.refCount,
		})
		await closeEntry(cached)
	}
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
	if (existing) {
		if (!force) return existing
		log('force connect waits existing pending task', { mac: key })
		const settled = await waitConnectTaskSettled(existing, CONNECT_LOCK_WAIT_TIMEOUT_MS)
		if (!settled) {
			log('force connect pending task timeout, replace it', { mac: key, timeoutMs: CONNECT_LOCK_WAIT_TIMEOUT_MS })
			if (inFlight.get(key) === existing) inFlight.delete(key)
		}
	}

	const task = runSerial(async () => {
		log('connect start', { mac: key })
		const transport = createUniBleBmsTransport({})
		try {
			assertConnectActive(epoch, key)
			const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : ({} as any)
			const platform = String((sys as any)?.platform || '').toLowerCase()
			const isAndroid = platform === 'android'
			const isIOS = platform === 'ios'

			if (isAndroid) {
				const directCandidates: string[] = []
				pushCompatibleCandidate(directCandidates, preferredDeviceId, key)
				pushCompatibleCandidate(directCandidates, mac12ToColon(key), key)
				pushCompatibleCandidate(directCandidates, mac12ToColon(key).toLowerCase(), key)
				pushCompatibleCandidate(directCandidates, key, key)
				pushCompatibleCandidate(directCandidates, key.toLowerCase(), key)
				for (const cand of directCandidates) {
					try {
						return await connectDirectCandidate({
							label: 'direct connect',
							key,
							epoch,
							platform,
							deviceId: cand,
							transport,
							maxReadRegisters: desiredMax,
						})
					} catch (e) {
						if (e instanceof BleConnectCancelledError) throw e
						log('direct connect failed', { deviceId: cand, mac: key })
						try {
							await transport.disconnect()
						} catch (e2) {}
					}
				}
			}

			if (isIOS) {
				for (const cand of buildIosDirectCandidates(key, preferredDeviceId)) {
					try {
						return await connectDirectCandidate({
							label: 'ios direct connect',
							key,
							epoch,
							platform,
							deviceId: cand,
							transport,
							maxReadRegisters: desiredMax,
						})
					} catch (e) {
						if (e instanceof BleConnectCancelledError) throw e
						log('ios direct connect failed', { deviceId: cand, mac: key })
						try {
							await transport.disconnect()
						} catch (e2) {}
					}
				}
			}

			try {
				assertConnectActive(epoch, key)
				await transport.init()
			} catch (e) {
				log('ble init failed', { mac: key })
			}

			const discoverDurations = isIOS ? [1500, 3500] : [5000]
			const { hit, summaries } = await discoverBleCandidate({ key, epoch, durationsMs: discoverDurations })
			if (!hit?.deviceId) {
				log('discover no match', {
					mac: key,
					found: Array.isArray(summaries) ? summaries.length : 0,
					devices: summaries.slice(0, 10),
					devicesText: summarizeDeviceLines(summaries.slice(0, 10)),
				})
				return null
			}

			const hitSummary = summaries.find((s) => s.deviceId === hit.deviceId)
			if (hitSummary) {
				log('discover candidate', {
					mac: key,
					deviceId: hit.deviceId,
					advMac: hitSummary.advMac,
					advHex: hitSummary.advHex,
					manufHex: hitSummary.manufHex,
					deviceText: summarizeDeviceLines([hitSummary]),
				})
			}

			log('discover connect try', { deviceId: hit.deviceId, mac: key })
			await transport.connect({ deviceId: hit.deviceId })
			assertConnectActive(epoch, key)
			rememberBleDeviceId({ mac: key, platform, deviceId: hit.deviceId })
			const entry = createBleClientEntry({
				key,
				deviceId: hit.deviceId,
				transport,
				maxReadRegisters: desiredMax,
			})
			log('discover connect ok', { deviceId: hit.deviceId, mac: key })
			return entry
		} catch (e) {
			if (e instanceof BleConnectCancelledError) {
				try {
					await transport.disconnect()
				} catch (e2) {}
				return null
			}
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
		if (inFlight.get(key) === task) {
			inFlight.delete(key)
		}
	}
}
