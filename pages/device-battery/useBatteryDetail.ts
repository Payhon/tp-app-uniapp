import { ref, shallowRef } from 'vue'

import $C from '@/common/config'
import {
	appBatteryDetail,
	appBatteryConnectionStatus,
	appBatteryMqttCredential,
	appBatteryReport,
	type AppBatteryDetail,
	type AppBatteryConnectionStatusReq,
	type AppBatteryReportReq,
} from '@/service/app-battery'
import {
	BmsClient,
	createUniMqttSocketBmsTransport,
	createUniMqttWsBmsTransport,
	type UniMqttSocketBmsTransport,
	type UniMqttWsBmsTransport,
} from '@/common/lib/bms-protocol'
import {
	canBleAutoConnect,
	connectBleClient,
	disconnectBleClient,
	getBleClientEntry,
	invalidateBleConnectAttempts,
	releaseBleClient,
	retainBleClient,
} from '@/common/ble/ble-client-cache'
import { normalizeMac } from '@/common/device-provision/ble'
import type { DeviceDetailHandoff } from '@/common/device-provision/detail-handoff'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'

type ConnType = 'bluetooth' | 'mqtt' | 'offline'
type DeviceDetailSessionMode = 'cloud' | 'instrument'
type LoadInstrumentSessionOptions = {
	bleMac: string
	deviceName?: string
}

type ConnectAutoOptions = {
	preserveCurrentBle?: boolean
	probe?: boolean
}

type LoadByIdOptions = {
	handoff?: DeviceDetailHandoff | null
	preferWarmBle?: boolean
}

type MqttTransportLike = UniMqttWsBmsTransport | UniMqttSocketBmsTransport

const BLE_MAX_READ_REGS = 60
const SNAPSHOT_REPORT_INTERVAL_MS = 30_000
const REPORT_QUEUE_MAX = 100
const REPORT_RETRY_DELAYS_MS = [3_000, 10_000, 30_000]
const RELAY_HEARTBEAT_MS = 15_000
const RELAY_RECONNECT_DELAY_MS = 3_000
const POLL_INTERVAL_MS = 2_000
const INSTRUMENT_WARMUP_POLL_INTERVAL_MS = 1_200

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

const countTrue = (obj?: Record<string, boolean>) => {
	if (!obj) return 0
	let n = 0
	for (const v of Object.values(obj)) {
		if (v) n += 1
	}
	return n
}

const stableBoolMap = (obj?: Record<string, boolean>) => {
	if (!obj) return ''
	return Object.keys(obj)
		.sort()
		.map((k) => `${k}:${obj[k] ? 1 : 0}`)
		.join('|')
}

const buildCoreReport = (s: BmsStatus): Record<string, unknown> => {
	const indicator = s.status?.indicatorStatus || {}
	const protection = s.status?.protectionStatus || {}
	const failure = s.status?.failureStatus || {}
	const alarm = s.status?.alarmStatus || {}
	const balancing = Array.isArray(s.cell?.balancing) ? s.cell.balancing : []

	const faultCount = countTrue(protection) + countTrue(failure)

	return {
		soc: s.energy?.socPct,
		soh: s.energy?.sohPct,
		packCellSumVoltageV: s.electrical?.packCellSumVoltageV,
		vPackV: s.electrical?.vPackV,
		currentA: s.electrical?.currentA,
		avgCellVoltageMv: s.electrical?.avgCellVoltageMv,
		highestCellVoltageMv: s.electrical?.highestCellVoltageMv,
		lowestCellVoltageMv: s.electrical?.lowestCellVoltageMv,
		maxCellVoltageDiffMv: s.electrical?.maxCellVoltageDiffMv,
		chargeMosC: s.temperature?.chargeMosC,
		dischargeMosC: s.temperature?.dischargeMosC,
		ambientC: s.temperature?.ambientC,
		cycleCount: s.energy?.cycleCount,
		chargeRemainingMin: s.timing?.chargeRemainingMin,
		dischargeRemainingMin: s.timing?.dischargeRemainingMin,
		chargeFetOn: !!indicator.chargeFetOn,
		dischargeFetOn: !!indicator.dischargeFetOn,
		charging: !!indicator.charging,
		discharging: !!indicator.discharging,
		balancingOn: balancing.some(Boolean),
		protectOn: countTrue(protection) > 0,
		alarmCount: countTrue(alarm),
		protectCount: countTrue(protection),
		faultCount,
		seriesCount: s.meta?.seriesCount,
	}
}

