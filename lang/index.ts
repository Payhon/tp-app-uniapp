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
	if (low === 'en') return 'en-US'
	if (rawLocale === 'en-US') return 'en-US'
	return 'en-US'
}

function toUniLocale(nextLocale: SupportedLocale): string {
	// uni-app 内置 i18n 的 locale 形态通常为 `zh-Hans` / `en`
	return nextLocale === 'zh-CN' ? 'zh-Hans' : 'en'
}

const systemLanguage = getSystemLanguage()
const locale = normalizeLocale(uni.getStorageSync('language') || systemLanguage || 'zh-CN')

try {
	// 启动时同步 uni-app 内置 locale，保证 pages.json `%xxx%` 占位符从一开始就正常解析
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const setLocale = (uni as any)?.setLocale as undefined | ((locale: string) => void)
	if (typeof setLocale === 'function') setLocale(toUniLocale(locale))
} catch (e) {}

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
const TABBAR_I18N_MAP = [
	{ index: 0, key: 'pages.home' },
	{ index: 1, key: 'pages.addDevice' },
	{ index: 2, key: 'pages.myAccount' }
] as const

// Keep in sync with pages.json tabBar list
const TABBAR_PAGE_PATHS = ['pages/home/home', 'pages/tabbar/mid', 'pages/my/my'] as const

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
			TABBAR_I18N_MAP.forEach(({ index, key }) => {
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
	try {
		// 同步 uni-app 内置 locale，保证 pages.json `%xxx%` 占位符（含 tabBar midButton）正常解析
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const setLocale = (uni as any)?.setLocale as undefined | ((locale: string) => void)
		if (typeof setLocale === 'function') setLocale(toUniLocale(nextLocale))
	} catch (e) {}
	updateTabbarText()
}

export default i18n
