import api from '@/API/'

function isEmail(identifier) {
	return String(identifier || '').includes('@')
}

function normalizeIdentifier(identifier) {
	return String(identifier || '').trim()
}

function normalizePhoneNumber(identifier) {
	return normalizeIdentifier(identifier).replace(/\s+/g, '')
}

export const sendVerifyCode = (identifier, scene) => {
	const value = normalizeIdentifier(identifier)
	if (isEmail(value)) {
		return api.apiRequest('/api/v1/app/auth/email/code', { email: value, scene }, 'POST')
	}
	return api.apiRequest('/api/v1/app/auth/phone/code', { phone_prefix: '+86', phone_number: normalizePhoneNumber(value), scene }, 'POST')
}

export const loginByPassword = (identifier, password) => {
	return api.apiRequest('/api/v1/login', { email: normalizeIdentifier(identifier), password: String(password || '') }, 'POST')
}

export const wxmpLogin = (code) => {
	return api.apiRequest('/api/v1/app/auth/wxmp/login', { code }, 'POST')
}

export const registerByCode = (identifier, verifyCode, password) => {
	const value = normalizeIdentifier(identifier)
	const payload = { verify_code: String(verifyCode || ''), password: String(password || '') }
	if (isEmail(value)) {
		return api.apiRequest('/api/v1/app/auth/email/register', { ...payload, email: value }, 'POST')
	}
	return api.apiRequest('/api/v1/app/auth/phone/register', { ...payload, phone_prefix: '+86', phone_number: normalizePhoneNumber(value) }, 'POST')
}

export const resetPasswordByCode = (identifier, verifyCode, password) => {
	const value = normalizeIdentifier(identifier)
	const payload = { verify_code: String(verifyCode || ''), password: String(password || '') }
	if (isEmail(value)) {
		return api.apiRequest('/api/v1/app/auth/email/reset_password', { ...payload, email: value }, 'POST')
	}
	return api.apiRequest('/api/v1/app/auth/phone/reset_password', { ...payload, phone_prefix: '+86', phone_number: normalizePhoneNumber(value) }, 'POST')
}

