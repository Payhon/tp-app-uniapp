import i18n from '@/lang/index'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'

type PageLike = { route?: string; __route__?: string }

declare function getCurrentPages(): PageLike[]

const LOGIN_PAGE_URL = '/pages/login/login'
const LOGIN_ROUTE = 'pages/login/login'
const EMPTY_TOKEN_MARK = '__empty_auth_token__'

const AUTH_STORAGE_KEYS = [
	'access_token',
	'accessToken',
	'refreshToken',
	'tenant_id',
	'push_id',
	'userWxInfo',
	'isAuth',
	'__BOUND_DEVICES_SNAPSHOT__',
]

const AUTH_EXPIRED_HTTP_STATUS = new Set([401, 402, 403])
const AUTH_EXPIRED_API_CODES = new Set([401, 402, 403, 40100, 40101, 40102, 40103, 40104])

const PUBLIC_ENDPOINTS: Array<{ path: string; methods?: string[]; prefix?: boolean }> = [
	{ path: '/api/v1/login', methods: ['POST'] },
	{ path: '/api/v1/login/captcha', methods: ['GET'] },
	{ path: '/api/v1/verification/code', methods: ['GET'] },
	{ path: '/api/v1/reset/password', methods: ['POST'] },
	{ path: '/api/v1/tenant/email/register', methods: ['POST'] },
	{ path: '/api/v1/app/auth/email/code', methods: ['POST'] },
	{ path: '/api/v1/app/auth/phone/code', methods: ['POST'] },
	{ path: '/api/v1/app/auth/phone/login_by_code', methods: ['POST'] },
	{ path: '/api/v1/app/auth/email/login_by_code', methods: ['POST'] },
	{ path: '/api/v1/app/auth/phone/register', methods: ['POST'] },
	{ path: '/api/v1/app/auth/email/register', methods: ['POST'] },
	{ path: '/api/v1/app/auth/phone/reset_password', methods: ['POST'] },
	{ path: '/api/v1/app/auth/email/reset_password', methods: ['POST'] },
	{ path: '/api/v1/app/auth/wxmp/login', methods: ['POST'] },
	{ path: '/api/v1/app/content/', methods: ['GET'], prefix: true },
	{ path: '/api/v1/app/public/info', methods: ['GET'] },
	{ path: '/api/v1/app/wxmp/runtime', methods: ['GET'] },
	{ path: '/api/v1/app/upgrade/check', methods: ['POST'] },
]

let handledExpiredToken = ''
let sessionExpiredModalOpen = false

function readToken(): string {
	try {
		return String(uni.getStorageSync('access_token') || uni.getStorageSync('accessToken') || '').trim()
	} catch (e) {}
	return ''
}

function getPagesSafe(): PageLike[] {
	try {
		return getCurrentPages() || []
	} catch (e) {}
	return []
}

function currentRoute(): string {
	const pages = getPagesSafe()
	const current = pages[pages.length - 1]
	return String(current?.route || current?.__route__ || '').trim()
}

function isLoginPageActive(): boolean {
	return currentRoute() === LOGIN_ROUTE
}

function hasLoginPageInStack(): boolean {
	return getPagesSafe().some((page) => String(page?.route || page?.__route__ || '').trim() === LOGIN_ROUTE)
}

function clearAuthStorage() {
	for (const key of AUTH_STORAGE_KEYS) {
		try {
			uni.removeStorageSync(key)
		} catch (e) {}
	}
}

function clearAuthStores() {
	try {
		useTokenStore().clearToken()
	} catch (e) {}
	try {
		useUserStore().logout()
	} catch (e) {}
	try {
		uni.$emit('auth:session-expired')
	} catch (e) {}
}

function navigateToLogin() {
	if (isLoginPageActive()) return
	if (hasLoginPageInStack()) {
		uni.redirectTo({
			url: LOGIN_PAGE_URL,
			fail: () => uni.reLaunch({ url: LOGIN_PAGE_URL }),
		})
		return
	}
	uni.reLaunch({ url: LOGIN_PAGE_URL })
}

function normalizeMethod(method?: unknown): string {
	return String(method || 'GET').trim().toUpperCase()
}

function normalizePath(url?: unknown): string {
	const raw = String(url || '').trim()
	if (!raw) return ''
	const withoutHash = raw.split('#')[0]
	const withoutQuery = withoutHash.split('?')[0]
	const apiIndex = withoutQuery.indexOf('/api/v1/')
	if (apiIndex >= 0) return withoutQuery.slice(apiIndex)
	return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
}

export function isPublicAuthBypassUrl(url?: unknown, method?: unknown): boolean {
	const path = normalizePath(url)
	const requestMethod = normalizeMethod(method)
	return PUBLIC_ENDPOINTS.some((item) => {
		const pathMatches = item.prefix ? path.startsWith(item.path) : path === item.path
		if (!pathMatches) return false
		if (!item.methods || item.methods.length === 0) return true
		return item.methods.includes(requestMethod)
	})
}

export function isAuthExpiredStatus(statusCode?: unknown): boolean {
	return AUTH_EXPIRED_HTTP_STATUS.has(Number(statusCode))
}

export function isAuthExpiredCode(code?: unknown): boolean {
	return AUTH_EXPIRED_API_CODES.has(Number(code))
}

export function isAuthExpiredApiResponse(payload: unknown): boolean {
	if (!payload || typeof payload !== 'object') return false
	return isAuthExpiredCode((payload as { code?: unknown }).code)
}

export function shouldHandleSessionExpiredResponse(response: unknown): boolean {
	const res = (response || {}) as { statusCode?: unknown; config?: { url?: unknown; method?: unknown } }
	if (!isAuthExpiredStatus(res.statusCode)) return false
	return !isPublicAuthBypassUrl(res.config?.url, res.config?.method)
}

export function handleSessionExpired(): boolean {
	const token = readToken()
	const tokenMark = token || EMPTY_TOKEN_MARK
	if (sessionExpiredModalOpen || (handledExpiredToken && (!token || handledExpiredToken === tokenMark))) {
		return true
	}

	handledExpiredToken = tokenMark
	clearAuthStorage()
	clearAuthStores()

	if (isLoginPageActive()) return true

	sessionExpiredModalOpen = true
	uni.showModal({
		title: i18n.global.t('common.tip') as string,
		content: i18n.global.t('auth.sessionExpired') as string,
		showCancel: false,
		success: () => {
			sessionExpiredModalOpen = false
			navigateToLogin()
		},
		fail: () => {
			sessionExpiredModalOpen = false
			navigateToLogin()
		},
	})
	return true
}
