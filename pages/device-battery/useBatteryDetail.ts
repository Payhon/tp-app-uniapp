import { ref, shallowRef } from 'vue'

import $C from '@/common/config'
import {
	appBatteryDetail,
	appBatteryConnectionStatus,
	appBatteryCurrentTelemetry,
	appBatteryReport,
	type AppBatteryDetail,
	type AppBatteryConnectionStatusReq,
	type AppBatteryCurrentTelemetry,
	type AppBatteryReportReq,
} from '@/service/app-battery'
import { BmsClient } from '@/common/lib/bms-protocol/client'
import {
	createUniMqttSocketBmsTransport,
	isMqttSocketOccupiedError,
	type UniMqttSocketBmsTransport,
} from '@/common/lib/bms-protocol/uni-mqtt-socket-transport'
import {
	canBleAutoConnect,
	connectBleClient,
	disconnectBleClient,
	getBleClientEntry,
	invalidateBleConnectAttempts,
	releaseBleClient,
	retainBleClient,
	type BleClientEntry,
} from '@/common/ble/ble-client-cache'
import { normalizeMac } from '@/common/device-provision/ble'
import type { DeviceDetailHandoff } from '@/common/device-provision/detail-handoff'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'

type ConnType = 'bluetooth' | 'mqtt' | 'offline'
type DataSourceMode = 'realtime' | 'cloud_fallback' | 'offline'
type DeviceDetailSessionMode = 'cloud' | 'instrument'
type LoadInstrumentSessionOptions = {
	bleMac: string
	deviceName?: string
	deviceId?: string
}

type ConnectAutoOptions = {
	preserveCurrentBle?: boolean
	probe?: boolean
	preserveFirstFrameState?: boolean
	preserveStatus?: boolean
}

type LoadByIdOptions = {
	handoff?: DeviceDetailHandoff | null
	preferWarmBle?: boolean
}

type BmsDataLoadPhase = 'idle' | 'reading' | 'slow' | 'retrying' | 'failed'

type MqttTransportLike = UniMqttSocketBmsTransport

const BLE_MAX_READ_REGS = 60
const SNAPSHOT_REPORT_INTERVAL_MS = 30_000
const REPORT_QUEUE_MAX = 100
const REPORT_RETRY_DELAYS_MS = [3_000, 10_000, 30_000]
const RELAY_HEARTBEAT_MS = 15_000
const RELAY_RECONNECT_DELAY_MS = 3_000
const POLL_INTERVAL_MS = 2_000
const CLOUD_POLL_INTERVAL_MS = 5_000
const INSTRUMENT_WARMUP_POLL_INTERVAL_MS = 1_200
const INSTRUMENT_NO_PASSTHROUGH_FAILURE_THRESHOLD = 3
const FIRST_FRAME_SLOW_HINT_MS = 9_000
const FIRST_FRAME_AUTO_RECONNECT_FAILURES = 1
const FIRST_FRAME_MAX_AUTO_RECONNECTS = 2
const FIRST_FRAME_RECONNECT_DELAY_MS = 500
const WARM_BLE_PROBE_TIMEOUT_MS = 3_800

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
	let timer: ReturnType<typeof setTimeout> | null = null
	try {
		return await Promise.race([
			promise,
			new Promise<T>((_, reject) => {
				timer = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs)
			}),
		])
	} finally {
		if (timer != null) clearTimeout(timer)
	}
}

const isInstrumentNoPassthroughError = (err: unknown) => {
	const msg = formatErr(err).toLowerCase()
	if (!msg) return false
	return (
		msg.includes('timeout') ||
		msg.includes('time out') ||
		msg.includes('no response') ||
		msg.includes('request timeout')
	)
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

	const faultCount = countTrue(failure)

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

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
	return !!v && typeof v === 'object' && !Array.isArray(v)
}

const telemetryValue = (payload: AppBatteryCurrentTelemetry | null, keys: string[]) => {
	const current = payload?.current || {}
	for (const key of keys) {
		if (Object.prototype.hasOwnProperty.call(current, key)) return current[key]?.value
	}
	return undefined
}

