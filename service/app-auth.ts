import api from '@/API/'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(
	url: string,
	data: unknown,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string
) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

function isEmail(identifier: unknown) {
	return String(identifier || '').includes('@')
}

function normalizeIdentifier(identifier: unknown) {
	return String(identifier || '').trim()
}

function normalizePhoneNumber(identifier: unknown) {
	return normalizeIdentifier(identifier).replace(/\s+/g, '')
}

export const sendVerifyCode = (identifier: string, scene: string | number) => {
	const value = normalizeIdentifier(identifier)
	if (isEmail(value)) {
		return apiRequest<unknown>('/api/v1/app/auth/email/code', { email: value, scene }, 'POST')
	}
	return apiRequest<unknown>(
		'/api/v1/app/auth/phone/code',
		{ phone_prefix: '+86', phone_number: normalizePhoneNumber(value), scene },
		'POST'
	)
}

export const fetchLoginCaptcha = () => {
	return apiRequest<{ captcha_id?: string; captcha_image?: string; expires_in?: number }>(
		'/api/v1/login/captcha',
		{},
		'GET'
	)
}

export const loginByPassword = (
	identifier: string,
	password: string,
	captchaId: string,
	captchaCode: string
) => {
	return apiRequest<unknown>(
		'/api/v1/login',
		{
			email: normalizeIdentifier(identifier),
			password: String(password || ''),
			captcha_id: String(captchaId || '').trim(),
			captcha_code: String(captchaCode || '').trim()
		},
		'POST'
	)
}

export const wxmpLogin = (code: string) => {
	return apiRequest<unknown>('/api/v1/app/auth/wxmp/login', { code }, 'POST')
}

export const registerByCode = (identifier: string, verifyCode: string, password: string) => {
	const value = normalizeIdentifier(identifier)
	const payload = { verify_code: String(verifyCode || ''), password: String(password || '') }
	if (isEmail(value)) {
		return apiRequest<unknown>('/api/v1/app/auth/email/register', { ...payload, email: value }, 'POST')
	}
	return apiRequest<unknown>(
		'/api/v1/app/auth/phone/register',
		{ ...payload, phone_prefix: '+86', phone_number: normalizePhoneNumber(value) },
		'POST'
	)
}

export const resetPasswordByCode = (identifier: string, verifyCode: string, password: string) => {
	const value = normalizeIdentifier(identifier)
	const payload = { verify_code: String(verifyCode || ''), password: String(password || '') }
	if (isEmail(value)) {
		return apiRequest<unknown>('/api/v1/app/auth/email/reset_password', { ...payload, email: value }, 'POST')
	}
	return apiRequest<unknown>(
		'/api/v1/app/auth/phone/reset_password',
		{ ...payload, phone_prefix: '+86', phone_number: normalizePhoneNumber(value) },
		'POST'
	)
}

export const deleteCurrentAccount = (password: string) => {
	return apiRequest<unknown>('/api/v1/app/auth/delete_account', { password: String(password || '') }, 'POST')
}
