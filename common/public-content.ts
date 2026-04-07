import $C from '@/common/config'

declare const plus: { runtime: { appid: string } }

export type PublicAppPagePath = 'privacy' | 'user-policy'

function normalizeLang(lang: string): string {
	const value = String(lang || '').trim().toLowerCase()
	if (value.startsWith('zh')) return 'zh-CN'
	if (value.startsWith('en')) return 'en-US'
	return 'zh-CN'
}

export function getRuntimeAppId(): string {
	// #ifdef APP-PLUS
	try {
		return plus.runtime.appid
	} catch (e) {}
	// #endif
	return $C.appId || uni.getStorageSync('app_appid') || ''
}

export function getRuntimeLang(): string {
	return normalizeLang(uni.getStorageSync('language') || 'zh-CN')
}

export function buildPublicAppPageUrl(pagePath: PublicAppPagePath, appid?: string, lang?: string): string {
	const resolvedAppId = String(appid || getRuntimeAppId() || '').trim()
	const resolvedLang = normalizeLang(lang || getRuntimeLang())
	const params = [`lang=${encodeURIComponent(resolvedLang)}`]
	if (resolvedAppId) {
		params.unshift(`appid=${encodeURIComponent(resolvedAppId)}`)
	}
	return `https://cloud.fjiaenergy.com/public/app/${pagePath}?${params.join('&')}`
}

export function openPublicAppPage(pagePath: PublicAppPagePath, title?: string): void {
	const targetUrl = buildPublicAppPageUrl(pagePath)
	const encodedUrl = encodeURIComponent(targetUrl)
	const encodedTitle = title ? `&title=${encodeURIComponent(title)}` : ''

	uni.navigateTo({
		url: `/pages/webViewPage/webViewPage?url=${encodedUrl}${encodedTitle}`
	})
}
