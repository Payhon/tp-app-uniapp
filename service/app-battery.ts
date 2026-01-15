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

export const appBatteryDetail = (deviceId: string) => {
	return apiRequest<AppBatteryDetail>(`/api/v1/app/battery/detail/${deviceId}`, null, 'GET')
}
