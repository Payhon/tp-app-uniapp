import i18n from '@/lang/index'
import { isLoginType } from '@/store/login'

type NavigateMode = 'navigateTo' | 'redirectTo' | 'reLaunch'
declare function getCurrentPages(): Array<{ route?: string }>

export type EnsureLoggedInOptions = {
	showToast?: boolean
	navigateMode?: NavigateMode
}

const LOGIN_PAGE_URL = '/pages/login/login'
const LOGIN_ROUTE = 'pages/login/login'
const LOGIN_NAV_LOCK_MS = 1200

let lastLoginNavAt = 0

function getPagesSafe(): Array<{ route?: string }> {
	try {
		return getCurrentPages() as Array<{ route?: string }>
	} catch (e) {}
	return []
}

function isLoginPageActive(): boolean {
	const pages = getPagesSafe()
	const current = pages[pages.length - 1]
	return String(current?.route || '').trim() === LOGIN_ROUTE
}

function hasLoginPageInStack(): boolean {
	return getPagesSafe().some((page) => String(page?.route || '').trim() === LOGIN_ROUTE)
}

function navigateToLogin(mode: NavigateMode) {
	if (isLoginPageActive()) return
	const now = Date.now()
	if (now - lastLoginNavAt < LOGIN_NAV_LOCK_MS) return
	lastLoginNavAt = now
	if (hasLoginPageInStack() && mode === 'navigateTo') return

	if (mode === 'redirectTo') {
		uni.redirectTo({ url: LOGIN_PAGE_URL, fail: () => uni.navigateTo({ url: LOGIN_PAGE_URL }) })
		return
	}
	if (mode === 'reLaunch') {
		uni.reLaunch({ url: LOGIN_PAGE_URL })
		return
	}
	uni.navigateTo({ url: LOGIN_PAGE_URL })
}

export function isUserLoggedIn(): boolean {
	return !!isLoginType()?.isLogin
}

export function ensureLoggedIn(options: EnsureLoggedInOptions = {}): boolean {
	if (isUserLoggedIn()) return true

	if (options.showToast !== false) {
		uni.showToast({ title: i18n.global.t('pages.pleaseLogin') as string, icon: 'none' })
	}

	navigateToLogin(options.navigateMode || 'navigateTo')
	return false
}
