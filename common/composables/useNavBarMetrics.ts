import { ref } from 'vue'
import { getDeviceInfo, getWindowInfo } from '@/common/platform'

type WindowInfoLike = { statusBarHeight?: number; windowHeight?: number }
type DeviceInfoLike = { platform?: string }
type MenuButtonRectLike = { top?: number; height?: number }

export function useNavBarMetrics() {
	const topHeight = ref<string>('0px')
	const statusBarHeightPx = ref<string>('0px')
	const navBarHeightPx = ref<string>('0px')

	const init = () => {
		// #ifdef MP-WEIXIN
		{
			const winInfo = getWindowInfo() as unknown as WindowInfoLike
			const devInfo = getDeviceInfo() as unknown as DeviceInfoLike
			const mpStatusBarHeight = winInfo.statusBarHeight || 0
			const mpPlatform = devInfo.platform || ''

			uni.setStorageSync('pageHeight', `${winInfo.windowHeight || 0}px`)
			uni.setStorageSync('statusBarHeight', mpStatusBarHeight)

			const { top, height } = uni.getMenuButtonBoundingClientRect() as unknown as MenuButtonRectLike
			uni.setStorageSync('menuButtonHeight', height ? height : 32)

			if (top && top !== 0 && height && height !== 0) {
				const navigationBarHeight = (top - mpStatusBarHeight) * 2 + height
				uni.setStorageSync('navigationBarHeight', navigationBarHeight)
			} else {
				uni.setStorageSync('navigationBarHeight', mpPlatform === 'android' ? 48 : 40)
			}

			const statusBarHeight = Number(uni.getStorageSync('statusBarHeight') || 0)
			const navBarHeight = Number(uni.getStorageSync('navigationBarHeight') || 0)
			const total = `${statusBarHeight + navBarHeight}px`
			statusBarHeightPx.value = `${statusBarHeight}px`
			navBarHeightPx.value = `${navBarHeight}px`
			topHeight.value = total
			uni.setStorageSync('contentPaddingTop', total)
		}
		// #endif

		// #ifndef MP-WEIXIN
		{
			const info = uni.getSystemInfoSync() as any as WindowInfoLike & DeviceInfoLike
			const sysStatusBarHeight = info.statusBarHeight || 0
			const sysPlatform = (info as any)?.platform || ''
			const navBarHeight = sysPlatform === 'android' ? 48 : 44

			uni.setStorageSync('pageHeight', `${info.windowHeight || 0}px`)
			uni.setStorageSync('statusBarHeight', sysStatusBarHeight)
			uni.setStorageSync('navigationBarHeight', navBarHeight)

			const total = `${sysStatusBarHeight + navBarHeight}px`
			statusBarHeightPx.value = `${sysStatusBarHeight}px`
			navBarHeightPx.value = `${navBarHeight}px`
			topHeight.value = total
			uni.setStorageSync('contentPaddingTop', total)
		}
		// #endif
	}

	return { topHeight, statusBarHeightPx, navBarHeightPx, init }
}