const toNumberOr = (value: unknown, fallback = 0xffff) => {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	if (typeof value === 'string' && value.trim() !== '') {
		const n = Number(value)
		if (Number.isFinite(n)) return n
	}
	return fallback
}

const toBooleanOr = (value: unknown, fallback = false) => {
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return value !== 0
	if (typeof value === 'string') {
		const text = value.trim().toLowerCase()
		if (text === 'true' || text === '1' || text === 'on') return true
		if (text === 'false' || text === '0' || text === 'off') return false
	}
	return fallback
}

const parseJsonMaybe = (value: unknown): unknown => {
	if (typeof value !== 'string') return value
	const text = value.trim()
	if (!text) return value
	if (!text.startsWith('{') && !text.startsWith('[')) return value
	try {
		return JSON.parse(text)
	} catch (e) {
		return value
	}
}

const toNumberArray = (value: unknown) => {
	const parsed = parseJsonMaybe(value)
	if (!Array.isArray(parsed)) return []
	return parsed.map((item) => toNumberOr(item, Number.NaN)).filter((item) => Number.isFinite(item))
}

const toBooleanArray = (value: unknown) => {
	const parsed = parseJsonMaybe(value)
	if (!Array.isArray(parsed)) return []
	return parsed.map((item) => toBooleanOr(item))
}

