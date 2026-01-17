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
	device_id: string
	model?: string | null
	version?: string | null
	[key: string]: unknown
}

export const appBatteryDetail = (deviceId: string) => {
	return apiRequest<AppBatteryDetail>(`/api/v1/app/battery/detail/${deviceId}`, null, 'GET')
}

export const appBatteryMqttCredential = (deviceId: string) => {
	return apiRequest<AppBatteryMqttCredential>(`/api/v1/app/battery/mqtt-credential/${deviceId}`, null, 'GET')
}

export const appBatteryOtaCheck = (payload: AppBatteryOtaCheckReq) => {
	return apiRequest<AppBatteryOtaCheck>(`/api/v1/app/battery/ota/check`, payload, 'POST')
}
