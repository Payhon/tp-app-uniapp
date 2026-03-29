import api from '@/API/'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(url: string, data: unknown, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

export type DeviceParamPermissionResp = {
	org_type?: string
	allow_all?: boolean
	device_param_permissions?: string[]
}

export type MobileUIPermissionResp = {
	org_type?: string
	org_types?: string[]
	allow_all?: boolean
	ui_codes?: string[]
}

export const fetchCurrentDeviceParamPermissions = () => {
	return apiRequest<DeviceParamPermissionResp>('/api/v1/org_type_permissions/device_param_permissions/me', null, 'GET')
}

export const fetchCurrentMobileUIPermissions = () => {
	return apiRequest<MobileUIPermissionResp>('/api/v1/org_type_permissions/mobile_ui_codes/me', null, 'GET')
}
