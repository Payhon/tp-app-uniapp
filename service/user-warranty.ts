import api from '@/API/'
import { getRuntimeAppId } from '@/common/public-content'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(url: string, data: unknown, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

export type AppWarrantyBatteryCard = {
	device_id: string
	device_number: string
	battery_serial: string
	battery_model_name?: string | null
	activation_date?: string | null
	warranty_start_date?: string | null
	warranty_expire_date?: string | null
	warranty_months?: number | null
}

export type AppWarrantyProfile = {
	contact_name?: string | null
	contact_phone?: string | null
	warranty_cards_enabled: boolean
	warranty_profile_exists: boolean
	warranty_profile_completed: boolean
	warranty_profile_reminder_needed: boolean
	batteries: AppWarrantyBatteryCard[]
}

export type AppWarrantyProfileSaveReq = {
	contact_name?: string | null
	contact_phone?: string | null
}

function warrantyQueryParams() {
	const appid = getRuntimeAppId()
	return appid ? { appid } : {}
}

function warrantyProfileUrl() {
	const appid = getRuntimeAppId()
	return appid ? `/api/v1/app/warranty/profile?appid=${encodeURIComponent(appid)}` : '/api/v1/app/warranty/profile'
}

export const fetchAppWarrantyProfile = () => {
	return apiRequest<AppWarrantyProfile>('/api/v1/app/warranty/profile', warrantyQueryParams(), 'GET')
}

export const saveAppWarrantyProfile = (payload: AppWarrantyProfileSaveReq) => {
	return apiRequest<AppWarrantyProfile>(warrantyProfileUrl(), payload, 'POST')
}
