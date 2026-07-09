import http from './interface'
import { resolveBaseUrl } from './interface'
import $C from '@/common/config'
import { handleSessionExpired, shouldHandleSessionExpiredResponse } from '@/common/auth/session-expired'
/**
 * 将业务所有接口统一起来便于维护
 * 如果项目很大可以将 url 独立成文件，接口分成不同的模块
 * 
 */
export const apiRequest = (url, data, method) => {
	//设置请求前拦截器
	http.interceptor.request = (config) => {
		let token = uni.getStorageSync("access_token")
		let tenantId = uni.getStorageSync('tenant_id') || $C.tenantId
		delete config.header['x-token']
		delete config.header['X-TenantID']
		if (token) {
			config.header['x-token'] = token
		}
		if (tenantId) {
			config.header['X-TenantID'] = tenantId
		}
		config.baseUrl = resolveBaseUrl()
		return config;
	}
	//设置请求结束后拦截器
	http.interceptor.response = (response) => {
		if (shouldHandleSessionExpiredResponse(response)) {
			handleSessionExpired()
		}
		// 统一处理错误请求
		return response.data;
	}
	return http.request({
		url: url,
		data: data,
		method: method,
		dataType: 'json',
	})
}
// 刷新 token 方法
async function doRequest(response) {
	var params = {
		refreshToken: uni.getStorageSync('refreshToken'),
		token: uni.getStorageSync('accessToken')
	}
	const res = await apiRequest('/api/v1/user/refresh', params, 'POST')
	if (res && res.statusCode === 200) {
		let config = response.config
		uni.setStorageSync('accessToken', res.data.result.token)
		uni.setStorageSync('refreshToken', res.data.result.refreshToken)
		config.header['x-token'] = res.data.result.token
		const resold = await apiRequest('/api/v1' + getStrAfter(config.url, '/api/v1'), {
			...config.data
		}, config.method)
		return resold
	}
}

function getStrAfter(string, str) {
	var str_after = string.split(str)[1];
	return str_after
}
// 默认全部导出  
export default {
	apiRequest
}