const buildStateFingerprint = (s: BmsStatus): string => {
	return [
		stableBoolMap(s.status?.alarmStatus),
		stableBoolMap(s.status?.protectionStatus),
		stableBoolMap(s.status?.failureStatus),
		stableBoolMap(s.status?.indicatorStatus),
	].join('||')
}

const getReportPlatform = () => {
	try {
		const info = uni.getSystemInfoSync() as any
		const uniPlatform = String(info?.uniPlatform || '').toLowerCase()
		if (uniPlatform.includes('mp-weixin')) return 'wxmp'
		const hostName = String(info?.hostName || '').toLowerCase()
		if (hostName.includes('wechat')) return 'wxmp'
		const platform = String(info?.platform || '').toLowerCase()
		if (platform === 'ios') return 'ios_app'
		if (platform === 'android') return 'android_app'
		if (platform) return platform
	} catch (e) {}
	return 'unknown'
}

const isWeChatMiniProgram = () => getReportPlatform() === 'wxmp'

const buildSocketBridgeWsUrl = () => {
	const base = String($C.apiBaseUrl || '')
		.trim()
		.replace(/\/+$/, '')
	if (!base) return ''
	if (base.startsWith('https://')) return `wss://${base.slice('https://'.length)}/api/v1/app/battery/socket/ws`
	if (base.startsWith('http://')) return `ws://${base.slice('http://'.length)}/api/v1/app/battery/socket/ws`
	if (base.startsWith('wss://') || base.startsWith('ws://')) return `${base}/api/v1/app/battery/socket/ws`
	return `wss://${base}/api/v1/app/battery/socket/ws`
}

const buildRelayWsUrl = () => {
	const base = String($C.apiBaseUrl || '')
		.trim()
		.replace(/\/+$/, '')
	if (!base) return ''
	if (base.startsWith('https://')) return `wss://${base.slice('https://'.length)}/api/v1/app/battery/relay/ws`
	if (base.startsWith('http://')) return `ws://${base.slice('http://'.length)}/api/v1/app/battery/relay/ws`
	if (base.startsWith('wss://') || base.startsWith('ws://')) return `${base}/api/v1/app/battery/relay/ws`
	return `wss://${base}/api/v1/app/battery/relay/ws`
}

const getAccessToken = () => {
	return String(uni.getStorageSync('access_token') || '').trim()
}

const socketMessageToText = (data: unknown): string => {
	if (typeof data === 'string') return data
	if (data instanceof ArrayBuffer) {
		try {
			// eslint-disable-next-line no-undef
			return String.fromCharCode(...new Uint8Array(data))
		} catch (e) {
			return ''
		}
	}
	try {
		return JSON.stringify(data)
	} catch (e) {
		return ''
	}
}

