import $C from '@/common/config'
declare const plus: { runtime: { appid: string; version?: string } }

export function useAppRuntime() {
	const getLang = (): string => uni.getStorageSync('language') || 'zh-CN'

	const getAppId = (): string => {
		// #ifdef APP-PLUS
		return plus.runtime.appid
		// #endif
		return $C.appId || uni.getStorageSync('app_appid') || ''
	}

	const getBaseUrl = (): string => $C.apiBaseUrl

	const getHeaders = (): Record<string, string> => {
		const token = uni.getStorageSync('access_token')
		const tenantId = uni.getStorageSync('tenant_id')
		const h: Record<string, string> = {}
		if (token) h['x-token'] = String(token)
		if (tenantId) h['X-TenantID'] = String(tenantId)
		return h
	}

	return { getLang, getAppId, getBaseUrl, getHeaders }
}
