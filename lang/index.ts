import { createI18n } from 'vue-i18n'

import enUS from './en-US'
import zhCN from './zh-CN'
import { getSystemLanguage } from '@/common/platform'

export const AVAILABLE_LANGUAGES = [
	{ code: 'zh-CN', label: '中文' },
	{ code: 'en-US', label: 'English' }
] as const

export type SupportedLocale = (typeof AVAILABLE_LANGUAGES)[number]['code']

function normalizeLocale(raw: unknown): SupportedLocale {
	const rawLocale = String(raw || '').trim()
	if (!rawLocale) return 'en-US'
	const low = rawLocale.toLowerCase()
	if (low.startsWith('zh') || low === 'zh-cn') return 'zh-CN'
	if (rawLocale === 'en-US') return 'en-US'
	return 'en-US'
}

const systemLanguage = getSystemLanguage()
const locale = normalizeLocale(uni.getStorageSync('language') || systemLanguage || 'en-US')

const i18n = createI18n({
	legacy: false,
	globalInjection: true,
	locale,
	messages: {
		'en-US': enUS,
		'zh-CN': zhCN
	}
})

// Keep in sync with pages.json tabBar order
const TABBAR_I18N_KEYS = ['pages.deviceList', 'pages.intelligentControlTitle', 'pages.myAccount'] as const

// Keep in sync with pages.json tabBar list
const TABBAR_PAGE_PATHS = [
	'pages/fishery-monitor/fishery-monitor',
	'pages/intelligent-control/intelligent-control',
	'pages/ucenter/ucenter'
] as const

const isCurrentTabbarPage = () => {
	// MP-WEIXIN: wx.setTabBarItem 会在「非 tabBar 页面」调用时报错：setTabBarItem:fail not TabBar page
	// 这里做一层路由判断，避免启动在登录页等场景触发错误。
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const getPages = (globalThis as any)?.getCurrentPages as undefined | (() => any[])
		const pages = typeof getPages === 'function' ? (getPages() as any[]) : []
		const current = pages[pages.length - 1]
		const route = (current && (current.route || current.__route__)) as string | undefined
		if (!route) return false
		return (TABBAR_PAGE_PATHS as readonly string[]).includes(route)
	} catch (e) {
		return false
	}
}

export const updateTabbarText = () => {
	try {
		if (!uni || typeof uni.setTabBarItem !== 'function') return
		// #ifdef MP-WEIXIN
		if (!isCurrentTabbarPage()) return
		// #endif
		setTimeout(() => {
			TABBAR_I18N_KEYS.forEach((key, index) => {
				uni.setTabBarItem({
					index,
					text: i18n.global.t(key) as string
				})
			})
		}, 100)
	} catch (e) {}
}

export const changeLanguage = (nextLocale: SupportedLocale) => {
	i18n.global.locale.value = nextLocale
	uni.setStorageSync('language', nextLocale)
	updateTabbarText()
}

export default i18n
