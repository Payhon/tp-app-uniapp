import { ref, shallowRef } from 'vue'

import { appBatteryDetail, appBatteryMqttCredential, type AppBatteryDetail } from '@/service/app-battery'
import { BmsClient, createUniBleBmsTransport, createUniMqttWsBmsTransport, type UniBleBmsTransport, type UniMqttWsBmsTransport } from '@/common/lib/bms-protocol'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'
import { parseMacFromAdvertisement } from '@/common/device-provision/ble'

type ConnType = 'bluetooth' | 'mqtt' | 'offline'

type FoundBleDevice = {
	deviceId: string
	name?: string
	localName?: string
	RSSI?: number
	advertisData?: ArrayBuffer
	advertisingData?: ArrayBuffer
}

const normalizeMac = (s: unknown) =>
	String(s || '')
		.trim()
		.toUpperCase()
		.replace(/[^0-9A-F]/g, '')

const extractMacHex = (s: unknown) => {
	const hex = normalizeMac(s)
	if (hex.length === 12) return hex
	const raw = String(s || '').toUpperCase()
	const m = raw.match(/[0-9A-F]{12}/g)
	if (m && m.length) return m[m.length - 1]
	return ''
}

const mac12ToColon = (mac12: string) => {
	const hex = normalizeMac(mac12)
	if (hex.length !== 12) return String(mac12 || '')
	const parts: string[] = []
	for (let i = 0; i < 12; i += 2) parts.push(hex.slice(i, i + 2))
	return parts.join(':')
}

const bytesToHexUpper = (ab: ArrayBuffer | Uint8Array | null | undefined): string => {
	if (!ab) return ''
	const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab)
	let out = ''
	for (let i = 0; i < u8.length; i += 1) out += (u8[i] & 0xff).toString(16).padStart(2, '0')
	return out.toUpperCase()
}

const log = (event: string, data?: Record<string, unknown>) => {
	try {
		const ts = new Date().toISOString().slice(11, 23)
		console.log(`[device-detail ${ts}] ${event}`, data || {})
	} catch (e) {}
}

const formatErr = (err: unknown) => {
	if (!err) return ''
	if (err instanceof Error) return err.message || String(err)
	if (typeof err === 'string') return err
	try {
		return JSON.stringify(err)
	} catch (e) {
		return String(err)
	}
}

const BLE_MAX_READ_REGS = 60

