import { ref, shallowRef } from 'vue'

import { appBatteryDetail, appBatteryMqttCredential, type AppBatteryDetail } from '@/service/app-battery'
import { BmsClient, createUniMqttWsBmsTransport, type UniMqttWsBmsTransport } from '@/common/lib/bms-protocol'
import { canBleAutoConnect, connectBleClient, releaseBleClient, retainBleClient } from '@/common/ble/ble-client-cache'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'

type ConnType = 'bluetooth' | 'mqtt' | 'offline'


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
	let mqttTransport: UniMqttWsBmsTransport | null = null
	let bleCacheKey: string | null = null
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
						console.log('[device-detail] status obj', status.value)
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
		if (bleCacheKey) {
			releaseBleClient(bleCacheKey)
			bleCacheKey = null
		}
		try {
			await mqttTransport?.disconnect()
		} catch (e) {}
		mqttTransport = null
		log('disconnectAll done')
	}

	const connectBleFirst = async (): Promise<boolean> => {
		const decision = canBleAutoConnect(battery.value?.bms_comm_type, battery.value?.ble_mac)
		if (!decision.ok || !decision.mac) return false
		try {
			const entry = await connectBleClient({ mac: decision.mac, maxReadRegisters: BLE_MAX_READ_REGS, probe: true })
			if (!entry) return false
			bleCacheKey = entry.key
			retainBleClient(entry.key)
			client.value = entry.client
			connType.value = 'bluetooth'
			startPolling(entry.client)
			return true
		} catch (e) {
			log('ble connect failed', { err: e instanceof Error ? e.message : String(e || '') })
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
			const bleDecision = canBleAutoConnect(battery.value?.bms_comm_type, battery.value?.ble_mac)
			const treatBleOnly = commType === 1
			log('connectAuto', {
				deviceId: deviceId.value,
				bms_comm_type: battery.value?.bms_comm_type ?? null,
				ble_mac: battery.value?.ble_mac ?? null,
				comm_chip_id: battery.value?.comm_chip_id ?? null,
			})
			if (treatBleOnly) {
				log('connectAuto choose BLE-only')
				if (bleDecision.ok && (await connectBleFirst())) return
				connType.value = 'offline'
				return
			}
			if (bleDecision.ok && (await connectBleFirst())) return
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
