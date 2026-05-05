import $C from '@/common/config'

export const IMAGE_CDN_PREFIX_STORAGE_KEY = 'imageCdnPrefix'

/**
 * CDN 前缀优先级：
 * 1) uni.getStorageSync(imageCdnPrefix)（便于灰度/动态切换）
 * 2) common/config.ts 的 imageCdnPrefix（建议按环境配置）
 *
 * 约定：CDN 上的资源路径与项目内保持一致，例如：
 * - 本地：/static/image/bg@2x.png
 * - CDN： https://cdn.example.com/static/image/bg@2x.png
 */

/**
 * 仅收录 >100KB 的图片（小程序下走 CDN，避免包体积超限）
 * key 使用相对 static/image 的路径，便于直接替换与检索。
 */
export const LARGE_IMAGE_PATH_MAP = {
	'bg@2x.png': '/static/image/bg@2x.png',
	'device/device-top@2x.png': '/static/image/device/device-top@2x.png',
	'home/home-top@2x.png': '/static/image/home/home-top@2x.png',
	'my/my-top-1@2x.png': '/static/image/my/my-top-1@2x.png',
	'my/my-top-2@2x.png': '/static/image/my/my-top-2@2x.png'
} as const

// 微信小程序下首页顶部图使用专用素材，避免不同端的裁切/适配差异。
const MP_WEIXIN_IMAGE_OVERRIDE_MAP = {
	'home/home-top@2x.png': 'home/home-top-miniapp@2x.png'
} as const

export type LargeImageKey = keyof typeof LARGE_IMAGE_PATH_MAP

const trimSlashesRight = (s: string) => s.replace(/\/+$/, '')

const joinUrl = (prefix: string, pathname: string) => {
	const p = trimSlashesRight(String(prefix || '').trim())
	if (!p) return pathname
	const path = pathname.startsWith('/') ? pathname : `/${pathname}`
	return `${p}${path}`
}

export const getImageCdnPrefix = (): string => {
	try {
		const v = uni.getStorageSync(IMAGE_CDN_PREFIX_STORAGE_KEY)
		if (typeof v === 'string' && v.trim()) return v.trim()
	} catch (e) {}
	return String($C.imageCdnPrefix || '').trim()
}

const toLargeKeyFromLocalPath = (localPath: string): LargeImageKey | null => {
	const p = String(localPath || '')
	const prefix = '/static/image/'
	if (!p.startsWith(prefix)) return null
	const rel = p.slice(prefix.length)
	return (rel in LARGE_IMAGE_PATH_MAP ? (rel as LargeImageKey) : null)
}

/**
 * 图片资源入口：
 * - 传 LargeImageKey（推荐）：$img('bg@2x.png')
 * - 或传本地路径：$img('/static/image/bg@2x.png')
 *
 * 在 MP-WEIXIN 下，仅对 >100KB 的图片替换为 CDN 地址；其余仍使用本地 static。
 */
export const imageUrl = (keyOrPath: LargeImageKey | string): string => {
	const k = String(keyOrPath || '').trim()
	const localPath = (k in LARGE_IMAGE_PATH_MAP ? LARGE_IMAGE_PATH_MAP[k as LargeImageKey] : k) || ''
	const largeKey = (k in LARGE_IMAGE_PATH_MAP ? (k as LargeImageKey) : toLargeKeyFromLocalPath(localPath))

	// #ifdef MP-WEIXIN
	if (k in MP_WEIXIN_IMAGE_OVERRIDE_MAP) {
		const cdnPrefix = getImageCdnPrefix()
		return joinUrl(cdnPrefix, `/static/image/${MP_WEIXIN_IMAGE_OVERRIDE_MAP[k as keyof typeof MP_WEIXIN_IMAGE_OVERRIDE_MAP]}`)
	}
	if (largeKey) {
		const cdnPrefix = getImageCdnPrefix()
		return joinUrl(cdnPrefix, LARGE_IMAGE_PATH_MAP[largeKey])
	}
	// #endif

	return localPath
}
