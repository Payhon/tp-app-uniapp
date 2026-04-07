import i18n from '@/lang/index'
import { isLoginType } from '@/store/login'

type NavigateMode = 'navigateTo' | 'redirectTo' | 'reLaunch'
declare function getCurrentPages(): Array<{ route?: string }>

export type EnsureLoggedInOptions = {
	showToast?: boolean
	navigateMode?: NavigateMode
}

const LOGIN_PAGE_URL = '/pages/login/login'

function isLoginPageActive(): boolean {
	try {
		const pages = getCurrentPages() as Array<{ route?: string }>
		const current = pages[pages.length - 1]
		return String(current?.route || '').trim() === 'pages/login/login'
	} catch (e) {}
	return false
}

function navigateToLogin(mode: NavigateMode) {
	if (isLoginPageActive()) return

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
