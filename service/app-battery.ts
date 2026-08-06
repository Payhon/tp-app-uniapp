import api from '@/API/'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(url: string, data: unknown, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

export type AppBatteryDetail = {
	device_id: string
	device_number: string
	device_name?: string | null
	bms_comm_type?: number | null
	battery_model_id?: string | null
	battery_model_name?: string | null
	item_uuid?: string | null
	batch_number?: string | null
	ble_mac?: string | null
	comm_chip_id?: string | null
	soc?: number | null
	soh?: number | null
	updated_at?: string | null
	is_online?: number | null
	fw_version?: string | null
	remark?: string | null
	[key: string]: unknown
}

export type AppBatteryMqttCredential = {
	device_id: string
	ws_url: string
	username: string
	password?: string | null
	write_topic: string
	read_topic: string
	[key: string]: unknown
}

export type AppBatteryCurrentTelemetryValue = {
	value: unknown
	ts: number
}

export type AppBatteryCurrentTelemetry = {
	device_id: string
	is_online: number
	last_report_ts?: number
	snapshot_ts?: number
	interactive_snapshot_ts?: number
	current?: Record<string, AppBatteryCurrentTelemetryValue>
	snapshot?: Record<string, unknown> | null
	interactive_snapshot?: Record<string, unknown> | null
	[key: string]: unknown
}

type LegacyTelemetryRow = {
	key?: string
	value?: unknown
	ts?: string | number
	[key: string]: unknown
}

export type AppBatteryOtaCheck = {
	device_id: string
	need_upgrade: boolean
	current_version?: string | null
	version?: string | null
	target_version?: string | null
	firmware_url?: string | null
	package_id?: string | null
	package_type?: number | null
	signature_type?: string | null
	signature?: string | null
	module?: string | null
	additional_info?: string | null
	[key: string]: unknown
}

export type AppBatteryOtaCheckReq = {
	device_id?: string
	model?: string | null
	version?: string | null
	battery_model_id?: string | null
	batch_number?: string | null
	item_uuid?: string | null
	[key: string]: unknown
}

export type AppBatteryMeterOtaPackage = {
	id: string
	name: string
	description?: string | null
	package_url?: string | null
	[key: string]: unknown
}

export type AppBatteryReportReq = {
	device_id: string
	ts: number
	conn_type: 'bluetooth' | 'mqtt' | 'offline' | string
	platform: string
	core: Record<string, unknown>
	snapshot?: Record<string, unknown>
}

export type AppBatteryReportResp = {
	device_id: string
	ts: number
	accepted: boolean
	ignored_reason?: string
	[key: string]: unknown
}

export type AppBatteryInteractiveSnapshotReq = {
	device_id: string
	session_id: string
	platform?: string
	snapshot: Record<string, unknown>
}

export type AppBatteryInteractiveSnapshotResp = {
	device_id: string
	ts: number
	accepted: boolean
}

export type AppBatteryConnectionStatusReq = {
	device_id: string
	conn_type: 'bluetooth' | 'mqtt' | 'offline' | string
	platform?: string
	ble_connected: boolean
	ts?: number
}

export type AppBatteryConnectionStatusResp = {
	device_id: string
	ts: number
	ble_connected: boolean
	accepted: boolean
	status_changed: boolean
	ignored_reason?: string
	[key: string]: unknown
}

export const appBatteryDetail = (deviceId: string) => {
	return apiRequest<AppBatteryDetail>(`/api/v1/app/battery/detail/${deviceId}`, null, 'GET')
}

export const appBatteryMqttCredential = (deviceId: string) => {
	return apiRequest<AppBatteryMqttCredential>(`/api/v1/app/battery/mqtt-credential/${deviceId}`, null, 'GET')
}

const parseLegacyTelemetryTs = (ts: unknown) => {
	if (typeof ts === 'number' && Number.isFinite(ts)) {
		return ts > 10_000_000_000 ? ts : ts * 1000
	}
	if (typeof ts === 'string' && ts.trim() !== '') {
		const parsed = Date.parse(ts)
		if (Number.isFinite(parsed)) return parsed
	}
	return 0
}

const normalizeLegacyCurrentTelemetry = (deviceId: string, rows: unknown): AppBatteryCurrentTelemetry => {
	const current: Record<string, AppBatteryCurrentTelemetryValue> = {}
	let lastReportTs = 0
	if (Array.isArray(rows)) {
		for (const row of rows as LegacyTelemetryRow[]) {
			const key = String(row?.key || '').trim()
			if (!key) continue
			const ts = parseLegacyTelemetryTs(row?.ts)
			if (ts > lastReportTs) lastReportTs = ts
			current[key] = { value: row?.value, ts }
		}
	}
	const freshMs = lastReportTs > 0 ? Date.now() - lastReportTs : Number.POSITIVE_INFINITY
	return {
		device_id: deviceId,
		is_online: freshMs >= 0 && freshMs <= 300_000 ? 1 : 0,
		last_report_ts: lastReportTs,
		snapshot_ts: 0,
		current,
		snapshot: null,
	}
}

export const appBatteryCurrentTelemetry = async (deviceId: string) => {
	try {
		return await apiRequest<AppBatteryCurrentTelemetry>(`/api/v1/app/battery/current-telemetry/${deviceId}`, null, 'GET')
	} catch (e) {
		const legacyRsp = await apiRequest<LegacyTelemetryRow[]>(`/api/v1/telemetry/datas/current/${deviceId}`, null, 'GET')
		if (legacyRsp && legacyRsp.code === 200) {
			return {
				...legacyRsp,
				data: normalizeLegacyCurrentTelemetry(deviceId, legacyRsp.data),
			}
		}
		return legacyRsp as unknown as ApiResponse<AppBatteryCurrentTelemetry>
	}
}

export const appBatteryOtaCheck = (payload: AppBatteryOtaCheckReq) => {
	return apiRequest<AppBatteryOtaCheck>(`/api/v1/app/battery/ota/check`, payload, 'POST')
}

export const getAppBatteryMeterOtaPackages = () => {
	return apiRequest<AppBatteryMeterOtaPackage[]>(`/api/v1/app/battery/ota/meter-packages`, null, 'GET')
}

export const appBatteryReport = (payload: AppBatteryReportReq) => {
	return apiRequest<AppBatteryReportResp>(`/api/v1/app/battery/report`, payload, 'POST')
}

export const appBatteryInteractiveSnapshot = (payload: AppBatteryInteractiveSnapshotReq) => {
	return apiRequest<AppBatteryInteractiveSnapshotResp>(
		`/api/v1/app/battery/interactive-snapshot`,
		payload,
		'POST'
	)
}

export const appBatteryConnectionStatus = (payload: AppBatteryConnectionStatusReq) => {
	return apiRequest<AppBatteryConnectionStatusResp>(`/api/v1/app/battery/connection-status`, payload, 'POST')
}
