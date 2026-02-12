import api from '@/API/'

export type StoreListItem = {
	enable: boolean
	id: string
	name: string
	scheme: string
	priority: number
}

export type UpgradeCheckResult = {
	_id: string
	appid: string
	name: string
	title: string
	contents: string
	url: string
	platform: Array<string>
	version: string
	uni_platform: string
	stable_publish: boolean
	is_mandatory: boolean
	is_silently: boolean
	create_env: string
	create_date: number
	message: string
	code: number
	type: string
	store_list: StoreListItem[] | null
	min_uni_version: string | null
}

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(url: string, data: unknown, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

function normalizeUniPlatform(systemInfo: any): string {
	// uni.getSystemInfoSync().uniPlatform 通常为：app / web / mp-xxx ...
	// APP 内固定传 'app'，以兼容后台 wgt 默认 uni_platform=app 的约定
	const p = String(systemInfo?.uniPlatform || '').toLowerCase()
	return p || 'app'
}

function normalizeClientPlatform(systemInfo: any): string {
	// uni.getSystemInfoSync().platform 通常为：android/ios（APP-HARMONY 可能为 harmony）
	const p = String(systemInfo?.platform || '').toLowerCase()
	if (p === 'android') return 'Android'
	if (p === 'ios') return 'iOS'
	if (p === 'harmony' || p === 'harmonyos') return 'Harmony'
	return ''
}

export default function (): Promise<UpgradeCheckResult> {
	// #ifdef APP
	return new Promise<UpgradeCheckResult>((resolve, reject) => {
		const systemInfo = uni.getSystemInfoSync()
		const appId = systemInfo.appId
		const appVersion = systemInfo.appVersion
		const uniPlatform = normalizeUniPlatform(systemInfo)
		const clientPlatform = normalizeClientPlatform(systemInfo)
		const uniVersion = systemInfo.uniVersion

		// #ifndef UNI-APP-X
		if (typeof appId === 'string' && typeof appVersion === 'string' && appId.length > 0 && appVersion.length > 0) {
			plus.runtime.getProperty(appId, async function (widgetInfo) {
				try {
					const wgtVersion = widgetInfo?.version
					if (!wgtVersion) {
						return reject('widgetInfo.version is EMPTY')
					}

					const payload = {
						action: 'checkVersion',
						appid: appId,
						appVersion,
						wgtVersion,
						uni_platform: uniPlatform,
						client_platform: clientPlatform,
						uniVersion
					}

					const res = await apiRequest<UpgradeCheckResult>('/api/v1/app/upgrade/check', payload, 'POST')
					if (!res || typeof res.code !== 'number') {
						return reject('invalid response')
					}
					if (res.code !== 200) {
						return reject(res)
					}
					resolve(res.data)
				} catch (e: any) {
					reject(e?.message || e)
				}
			})
		} else {
			reject('invalid appid or appVersion')
		}
		// #endif

		// #ifdef UNI-APP-X
		// 当前项目以 uni-app 为主，UNI-APP-X 预留兼容（按需补齐）
		reject('UNI-APP-X not supported')
		// #endif
	})
	// #endif
	// #ifndef APP
	return Promise.reject({
		message: '请在App中使用'
	})
	// #endif
}
