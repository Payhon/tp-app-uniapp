import api from '@/API/'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(
	url: string,
	data: unknown,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string
) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

export type DeviceProvisionConfig = { dtu_domain_port: string }
export type DeviceProvisionInfo = {
	device_id: string
	device_number: string
	device_name?: string
	ble_mac?: string
	comm_chip_id?: string
	bms_comm_type?: number
	is_bound?: boolean
}

export const getDeviceProvisionConfig = () => {
	return apiRequest<DeviceProvisionConfig>('/api/v1/app/device/provision/config', null, 'GET')
}

export const getDeviceProvisionInfo = (itemUuid: string) => {
	return apiRequest<DeviceProvisionInfo>('/api/v1/app/device/provision/info', { item_uuid: itemUuid }, 'GET')
}

export const postDeviceProvisionBind = (params: { item_uuid: string; ble_mac?: string }) => {
	return apiRequest<unknown>('/api/v1/app/device/provision/bind', params, 'POST')
}