export const useBatteryDetail = () => {
	const deviceId = ref('')
	const battery = ref<AppBatteryDetail | null>(null)
	const status = ref<BmsStatus | null>(null)
	const client = shallowRef<BmsClient | null>(null)
	const connType = ref<ConnType>('offline')
	const connecting = ref(false)
	const pollingPaused = ref(false)

	let pollTimer: number | null = null
	let bleTransport: UniBleBmsTransport | null = null
	let mqttTransport: UniMqttWsBmsTransport | null = null
	let pollErrLogged = 0
	let lastStatusLogAt = 0

	const stopPolling = () => {
		if (pollTimer != null) {
			clearInterval(pollTimer)
			pollTimer = null
		}
	}

	const startPolling = (c: BmsClient) => {
		stopPolling()
		if (pollingPaused.value) return
		const run = async () => {
			try {
				status.value = await c.readAllStatus()
				try {
					const now = Date.now()
					if (now - lastStatusLogAt > 3000) {
						lastStatusLogAt = now
						const debugFull = !!uni.getStorageSync('debugStatusJson')
						if (debugFull) {
							console.log('[device-detail] status json', status.value)
						} else {
							console.log('[device-detail] status identity', status.value?.identity || null)
						}
					}
				} catch (e) {}
				pollErrLogged = 0
			} catch (e) {
				if (pollErrLogged < 3) {
					pollErrLogged += 1
					log('poll failed', { err: formatErr(e) })
				}
			}
		}
		run()
		pollTimer = setInterval(run, 5000) as unknown as number
	}

	const pausePolling = () => {
		pollingPaused.value = true
		stopPolling()
	}

	const resumePolling = () => {
		pollingPaused.value = false
		if (client.value) startPolling(client.value)
	}

	const disconnectAll = async () => {
		stopPolling()
		client.value = null
		connType.value = 'offline'
		try {
			await bleTransport?.disconnect()
		} catch (e) {}
		try {
			await mqttTransport?.disconnect()
		} catch (e) {}
		bleTransport = null
		mqttTransport = null
		log('disconnectAll done')
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

	const connectBleFirst = async (): Promise<boolean> => {
		const targetMac = normalizeMac(battery.value?.ble_mac)
		if (!targetMac) return false

		try {
			const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : ({} as any)
			const platform = String((sys as any)?.platform || '').toLowerCase()
			const isAndroid = platform === 'android'
			log('ble target', { targetMac, targetMacColon: mac12ToColon(targetMac), platform })

			log('ble discover start', { targetMac })
			bleTransport = createUniBleBmsTransport({})

			if (isAndroid) {
				const directCandidates = [
					mac12ToColon(targetMac),
					mac12ToColon(targetMac).toLowerCase(),
					targetMac,
					targetMac.toLowerCase(),
				].filter(Boolean)
				for (const cand of directCandidates) {
					try {
						log('ble direct connect try', { deviceId: cand })
						await bleTransport.connect({ deviceId: cand })
						const c = new BmsClient({ transport: bleTransport, maxReadRegisters: BLE_MAX_READ_REGS })
						client.value = c
						connType.value = 'bluetooth'
						startPolling(c)
						log('ble direct connect ok', { deviceId: cand })
						return true
					} catch (e) {
						log('ble direct connect failed', { deviceId: cand, err: e instanceof Error ? e.message : String(e || '') })
						try {
							await bleTransport.disconnect()
						} catch (e2) {}
					}
				}
			}

			const list = await discoverWithAdv({ durationMs: 5000 })
			log('ble discover done', { found: Array.isArray(list) ? list.length : 0 })
			if (Array.isArray(list) && list.length) {
				const sample = list.slice(0, 30)
				for (const d of sample) {
					const adv = (d as any).advertisData || (d as any).advertisingData || null
					const advHex = bytesToHexUpper(adv)
					const parsedMac = parseMacFromAdvertisement(adv) || ''
					const idHex = extractMacHex(d?.deviceId)
					const nameHex = extractMacHex(d?.name || d?.localName)
					log('ble device', {
						deviceId: d.deviceId,
						name: d.name || d.localName || '',
						rssi: d.RSSI ?? null,
						advHexHead: advHex ? advHex.slice(0, 64) : '',
						advHexLen: advHex ? advHex.length / 2 : 0,
						parsedMac,
						idHex,
						nameHex,
						match: parsedMac === targetMac || idHex === targetMac || nameHex === targetMac,
					})
				}
				if (list.length > sample.length) {
					log('ble device list truncated', { shown: sample.length, total: list.length })
				}
			}

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
			const hit = candidates[0]?.d
			if (!hit?.deviceId) return false

			log('ble connect start', { deviceId: hit.deviceId })
			await bleTransport.connect({ deviceId: hit.deviceId })
			const c = new BmsClient({ transport: bleTransport, maxReadRegisters: BLE_MAX_READ_REGS })
			client.value = c
			connType.value = 'bluetooth'
			startPolling(c)
			log('ble connect ok', { deviceId: hit.deviceId })
			return true
		} catch (e) {
			log('ble connect failed', { err: e instanceof Error ? e.message : String(e || '') })
			try {
				await bleTransport?.disconnect()
			} catch (e2) {}
			bleTransport = null
			return false
		}
	}

	const connectMqttSocket = async (): Promise<boolean> => {
		try {
			const rsp = await appBatteryMqttCredential(deviceId.value)
			if (!rsp || (rsp as any).code !== 200) throw new Error('mqtt credential fetch failed')
			const cred = (rsp as any).data || {}
			const wsUrl = String(cred.ws_url || '').trim()
			const username = String(cred.username || '').trim()
			const password = cred.password == null ? '' : String(cred.password)
			const writeTopic = String(cred.write_topic || '').trim()
			const readTopic = String(cred.read_topic || '').trim()
			if (!wsUrl || !username || !writeTopic || !readTopic) throw new Error('mqtt credential invalid')
			const clientId = `app_${String(deviceId.value).slice(0, 8)}_${Date.now()}`
			log('mqtt(ws) connect start', { wsUrl, deviceId: deviceId.value })
			mqttTransport = createUniMqttWsBmsTransport({
				wsUrl,
				clientId,
				username,
				password,
				writeTopic,
				readTopic,
				logger: console as any,
			})
			await mqttTransport.connect()
			const c = new BmsClient({ transport: mqttTransport })
			try {
				await c.readUuid()
			} catch (e) {
				throw e
			}

			client.value = c
			connType.value = 'mqtt'
			startPolling(c)
			log('mqtt(ws) connect ok', { wsUrl })
			return true
		} catch (e) {
			log('mqtt(ws) connect failed', { err: e instanceof Error ? e.message : String(e || '') })
			try {
				await mqttTransport?.disconnect()
			} catch (e2) {}
			mqttTransport = null
			return false
		}
	}

	const connectAuto = async () => {
		if (!deviceId.value || connecting.value) return
		connecting.value = true
		try {
			await disconnectAll()
			const commType = Number(battery.value?.bms_comm_type || 0)
			const chipId = String(battery.value?.comm_chip_id || '').trim()
			const hasBleMac = Boolean(normalizeMac(battery.value?.ble_mac))
			const treatBleOnly = commType === 1 || ((commType === 0 || !Number.isFinite(commType)) && hasBleMac && !chipId)
			log('connectAuto', {
				deviceId: deviceId.value,
				bms_comm_type: battery.value?.bms_comm_type ?? null,
				ble_mac: battery.value?.ble_mac ?? null,
				comm_chip_id: battery.value?.comm_chip_id ?? null,
			})
			if (treatBleOnly) {
				log('connectAuto choose BLE-only')
				if (await connectBleFirst()) return
				connType.value = 'offline'
				return
			}
			if (await connectBleFirst()) return
			log('connectAuto BLE not available, try MQTT socket')
			if (await connectMqttSocket()) return
			connType.value = 'offline'
		} finally {
			connecting.value = false
		}
	}

	const loadById = async (id: string) => {
		deviceId.value = String(id || '').trim()
		if (!deviceId.value) return
		log('load battery detail start', { deviceId: deviceId.value })
		const rsp = await appBatteryDetail(deviceId.value)
		if (rsp && (rsp as any).code === 200) {
			battery.value = (rsp as any).data as AppBatteryDetail
			log('load battery detail ok', {
				device_number: (battery.value as any)?.device_number,
				bms_comm_type: (battery.value as any)?.bms_comm_type,
				ble_mac: (battery.value as any)?.ble_mac,
				comm_chip_id: (battery.value as any)?.comm_chip_id,
				is_online: (battery.value as any)?.is_online,
			})
			connectAuto()
		} else {
			log('load battery detail failed', { rsp })
		}
	}

	return {
		deviceId,
		battery,
		status,
		client,
		connType,
		connecting,
		pausePolling,
		resumePolling,
		loadById,
		disconnectAll,
	}
}