const buildStatusFromCloudTelemetry = (
	battery: AppBatteryDetail | null,
	payload: AppBatteryCurrentTelemetry
): BmsStatus | null => {
	if (isPlainObject(payload.snapshot)) return payload.snapshot as unknown as BmsStatus

	const current = payload.current || {}
	if (Object.keys(current).length === 0 && Number(payload.is_online || 0) !== 1) return null

	const seriesCount = toNumberOr(telemetryValue(payload, ['seriesCount', 'meta.seriesCount']), 0)
	const cellVoltagesMv = toNumberArray(telemetryValue(payload, ['cell.voltagesMv', 'cellVoltagesMv']))
	const cellTempsC = toNumberArray(telemetryValue(payload, ['temperature.cellTempsC', 'cellTempsC']))
	const chargeFetOn = toBooleanOr(telemetryValue(payload, ['chargeFetOn']))
	const dischargeFetOn = toBooleanOr(telemetryValue(payload, ['dischargeFetOn']))
	const charging = toBooleanOr(telemetryValue(payload, ['charging']))
	const discharging = toBooleanOr(telemetryValue(payload, ['discharging']))
	const balancing = toBooleanArray(telemetryValue(payload, ['cell.balancing']))
	const highestIdx = toNumberOr(
		telemetryValue(payload, ['electrical.cellVoltageIndex.highest', 'cellVoltageHighestIndex']),
		0
	)
	const lowestIdx = toNumberOr(
		telemetryValue(payload, ['electrical.cellVoltageIndex.lowest', 'cellVoltageLowestIndex']),
		0
	)

	return {
		meta: {
			seriesCount,
			cellTempCount: toNumberOr(telemetryValue(payload, ['meta.cellTempCount']), cellTempsC.length),
			hardwareVersion: 0,
			softwareVersion: 0,
			specialId: 0,
			protocolVersion: 0,
			productionDate: { raw: 0, year: 0, month: 0, day: 0 },
		},
		energy: {
			designCapacityMah: 0xffff,
			remainingCapacityMah: 0xffff,
			fullCapacityMah: 0xffff,
			fullWh: 0xffff,
			remainingWh: 0xffff,
			socPct: toNumberOr(telemetryValue(payload, ['soc']), Number(battery?.soc ?? 0)),
			sohPct: toNumberOr(telemetryValue(payload, ['soh']), Number(battery?.soh ?? 0)),
			cycleCount: toNumberOr(telemetryValue(payload, ['cycleCount']), 0xffff),
			totalChargeCapacityRaw: 0xffff,
			totalDischargeCapacityRaw: 0xffff,
		},
		timing: {
			maxChargeIntervalHours: 0xffff,
			currentChargeIntervalHours: 0xffff,
			dischargeRemainingMin: toNumberOr(telemetryValue(payload, ['dischargeRemainingMin']), 0xffff),
			chargeRemainingMin: toNumberOr(telemetryValue(payload, ['chargeRemainingMin']), 0xffff),
			chargeCount: 0xffff,
			dischargeCount: 0xffff,
			bmsTimestamp: 0,
			powerOnWorkHours: 0xffff,
		},
		electrical: {
			packCellSumVoltageV: toNumberOr(telemetryValue(payload, ['packCellSumVoltageV', 'electrical.packCellSumVoltageV'])),
			vBatV: 0xffff,
			vPackV: toNumberOr(telemetryValue(payload, ['vPackV', 'electrical.vPackV'])),
			vLoadV: 0xffff,
			currentA: toNumberOr(telemetryValue(payload, ['currentA', 'electrical.currentA']), 0),
			highestCellVoltageMv: toNumberOr(telemetryValue(payload, ['highestCellVoltageMv', 'electrical.highestCellVoltageMv'])),
			lowestCellVoltageMv: toNumberOr(telemetryValue(payload, ['lowestCellVoltageMv', 'electrical.lowestCellVoltageMv'])),
			avgCellVoltageMv: toNumberOr(telemetryValue(payload, ['avgCellVoltageMv', 'electrical.avgCellVoltageMv'])),
			maxCellVoltageDiffMv: toNumberOr(telemetryValue(payload, ['maxCellVoltageDiffMv', 'electrical.maxCellVoltageDiffMv']), 0xffff),
			cellVoltageIndex: {
				highest: highestIdx,
				lowest: lowestIdx,
			},
		},
		temperature: {
			chargeMosC: toNumberOr(telemetryValue(payload, ['chargeMosC', 'temperature.chargeMosC']), Number.NaN),
			dischargeMosC: toNumberOr(telemetryValue(payload, ['dischargeMosC', 'temperature.dischargeMosC']), Number.NaN),
			prechargeMosC: null,
			ambientC: toNumberOr(telemetryValue(payload, ['ambientC', 'temperature.ambientC']), Number.NaN),
			heatingFilmC: null,
			poleC: null,
			highestTemp: { index: 0, valueC: null },
			lowestTemp: { index: 0, valueC: null },
			cellTempsC,
		},
		cell: {
			voltagesMv: cellVoltagesMv,
			balancing,
		},
		status: {
			protectionStatus: {},
			failureStatus: {},
			indicatorStatus: {
				chargeFetOn,
				dischargeFetOn,
				charging,
				discharging,
				balancing: toBooleanOr(telemetryValue(payload, ['balancingOn'])) || balancing.some(Boolean),
			},
			alarmStatus: {},
			customStatus: 0,
		},
		identity: {
			hardwareModel: String(battery?.battery_model_name || ''),
			batteryGroupId: '',
			boardCode: '',
			bluetoothMac: String(battery?.ble_mac || '').trim() || null,
		},
		customParams: [],
	}
}