export const useBatteryDetail = () => {
	const deviceId = ref('')
	const battery = ref<AppBatteryDetail | null>(null)
	const status = ref<BmsStatus | null>(null)
	const client = shallowRef<BmsClient | null>(null)
	const connType = ref<ConnType>('offline')
	const connecting = ref(false)
	const pollingPaused = ref(false)
	const sessionMode = ref<DeviceDetailSessionMode>('cloud')

	let pollTimer: number | null = null
	let mqttTransport: MqttTransportLike | null = null
	let bleCacheKey: string | null = null
	let pollErrLogged = 0
	let lastStatusLogAt = 0
	let relaySocketTask: any = null
	let relaySocketOpen = false
	let relayHeartbeatTimer: number | null = null
	let relayReconnectTimer: number | null = null
	let relayClosing = false

	let reportQueue: AppBatteryReportReq[] = []
	let reportFlushing = false
	let reportRetryTimer: number | null = null
	let reportRetryStep = 0
	let lastSnapshotReportAt = 0
	let lastStateFingerprint = ''

	const stopPolling = () => {
		if (pollTimer != null) {
			clearInterval(pollTimer)
			pollTimer = null
		}
	}

	const clearReportRetryTimer = () => {
		if (reportRetryTimer != null) {
			clearTimeout(reportRetryTimer)
			reportRetryTimer = null
		}
	}

	const resetReportState = ({ clearQueue }: { clearQueue: boolean }) => {
		clearReportRetryTimer()
		reportRetryStep = 0
		lastSnapshotReportAt = 0
		lastStateFingerprint = ''
		if (clearQueue) {
			reportQueue = []
		}
	}

	const canFlushReportQueue = () => {
		return connType.value === 'bluetooth' && !!deviceId.value
	}

	const isInstrumentSession = () => sessionMode.value === 'instrument'

	const hasCurrentBleTarget = (mac: unknown) => {
		const normalizedMac = normalizeMac(String(mac || ''))
		return !!normalizedMac && connType.value === 'bluetooth' && bleCacheKey === normalizedMac && !!client.value
	}

	const hasConnectTarget = () => {
		if (isInstrumentSession()) {
			return Boolean(String(battery.value?.ble_mac || '').trim())
		}
		return Boolean(deviceId.value)
	}

	const scheduleReportRetry = (delayMs: number) => {
		clearReportRetryTimer()
		reportRetryTimer = setTimeout(() => {
			reportRetryTimer = null
			void flushReportQueue()
		}, delayMs) as unknown as number
	}

	const flushReportQueue = async () => {
		if (reportFlushing || reportRetryTimer != null) return
		if (!canFlushReportQueue()) return
		reportFlushing = true
		try {
			while (reportQueue.length > 0) {
				if (!canFlushReportQueue()) break
				const head = reportQueue[0]
				try {
					const rsp = await appBatteryReport(head)
					if (!rsp || (rsp as any).code !== 200) {
						throw new Error((rsp as any)?.message || 'report failed')
					}
					reportQueue.shift()
					reportRetryStep = 0
				} catch (e) {
					const delay = REPORT_RETRY_DELAYS_MS[Math.min(reportRetryStep, REPORT_RETRY_DELAYS_MS.length - 1)]
					reportRetryStep += 1
					log('app report failed, will retry', {
						err: formatErr(e),
						delay_ms: delay,
						queue_size: reportQueue.length,
					})
					scheduleReportRetry(delay)
					break
				}
			}
		} finally {
			reportFlushing = false
		}
	}

	const enqueueReport = (item: AppBatteryReportReq) => {
		if (reportQueue.length >= REPORT_QUEUE_MAX) {
			reportQueue.shift()
			log('app report queue full, dropped oldest', { max: REPORT_QUEUE_MAX })
		}
		reportQueue.push(item)
		void flushReportQueue()
	}

	const tryReportStatus = (s: BmsStatus) => {
		if (connType.value !== 'bluetooth') return
		if (!deviceId.value) return
		const ts = Date.now()
		const stateFingerprint = buildStateFingerprint(s)
		const shouldSendSnapshot =
			lastSnapshotReportAt === 0 ||
			ts - lastSnapshotReportAt >= SNAPSHOT_REPORT_INTERVAL_MS ||
			(lastStateFingerprint !== '' && stateFingerprint !== lastStateFingerprint)

		const payload: AppBatteryReportReq = {
			device_id: deviceId.value,
			ts,
			conn_type: connType.value,
			platform: getReportPlatform(),
			core: buildCoreReport(s),
		}

		if (shouldSendSnapshot) {
			payload.snapshot = s as unknown as Record<string, unknown>
			lastSnapshotReportAt = ts
		}
		lastStateFingerprint = stateFingerprint
		enqueueReport(payload)
	}

	const reportConnectionStatus = async (bleConnected: boolean, connTypeOverride: ConnType | string = connType.value) => {
		if (!deviceId.value) return
		const payload: AppBatteryConnectionStatusReq = {
			device_id: deviceId.value,
			conn_type: String(connTypeOverride || connType.value || 'offline'),
			platform: getReportPlatform(),
			ble_connected: bleConnected,
			ts: Date.now(),
		}
		try {
			const rsp = await appBatteryConnectionStatus(payload)
			if (!rsp || (rsp as any).code !== 200) {
				throw new Error((rsp as any)?.message || 'connection status report failed')
			}
		} catch (e) {
			log('connection status report failed', {
				err: formatErr(e),
				ble_connected: bleConnected,
				conn_type: payload.conn_type,
			})
		}
	}

	const clearRelayHeartbeatTimer = () => {
		if (relayHeartbeatTimer != null) {
			clearInterval(relayHeartbeatTimer)
			relayHeartbeatTimer = null
		}
	}

	const clearRelayReconnectTimer = () => {
		if (relayReconnectTimer != null) {
			clearTimeout(relayReconnectTimer)
			relayReconnectTimer = null
		}
	}

	const sendRelayMessage = (payload: Record<string, unknown> | string) => {
		if (!relaySocketTask || !relaySocketOpen) return
		try {
			const data = typeof payload === 'string' ? payload : JSON.stringify(payload)
			relaySocketTask.send({
				data,
				fail: () => {},
			})
		} catch (e) {}
	}

	const sendRelayHeartbeat = () => {
		sendRelayMessage({
			type: 'relay_heartbeat',
			ble_connected: connType.value === 'bluetooth',
			ts: Date.now(),
		})
	}

	const closeRelaySocket = () => {
		clearRelayHeartbeatTimer()
		clearRelayReconnectTimer()
		relaySocketOpen = false
		if (relaySocketTask) {
			relayClosing = true
			try {
				relaySocketTask.close({})
			} catch (e) {}
			relaySocketTask = null
		}
	}

	const scheduleRelayReconnect = () => {
		if (relayReconnectTimer != null) return
		if (connType.value !== 'bluetooth' || !deviceId.value) return
		relayReconnectTimer = setTimeout(() => {
			relayReconnectTimer = null
			void connectRelaySocket()
		}, RELAY_RECONNECT_DELAY_MS) as unknown as number
	}

	const executeRelayCommand = async (payload: Record<string, any>) => {
		const cmdId = String(payload?.cmd_id || '').trim()
		if (!cmdId) return
		if (!client.value || connType.value !== 'bluetooth') {
			sendRelayMessage({
				type: 'relay_result',
				cmd_id: cmdId,
				ok: false,
				error: 'bluetooth_not_connected',
				ts: Date.now(),
			})
			return
		}

		try {
			const commandType = String(payload?.command_type || '').trim().toLowerCase()
			let result: Record<string, unknown> = {}
			if (commandType === 'read_param') {
				const paramKey = String(payload?.param_key || '').trim()
				if (!paramKey) throw new Error('param_key is required')
				const value = await client.value.readParam(paramKey)
				result = { value }
			} else if (commandType === 'write_param') {
				const paramKey = String(payload?.param_key || '').trim()
				if (!paramKey) throw new Error('param_key is required')
				await client.value.writeParam(paramKey, payload?.value)
				let value: unknown = null
				try {
					value = await client.value.readParam(paramKey)
				} catch (e) {}
				result = { value }
			} else if (commandType === 'write_registers') {
				const startAddress = Number(payload?.start_address)
				const values = Array.isArray(payload?.register_values) ? payload.register_values : []
				if (!Number.isFinite(startAddress) || startAddress < 0) throw new Error('start_address invalid')
				if (!values.length) throw new Error('register_values is required')
				const regs = new Uint16Array(values.map((v: any) => Number(v) & 0xffff))
				await client.value.writeRegisters(Number(startAddress), regs)
				result = { written: true }
			} else {
				throw new Error(`unsupported command_type: ${commandType}`)
			}
			sendRelayMessage({
				type: 'relay_result',
				cmd_id: cmdId,
				ok: true,
				result,
				ts: Date.now(),
			})
		} catch (e) {
			sendRelayMessage({
				type: 'relay_result',
				cmd_id: cmdId,
				ok: false,
				error: formatErr(e) || 'relay_command_failed',
				ts: Date.now(),
			})
		}
	}

	const connectRelaySocket = async () => {
		if (connType.value !== 'bluetooth' || !deviceId.value) return
		if (relaySocketTask) return
		const wsUrl = buildRelayWsUrl()
		const token = getAccessToken()
		if (!wsUrl || !token) return
		try {
			const task = uni.connectSocket({
				url: wsUrl,
				success: () => {},
				fail: () => {},
			})
			relaySocketTask = task
			task.onOpen(() => {
				relaySocketOpen = true
				sendRelayMessage({
					device_id: deviceId.value,
					token,
					platform: getReportPlatform(),
					conn_type: 'bluetooth',
					ble_connected: true,
				})
				clearRelayHeartbeatTimer()
				relayHeartbeatTimer = setInterval(() => {
					sendRelayHeartbeat()
				}, RELAY_HEARTBEAT_MS) as unknown as number
			})
			task.onMessage((res: { data: unknown }) => {
				const txt = socketMessageToText(res?.data).trim()
				if (!txt || txt === 'pong') return
				try {
					const payload = JSON.parse(txt) as Record<string, unknown>
					const type = String(payload?.type || '').trim().toLowerCase()
					if (type === 'relay_ready') {
						sendRelayHeartbeat()
						return
					}
					if (type === 'relay_command') {
						void executeRelayCommand(payload)
					}
				} catch (e) {
					// ignore non-json messages
				}
			})
			task.onError(() => {
				relaySocketOpen = false
			})
			task.onClose(() => {
				relaySocketOpen = false
				clearRelayHeartbeatTimer()
				relaySocketTask = null
				if (relayClosing) {
					relayClosing = false
					return
				}
				scheduleRelayReconnect()
			})
		} catch (e) {
			log('relay socket connect failed', { err: formatErr(e) })
			relaySocketTask = null
			relaySocketOpen = false
			scheduleRelayReconnect()
		}
	}

	const attachBleEntry = (entry: ReturnType<typeof getBleClientEntry>, options?: { retain?: boolean }) => {
		if (!entry) return false
		if (bleCacheKey && bleCacheKey !== entry.key) {
			releaseBleClient(bleCacheKey)
		}
		if (options?.retain !== false && bleCacheKey !== entry.key) {
			retainBleClient(entry.key)
		}
		bleCacheKey = entry.key
		client.value = entry.client
		connType.value = 'bluetooth'
		connecting.value = false
		startPolling(entry.client)
		if (!isInstrumentSession()) {
			void reportConnectionStatus(true, 'bluetooth')
			void flushReportQueue()
			void connectRelaySocket()
		}
		return true
	}

	const attachWarmBleFromBattery = (reason: string) => {
		const decision = canBleAutoConnect(battery.value?.bms_comm_type, battery.value?.ble_mac)
		if (!decision.ok || !decision.mac) return false
		const entry = getBleClientEntry(decision.mac, { touch: true })
		if (!entry) return false
		log('load battery detail reuse warm ble', {
			reason,
			deviceId: deviceId.value,
			ble_mac: decision.mac,
			cached_device_id: entry.deviceId,
		})
		return attachBleEntry(entry, { retain: true })
	}

	const startPolling = (c: BmsClient) => {
		stopPolling()
		if (pollingPaused.value) return
		const run = async () => {
			try {
				status.value = await c.readAllStatus()
				if (status.value) {
					tryReportStatus(status.value)
				}
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
		const scheduleNext = (delayMs: number) => {
			if (pollingPaused.value || client.value !== c) return
			pollTimer = setTimeout(async () => {
				pollTimer = null
				if (pollingPaused.value || client.value !== c) return
				await run()
				const nextDelay = isInstrumentSession() && !status.value ? INSTRUMENT_WARMUP_POLL_INTERVAL_MS : POLL_INTERVAL_MS
				scheduleNext(nextDelay)
			}, delayMs) as unknown as number
		}
		void run().finally(() => {
			const nextDelay = isInstrumentSession() && !status.value ? INSTRUMENT_WARMUP_POLL_INTERVAL_MS : POLL_INTERVAL_MS
			scheduleNext(nextDelay)
		})
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
		invalidateBleConnectAttempts('device-detail disconnectAll')
		const wasBluetooth = connType.value === 'bluetooth'
		if (wasBluetooth && !isInstrumentSession()) {
			void reportConnectionStatus(false, 'bluetooth')
		}
		stopPolling()
		closeRelaySocket()
		client.value = null
		status.value = null
		connType.value = 'offline'
		clearReportRetryTimer()
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

	const disconnectBluetooth = async () => {
		if (connType.value !== 'bluetooth') return false
		const bleKey = bleCacheKey || String(battery.value?.ble_mac || '').trim()
		await disconnectAll()
		resetReportState({ clearQueue: true })
		if (!bleKey) return false
		return disconnectBleClient(bleKey)
	}

	const connectBleFirst = async (options?: ConnectAutoOptions): Promise<boolean> => {
		const decision = canBleAutoConnect(battery.value?.bms_comm_type, battery.value?.ble_mac)
		if (!decision.ok || !decision.mac) return false
		if (options?.preserveCurrentBle && hasCurrentBleTarget(decision.mac)) {
			if (client.value) startPolling(client.value)
			return true
		}
		try {
			closeRelaySocket()
			const entry = await connectBleClient({
				mac: decision.mac,
				maxReadRegisters: BLE_MAX_READ_REGS,
				force: !options?.preserveCurrentBle,
				probe: options?.probe !== false,
			})
			if (!entry) return false
			return attachBleEntry(entry, { retain: true })
		} catch (e) {
			log('ble connect failed', { err: e instanceof Error ? e.message : String(e || '') })
			return false
		}
	}

	const connectMqttWs = async (): Promise<boolean> => {
		try {
			closeRelaySocket()
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
			await c.readUuid()
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

	const connectSocketBridge = async (): Promise<boolean> => {
		try {
			closeRelaySocket()
			const wsUrl = buildSocketBridgeWsUrl()
			const token = getAccessToken()
			if (!wsUrl) throw new Error('socket bridge ws url not configured')
			if (!token) throw new Error('token missing')
			log('socket bridge connect start', { wsUrl, deviceId: deviceId.value })
			mqttTransport = createUniMqttSocketBmsTransport({
				wsUrl,
				deviceId: deviceId.value,
				token,
				logger: console as any,
			})
			await mqttTransport.connect()
			const c = new BmsClient({ transport: mqttTransport })
			await c.readUuid()
			client.value = c
			connType.value = 'mqtt'
			startPolling(c)
			log('socket bridge connect ok', { wsUrl })
			return true
		} catch (e) {
			log('socket bridge connect failed', { err: e instanceof Error ? e.message : String(e || '') })
			try {
				await mqttTransport?.disconnect()
			} catch (e2) {}
			mqttTransport = null
			return false
		}
	}

	const connectAuto = async (options?: ConnectAutoOptions) => {
		if (!hasConnectTarget() || connecting.value) return
		connecting.value = true
		try {
			if (options?.preserveCurrentBle && attachWarmBleFromBattery('connect-auto')) return
			if (!options?.preserveCurrentBle) {
				await disconnectAll()
			}
			if (isInstrumentSession()) {
				log('connectAuto instrument session', {
					ble_mac: battery.value?.ble_mac ?? null,
					device_name: battery.value?.device_name ?? null,
				})
				if (await connectBleFirst(options)) return
				connType.value = 'offline'
				return
			}
			const commType = Number(battery.value?.bms_comm_type || 0)
			const bleDecision = canBleAutoConnect(battery.value?.bms_comm_type, battery.value?.ble_mac)
			const treatBleOnly = commType === 1
			const useSocketBridge = isWeChatMiniProgram()
			log('connectAuto', {
				deviceId: deviceId.value,
				bms_comm_type: battery.value?.bms_comm_type ?? null,
				ble_mac: battery.value?.ble_mac ?? null,
				comm_chip_id: battery.value?.comm_chip_id ?? null,
				use_socket_bridge: useSocketBridge,
			})
			if (treatBleOnly) {
				log('connectAuto choose BLE-only')
				if (bleDecision.ok && (await connectBleFirst(options))) return
				connType.value = 'offline'
				return
			}
			if (bleDecision.ok && (await connectBleFirst(options))) return
			log('connectAuto BLE not available, try remote transport')
			if (useSocketBridge) {
				if (await connectSocketBridge()) return
			} else {
				if (await connectMqttWs()) return
			}
			connType.value = 'offline'
		} finally {
			connecting.value = false
		}
	}

	const refreshCloudBatteryDetail = async (nextId: string) => {
		log('load battery detail start', { deviceId: nextId })
		const rsp = await appBatteryDetail(nextId)
		if (rsp && (rsp as any).code === 200) {
			const nextBattery = (rsp as any).data as AppBatteryDetail
			battery.value = battery.value ? ({ ...battery.value, ...nextBattery } as AppBatteryDetail) : nextBattery
			log('load battery detail ok', {
				device_number: (battery.value as any)?.device_number,
				bms_comm_type: (battery.value as any)?.bms_comm_type,
				ble_mac: (battery.value as any)?.ble_mac,
				comm_chip_id: (battery.value as any)?.comm_chip_id,
				is_online: (battery.value as any)?.is_online,
			})
			return true
		}
		log('load battery detail failed', { rsp })
		return false
	}

	const loadById = async (id: string, options?: LoadByIdOptions) => {
		const nextId = String(id || '').trim()
		if (!nextId) return
		if (nextId !== deviceId.value || sessionMode.value !== 'cloud') {
			resetReportState({ clearQueue: true })
		}
		sessionMode.value = 'cloud'
		deviceId.value = nextId
		status.value = null
		const handoff =
			options?.handoff && String(options.handoff.deviceId || '').trim() === nextId ? options.handoff : null
		if (handoff) {
			battery.value = {
				device_id: nextId,
				device_number: handoff.bleMac,
				device_name: handoff.deviceName || null,
				bms_comm_type: handoff.bmsCommType ?? 1,
				ble_mac: handoff.bleMac,
				item_uuid: handoff.itemUuid || null,
				comm_chip_id: null,
			} as AppBatteryDetail
			const warmEntry = getBleClientEntry(handoff.bleMac, { touch: true })
			if (warmEntry) {
				log('load battery detail use warm ble', { deviceId: nextId, ble_mac: handoff.bleMac })
				attachBleEntry(warmEntry, { retain: true })
			} else if (options?.preferWarmBle !== false) {
				log('load battery detail warm ble missing, reconnect', { deviceId: nextId, ble_mac: handoff.bleMac })
				void connectAuto({ preserveCurrentBle: false, probe: true })
			}
			void refreshCloudBatteryDetail(nextId)
			return
		}
		const ok = await refreshCloudBatteryDetail(nextId)
		if (!ok) return
		if (options?.preferWarmBle !== false && attachWarmBleFromBattery('cloud-detail')) return
		void connectAuto({ preserveCurrentBle: options?.preferWarmBle !== false })
	}

	const loadInstrumentSession = ({ bleMac, deviceName }: LoadInstrumentSessionOptions) => {
		const normalizedMac = normalizeMac(bleMac)
		if (!normalizedMac) return
		resetReportState({ clearQueue: true })
		sessionMode.value = 'instrument'
		deviceId.value = ''
		status.value = null
		battery.value = {
			device_id: '',
			device_number: normalizedMac,
			device_name: String(deviceName || '').trim() || `Meter ${normalizedMac.slice(-4)}`,
			bms_comm_type: 1,
			ble_mac: normalizedMac,
			item_uuid: null,
			comm_chip_id: null,
		} as AppBatteryDetail
		log('load instrument session', {
			ble_mac: normalizedMac,
			device_name: battery.value.device_name ?? null,
		})
		void connectAuto()
	}

	return {
		deviceId,
		battery,
		status,
		client,
		connType,
		connecting,
		sessionMode,
		pausePolling,
		resumePolling,
		loadById,
		loadInstrumentSession,
		disconnectAll,
		disconnectBluetooth,
	}
}
