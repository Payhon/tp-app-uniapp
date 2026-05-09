import $C from '@/common/config'
import { extractApiErrorMessage } from '@/common/api-error'
import i18n from '@/lang'
import $store from '@/store'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string

export interface RequestCommon {
	method: HttpMethod
	header: Record<string, string>
	data: Record<string, unknown>
}

export interface RequestOptions {
	url: string
	method?: HttpMethod
	header?: Record<string, any>
	data?: any
	token?: boolean
	native?: boolean
	// uni.request/uni.uploadFile 允许很多额外字段（timeout、dataType、responseType、filePath、name...）
	// 这里保持兼容，不强约束
	[key: string]: any
}

type UploadOptions = Omit<RequestOptions, 'url'>

const common: RequestCommon = {
	method: 'GET',
	header: {
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	data: {}
}

const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params as any) as string

const request = <T = unknown>(options: RequestOptions): Promise<T> | any => {
	const merged: RequestOptions = { ...options }
	merged.url = $C.webUrl + merged.url
	merged.method = merged.method || common.method
	merged.header = merged.header || common.header

	// 验证 token
	if (merged.token) {
		merged.header.Authorization = `${$store.state.token.token_type} ${$store.state.token.access_token}`
		if (!merged.header.Authorization) {
			return uni.showToast({
				title: t('auth.sessionExpired'),
				icon: 'none'
			})
		}
	}

	return new Promise((resolve, reject) => {
		uni.request({
			...merged,
			success: (result: any) => {
				// 返回原始数据
				if (merged.native) {
					return resolve(result as T)
				}
				// 请求服务端失败
				if (result?.data?.code !== 200) {
					uni.showToast({
						title: extractApiErrorMessage(result?.data, t('common.requestFailed')),
						icon: 'none'
					})
					return reject(result.data)
				}
				// 请求服务端成功
				resolve(result.data.data as T)
			},
			fail: (error: any) => {
				uni.showToast({
					title: error?.errMsg || t('common.requestFailed'),
					icon: 'none'
				})
				return reject()
			}
		})
	})
}

const get = <T = unknown>(url: string, data: any = {}, options: Omit<RequestOptions, 'url' | 'data' | 'method'> = {}) => {
	return request<T>({
		...options,
		url,
		data,
		method: 'GET'
	})
}

const post = <T = unknown>(url: string, data: any = {}, options: Omit<RequestOptions, 'url' | 'data' | 'method'> = {}) => {
	return request<T>({
		...options,
		url,
		data,
		method: 'POST'
	})
}

// 上传图片
const upload = <T = unknown>(url: string, options: UploadOptions = {}) => {
	const merged: RequestOptions = { ...(options as any) }
	merged.url = $C.webUrl + url
	merged.header = merged.header || {}

	// 验证token
	if (merged.token) {
		merged.header.token = $store.state.token
		if (!merged.header.token) {
			return uni.showToast({
				title: t('auth.sessionExpired'),
				icon: 'none'
			})
		}
	}

	return new Promise<T>((resolve, reject) => {
		uni.uploadFile({
			...merged,
			success: (uploadFileRes: any) => {
				if (uploadFileRes.statusCode != 200) {
					uni.showToast({
						title: t('common.uploadFailed'),
						icon: 'none'
					})
					return
				}

				const data = JSON.parse(uploadFileRes.data)
				resolve(data as T)
			},
			fail: (err: any) => {
				reject(err)
			}
		})
	})
}

export default { common, request, get, post, upload }
