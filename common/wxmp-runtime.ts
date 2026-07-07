import api from '@/API/'
import { getRuntimeAppId } from '@/common/public-content'
import type { ApiResponse } from '@/types/api'

export type WxmpRuntimeConfig = {
	app_id?: string
	wx_appid?: string
	status?: string
	source_type?: string
	login_only?: boolean
	home_banner_url?: string
	login_logo_url?: string
	org_id?: string
	org_name?: string
}

export function isPackWxmpRuntime(config?: WxmpRuntimeConfig | null): boolean {
	return config?.login_only === true || String(config?.source_type || '').toUpperCase() === 'PACK'
}

export function shouldUseDefaultWxmpBrandAsset(config?: WxmpRuntimeConfig | null): boolean {
	return config?.login_only === false && String(config?.source_type || '').toUpperCase() === 'TENANT'
}

export async function fetchWxmpRuntimeConfig(): Promise<WxmpRuntimeConfig | null> {
	// #ifdef MP-WEIXIN
	const appid = getRuntimeAppId()
	if (!appid) return null
	try {
		const resp = (await api.apiRequest('/api/v1/app/wxmp/runtime', { appid }, 'GET')) as ApiResponse<WxmpRuntimeConfig>
		if (resp && resp.code === 200 && resp.data) return resp.data
	} catch (e) {}
	return null
	// #endif
	// #ifndef MP-WEIXIN
	return null
	// #endif
}
