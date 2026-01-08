import api from '@/API/'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(
	url: string,
	data: unknown,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string
) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

export interface RegisterByEmailPayload {
	email: string
	verify_code: string
	password: string
	confirm_password: string
	phone_prefix: string
	phone_number: string
}

/**
 * 登录接口
 * @param email 用户邮箱
 * @param password 密码
 * @param salt 加密盐值
 */
export const fetchLogin = (email: string, password: string, salt: string) => {
	return apiRequest<unknown>('/api/v1/login', { email, password, salt }, 'POST')
}

/**
 * 获取用户信息
 */
export const fetchGetUserInfo = () => {
	return apiRequest<unknown>('/api/v1/user/detail', null, 'GET')
}

/**
 * 登出接口
 */
export const logout = () => {
	return apiRequest<unknown>('/api/v1/user/logout', null, 'GET')
}

/**
 * 获取邮箱验证码
 * @param email 邮箱地址
 */
export const fetchEmailCode = (email: string) => {
	const params = {
		email,
		is_register: 1
	}
	return apiRequest<unknown>('/api/v1/verification/code', params, 'GET')
}

/**
 * 邮箱注册接口参数类型
 
interface RegisterData {
  email: string;           // 邮箱
  verify_code: string;     // 邮箱验证码
  password: string;        // 用户密码
  confirm_password: string;// 确认密码
  phone_prefix: string;    // 手机前缀
  phone_number: string;    // 手机号码
}
*/

/**
 * 邮箱注册
 * @param data 注册数据
 */
export const registerByEmail = (data: RegisterByEmailPayload) => {
	return apiRequest<unknown>('/api/v1/tenant/email/register', data, 'POST')
}