export const useBatteryDetail = () => {
	const deviceId = ref('')
	const battery = ref<AppBatteryDetail | null>(null)
	const status = ref<BmsStatus | null>(null)
	const client = shallowRef<BmsClient | null>(null)
	const connType = ref<ConnType>('offline')
	const dataSourceMode = ref<DataSourceMode>('offline')
	const realtimeOccupied = ref(false)
	const connecting = ref(false)
	const bmsDataLoading = ref(false)
	const bmsDataLoadPhase = ref<BmsDataLoadPhase>('idle')
	const bmsDataLoadAttempts = ref(0)
	const bmsDataLoadLastError = ref('')
	const pollingPaused = ref(false)
	const sessionMode = ref<DeviceDetailSessionMode>('cloud')

	let pollTimer: number | null = null
	let firstFrameSlowTimer: number | null = null
	let cloudPollTimer: number | null = null
	let mqttTransport: MqttTransportLike | null = null
	let bleCacheKey: string | null = null
	let pollErrLogged = 0
	let firstFrameFailCount = 0
	let firstFrameAutoReconnectCount = 0
	let firstFrameRecovering = false
	let requestFirstFrameReconnect: ((sourceClient: BmsClient, reason: string, err?: unknown) => void) | null = null
	let instrumentStatusFailCount = 0
	let instrumentPreferredDeviceId = ''
	const instrumentPassthroughUnavailable = ref(false)
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

	const clearFirstFrameSlowTimer = () => {
		if (firstFrameSlowTimer != null) {
			clearTimeout(firstFrameSlowTimer)
			firstFrameSlowTimer = null
		}
	}

	const resetFirstFrameState = () => {
		clearFirstFrameSlowTimer()
		firstFrameFailCount = 0
		firstFrameAutoReconnectCount = 0
		firstFrameRecovering = false
		bmsDataLoadPhase.value = 'idle'
		bmsDataLoadAttempts.value = 0
		bmsDataLoadLastError.value = ''
	}

	const beginFirstFrameWait = () => {
		if (status.value) return
		if (connType.value !== 'bluetooth' && connType.value !== 'mqtt') return
		if (bmsDataLoadPhase.value !== 'retrying' && bmsDataLoadPhase.value !== 'failed') {
			bmsDataLoadPhase.value = 'reading'
		}
		if (firstFrameSlowTimer != null) return
		firstFrameSlowTimer = setTimeout(() => {
			firstFrameSlowTimer = null
			if (!status.value && (connType.value === 'bluetooth' || connType.value === 'mqtt')) {
				if (bmsDataLoadPhase.value === 'reading') bmsDataLoadPhase.value = 'slow'
			}
		}, FIRST_FRAME_SLOW_HINT_MS) as unknown as number
	}

	const markFirstFrameSuccess = () => {
		if (!status.value) return
		resetFirstFrameState()
	}

	const handleFirstFrameReadFailure = (sourceClient: BmsClient, err: unknown) => {
		if (status.value) return
		if (client.value !== sourceClient) return
		if (connType.value !== 'bluetooth' && connType.value !== 'mqtt') return
		firstFrameFailCount += 1
		bmsDataLoadAttempts.value = firstFrameFailCount
		bmsDataLoadLastError.value = formatErr(err)
		if (isInstrumentSession()) {
			bmsDataLoadPhase.value =
				instrumentStatusFailCount >= INSTRUMENT_NO_PASSTHROUGH_FAILURE_THRESHOLD ? 'failed' : 'slow'
			return
		}
		if (
			connType.value === 'bluetooth' &&
			firstFrameFailCount >= FIRST_FRAME_AUTO_RECONNECT_FAILURES &&
			firstFrameAutoReconnectCount < FIRST_FRAME_MAX_AUTO_RECONNECTS &&
			!firstFrameRecovering
		) {
			bmsDataLoadPhase.value = 'retrying'
			requestFirstFrameReconnect?.(sourceClient, 'first-frame-read-failed', err)
			return
		}
		bmsDataLoadPhase.value = firstFrameFailCount >= FIRST_FRAME_AUTO_RECONNECT_FAILURES ? 'failed' : 'slow'
	}

	const shouldShowBmsDataLoading = () => {
		return !status.value && (connType.value === 'bluetooth' || connType.value === 'mqtt') && !instrumentPassthroughUnavailable.value
	}

	const syncBmsDataLoading = () => {
		bmsDataLoading.value = shouldShowBmsDataLoading()
	}

	const stopCloudPolling = () => {
		if (cloudPollTimer != null) {
			clearTimeout(cloudPollTimer)
			cloudPollTimer = null
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

	const isCloudCapableBattery = () => {
		const commType = Number(battery.value?.bms_comm_type || 0)
		const commChipId = String(battery.value?.comm_chip_id || '').trim()
		return commType === 2 || commType === 3 || !!commChipId
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

	const refreshCloudTelemetry = async (options?: { bootstrapOnly?: boolean }) => {
		if (!deviceId.value || isInstrumentSession()) return false
		if (!status.value) bmsDataLoading.value = true
		try {
			const rsp = await appBatteryCurrentTelemetry(deviceId.value)
			if (!rsp || (rsp as any).code !== 200) throw new Error((rsp as any)?.message || 'current telemetry fetch failed')
			const payload = ((rsp as any).data || {}) as AppBatteryCurrentTelemetry
			const nextStatus = buildStatusFromCloudTelemetry(battery.value, payload)
			const hasCurrent = !!payload.current && Object.keys(payload.current).length > 0
			if (battery.value) {
				battery.value = {
					...battery.value,
					is_online: payload.is_online,
				}
			}
			const realtimeClientActive =
				!!options?.bootstrapOnly &&
				dataSourceMode.value === 'realtime' &&
				(connType.value === 'mqtt' || connType.value === 'bluetooth') &&
				!!client.value
			if (realtimeClientActive) {
				if (!status.value) {
					status.value = nextStatus
				}
			} else {
				status.value = nextStatus
				connType.value = Number(payload.is_online || 0) === 1 || hasCurrent ? 'mqtt' : 'offline'
				dataSourceMode.value = connType.value === 'mqtt' ? 'cloud_fallback' : 'offline'
			}
			syncBmsDataLoading()
			log('cloud telemetry refreshed', {
				deviceId: deviceId.value,
				is_online: payload.is_online,
				keys: payload.current ? Object.keys(payload.current).length : 0,
				has_snapshot: !!payload.snapshot,
				conn_type: connType.value,
				preserved_realtime_conn: realtimeClientActive,
			})
			return true
		} catch (e) {
			log('cloud telemetry fetch failed', { err: formatErr(e) })
			syncBmsDataLoading()
			return false
		}
	}

	const scheduleCloudPolling = () => {
		stopCloudPolling()
		if (!deviceId.value || isInstrumentSession()) return
		cloudPollTimer = setTimeout(async () => {
			cloudPollTimer = null
			if (!deviceId.value || isInstrumentSession()) return
			await refreshCloudTelemetry()
			if (connType.value !== 'bluetooth') scheduleCloudPolling()
		}, CLOUD_POLL_INTERVAL_MS) as unknown as number
	}

	const activateCloudReportMode = async () => {
		stopPolling()
		stopCloudPolling()
		closeRelaySocket()
		client.value = null
		if (bleCacheKey) {
			releaseBleClient(bleCacheKey)
			bleCacheKey = null
		}
		try {
			await mqttTransport?.disconnect()
		} catch (e) {}
		mqttTransport = null
		const ok = await refreshCloudTelemetry()
		if (!ok && Number(battery.value?.is_online || 0) === 1) {
			connType.value = 'mqtt'
			dataSourceMode.value = 'cloud_fallback'
		}
		if (!ok && connType.value !== 'mqtt') dataSourceMode.value = 'offline'
		scheduleCloudPolling()
		return ok
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
		stopCloudPolling()
		if (bleCacheKey && bleCacheKey !== entry.key) {
			releaseBleClient(bleCacheKey)
		}
		if (options?.retain !== false && bleCacheKey !== entry.key) {
			retainBleClient(entry.key)
		}
		bleCacheKey = entry.key
		client.value = entry.client
		connType.value = 'bluetooth'
		dataSourceMode.value = 'realtime'
		realtimeOccupied.value = false
		connecting.value = false
		syncBmsDataLoading()
		startPolling(entry.client)
		if (!isInstrumentSession()) {
			void reportConnectionStatus(true, 'bluetooth')
			void flushReportQueue()
			void connectRelaySocket()
		}
		return true
	}

	const validateWarmBleEntry = async (entry: BleClientEntry, reason: string) => {
		try {
			await withTimeout(entry.client.readUuid(), WARM_BLE_PROBE_TIMEOUT_MS, 'warm BLE probe')
			return true
		} catch (e) {
			log('warm ble probe failed, reconnect required', {
				reason,
				mac: entry.mac,
				deviceId: entry.deviceId,
				err: formatErr(e),
			})
			try {
				await disconnectBleClient(entry.key)
			} catch (e2) {}
			return false
		}
	}

	const attachWarmBleFromBattery = async (reason: string) => {
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
		if (!(await validateWarmBleEntry(entry, reason))) return false
		return attachBleEntry(entry, { retain: true })
	}

	const startPolling = (c: BmsClient) => {
		stopPolling()
		if (pollingPaused.value) return
		if (isInstrumentSession() && instrumentPassthroughUnavailable.value) return
		syncBmsDataLoading()
		beginFirstFrameWait()
		const run = async () => {
			syncBmsDataLoading()
			beginFirstFrameWait()
			try {
				status.value = await c.readAllStatus()
				markFirstFrameSuccess()
				if (connType.value === 'mqtt' || connType.value === 'bluetooth') {
					dataSourceMode.value = 'realtime'
				}
				instrumentStatusFailCount = 0
				instrumentPassthroughUnavailable.value = false
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
				if (isInstrumentSession() && connType.value === 'bluetooth' && isInstrumentNoPassthroughError(e)) {
					instrumentStatusFailCount += 1
					if (instrumentStatusFailCount >= INSTRUMENT_NO_PASSTHROUGH_FAILURE_THRESHOLD) {
						instrumentPassthroughUnavailable.value = true
						status.value = null
						bmsDataLoading.value = false
						log('instrument passthrough unavailable, stop status polling', {
							failCount: instrumentStatusFailCount,
							err: formatErr(e),
						})
						return
					}
				}
				if (pollErrLogged < 3) {
					pollErrLogged += 1
					log('poll failed', { err: formatErr(e) })
				}
				handleFirstFrameReadFailure(c, e)
			} finally {
				syncBmsDataLoading()
			}
		}
		const scheduleNext = (delayMs: number) => {
			if (pollingPaused.value || client.value !== c) return
			if (isInstrumentSession() && instrumentPassthroughUnavailable.value) return
			pollTimer = setTimeout(async () => {
				pollTimer = null
				if (pollingPaused.value || client.value !== c) return
				if (isInstrumentSession() && instrumentPassthroughUnavailable.value) return
				await run()
				if (isInstrumentSession() && instrumentPassthroughUnavailable.value) return
				const nextDelay = isInstrumentSession() && !status.value ? INSTRUMENT_WARMUP_POLL_INTERVAL_MS : POLL_INTERVAL_MS
				scheduleNext(nextDelay)
			}, delayMs) as unknown as number
		}
		void run().finally(() => {
			if (isInstrumentSession() && instrumentPassthroughUnavailable.value) return
			const nextDelay = isInstrumentSession() && !status.value ? INSTRUMENT_WARMUP_POLL_INTERVAL_MS : POLL_INTERVAL_MS
			scheduleNext(nextDelay)
		})
	}

	const pausePolling = () => {
		pollingPaused.value = true
		stopPolling()
		bmsDataLoading.value = false
	}

	const resumePolling = () => {
		pollingPaused.value = false
		if (isInstrumentSession() && instrumentPassthroughUnavailable.value) return
		if (client.value) startPolling(client.value)
		else syncBmsDataLoading()
	}

	const disconnectAll = async (options?: { preserveFirstFrameState?: boolean; preserveStatus?: boolean }) => {
		invalidateBleConnectAttempts('device-detail disconnectAll')
		const wasBluetooth = connType.value === 'bluetooth'
		if (wasBluetooth && !isInstrumentSession()) {
			void reportConnectionStatus(false, 'bluetooth')
		}
		stopPolling()
		stopCloudPolling()
		closeRelaySocket()
		client.value = null
		if (!options?.preserveStatus) {
			status.value = null
		}
		bmsDataLoading.value = false
		if (!options?.preserveFirstFrameState) {
			resetFirstFrameState()
		}
		instrumentStatusFailCount = 0
		instrumentPassthroughUnavailable.value = false
		if (!options?.preserveStatus || !status.value) {
			connType.value = 'offline'
			dataSourceMode.value = 'offline'
		}
		realtimeOccupied.value = false
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
				preferredDeviceId: isInstrumentSession() ? instrumentPreferredDeviceId : undefined,
			})
			if (!entry) return false
			return attachBleEntry(entry, { retain: true })
		} catch (e) {
			log('ble connect failed', { err: e instanceof Error ? e.message : String(e || '') })
			return false
		}
	}

	const connectSocketBridge = async (): Promise<boolean> => {
		realtimeOccupied.value = false
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
				platform: getReportPlatform(),
				logger: console as any,
			})
			await mqttTransport.connect()
			const c = new BmsClient({ transport: mqttTransport })
			client.value = c
			connType.value = 'mqtt'
			dataSourceMode.value = 'realtime'
			realtimeOccupied.value = false
			syncBmsDataLoading()
			startPolling(c)
			log('socket bridge connect ok', { wsUrl })
			return true
		} catch (e) {
			if (isMqttSocketOccupiedError(e)) {
				log('socket bridge occupied, fallback to cloud report mode', { err: formatErr(e) })
				try {
					await mqttTransport?.disconnect()
				} catch (e2) {}
				mqttTransport = null
				client.value = null
				realtimeOccupied.value = true
				await activateCloudReportMode()
				return true
			}
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
			if (options?.preserveCurrentBle && (await attachWarmBleFromBattery('connect-auto'))) return
			if (!options?.preserveCurrentBle) {
				await disconnectAll({
					preserveFirstFrameState: options?.preserveFirstFrameState,
					preserveStatus: options?.preserveStatus,
				})
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
			log('connectAuto', {
				deviceId: deviceId.value,
				bms_comm_type: battery.value?.bms_comm_type ?? null,
				ble_mac: battery.value?.ble_mac ?? null,
				comm_chip_id: battery.value?.comm_chip_id ?? null,
				use_socket_bridge: true,
			})
			if (treatBleOnly) {
				log('connectAuto choose BLE-only')
				if (bleDecision.ok && (await connectBleFirst(options))) return
				connType.value = 'offline'
				return
			}
			if (isCloudCapableBattery()) {
				log('connectAuto choose 4G socket bridge')
				if (await connectSocketBridge()) return
				log('connectAuto socket bridge failed, fallback to cloud report mode')
				await activateCloudReportMode()
				return
			}
			if (bleDecision.ok && (await connectBleFirst(options))) return
			log('connectAuto BLE not available, try remote transport')
			connType.value = 'offline'
			dataSourceMode.value = 'offline'
		} finally {
			connecting.value = false
		}
	}

	requestFirstFrameReconnect = (sourceClient: BmsClient, reason: string, err?: unknown) => {
		if (firstFrameRecovering || status.value || client.value !== sourceClient || connType.value !== 'bluetooth') return
		firstFrameRecovering = true
		firstFrameAutoReconnectCount += 1
		bmsDataLoadPhase.value = 'retrying'
		const bleKey = bleCacheKey || String(battery.value?.ble_mac || '').trim()
		log('first frame auto reconnect start', {
			reason,
			ble_mac: bleKey || null,
			auto_reconnect_count: firstFrameAutoReconnectCount,
			err: formatErr(err),
		})
		void (async () => {
			await disconnectAll({ preserveFirstFrameState: true })
			if (bleKey) {
				try {
					await disconnectBleClient(bleKey)
				} catch (e) {}
			}
			await sleep(FIRST_FRAME_RECONNECT_DELAY_MS)
			if (!status.value && hasConnectTarget()) {
				await connectAuto({ preserveCurrentBle: false, probe: true, preserveFirstFrameState: true })
			}
		})()
			.catch((e) => {
				log('first frame auto reconnect failed', { err: formatErr(e) })
				if (!status.value) bmsDataLoadPhase.value = 'failed'
			})
			.finally(() => {
				firstFrameRecovering = false
				syncBmsDataLoading()
			})
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
		realtimeOccupied.value = false
		bmsDataLoading.value = false
		resetFirstFrameState()
		instrumentStatusFailCount = 0
		instrumentPreferredDeviceId = ''
		instrumentPassthroughUnavailable.value = false
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
			if (warmEntry && (await validateWarmBleEntry(warmEntry, 'handoff'))) {
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
		if (isCloudCapableBattery()) {
			void refreshCloudTelemetry({ bootstrapOnly: true })
			void connectAuto({ preserveCurrentBle: false, preserveStatus: true })
			return
		}
		if (options?.preferWarmBle !== false && (await attachWarmBleFromBattery('cloud-detail'))) return
		void connectAuto({ preserveCurrentBle: options?.preferWarmBle !== false })
	}

	const loadInstrumentSession = ({ bleMac, deviceName, deviceId: preferredDeviceId }: LoadInstrumentSessionOptions) => {
		const normalizedMac = normalizeMac(bleMac)
		if (!normalizedMac) return
		resetReportState({ clearQueue: true })
		resetFirstFrameState()
		sessionMode.value = 'instrument'
		deviceId.value = ''
		status.value = null
		realtimeOccupied.value = false
		bmsDataLoading.value = false
		instrumentStatusFailCount = 0
		instrumentPreferredDeviceId = String(preferredDeviceId || '').trim()
		instrumentPassthroughUnavailable.value = false
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
			device_id: instrumentPreferredDeviceId || null,
			device_name: battery.value.device_name ?? null,
		})
		void connectAuto()
	}

	const retryBmsDataRead = () => {
		if (connecting.value || firstFrameRecovering) return
		firstFrameFailCount = 0
		firstFrameAutoReconnectCount = 0
		bmsDataLoadAttempts.value = 0
		bmsDataLoadLastError.value = ''
		bmsDataLoadPhase.value = 'reading'
		clearFirstFrameSlowTimer()
		if (client.value && (connType.value === 'bluetooth' || connType.value === 'mqtt')) {
			startPolling(client.value)
			return
		}
		void connectAuto({ preserveCurrentBle: true, probe: true, preserveFirstFrameState: true })
	}

	const reconnectBmsData = async () => {
		if (connecting.value || firstFrameRecovering) return
		firstFrameRecovering = true
		firstFrameFailCount = 0
		firstFrameAutoReconnectCount = 0
		bmsDataLoadAttempts.value = 0
		bmsDataLoadLastError.value = ''
		bmsDataLoadPhase.value = 'retrying'
		const bleKey = bleCacheKey || String(battery.value?.ble_mac || '').trim()
		try {
			await disconnectAll({ preserveFirstFrameState: true })
			if (bleKey) {
				try {
					await disconnectBleClient(bleKey)
				} catch (e) {}
			}
			await sleep(FIRST_FRAME_RECONNECT_DELAY_MS)
			await connectAuto({ preserveCurrentBle: false, probe: true, preserveFirstFrameState: true })
		} catch (e) {
			log('manual bms data reconnect failed', { err: formatErr(e) })
			if (!status.value) bmsDataLoadPhase.value = 'failed'
		} finally {
			firstFrameRecovering = false
			syncBmsDataLoading()
		}
	}

	return {
		deviceId,
		battery,
		status,
		client,
		connType,
		dataSourceMode,
		realtimeOccupied,
		connecting,
		bmsDataLoading,
		bmsDataLoadPhase,
		bmsDataLoadAttempts,
		bmsDataLoadLastError,
		sessionMode,
		pausePolling,
		resumePolling,
		loadById,
		loadInstrumentSession,
		disconnectAll,
		disconnectBluetooth,
		retryBmsDataRead,
		reconnectBmsData,
	}
}
