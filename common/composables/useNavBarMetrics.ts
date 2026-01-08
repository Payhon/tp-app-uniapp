import { ref } from 'vue'
import { getDeviceInfo, getWindowInfo } from '@/common/platform'

type WindowInfoLike = { statusBarHeight?: number; windowHeight?: number }
type DeviceInfoLike = { platform?: string }
type MenuButtonRectLike = { top?: number; height?: number }

export function useNavBarMetrics() {
	const topHeight = ref<string>('0px')
	const paddingTop = ref<string>('0px')
	const imgTop = ref<string>('0rpx')

	const init = () => {
		// #ifdef MP-WEIXIN
		const winInfo = getWindowInfo() as unknown as WindowInfoLike
		const devInfo = getDeviceInfo() as unknown as DeviceInfoLike
		const statusBarHeight = winInfo.statusBarHeight || 0
		const platform = devInfo.platform || ''

		uni.setStorageSync('pageHeight', `${winInfo.windowHeight || 0}px`)
		uni.setStorageSync('statusBarHeight', statusBarHeight)

		const { top, height } = uni.getMenuButtonBoundingClientRect() as unknown as MenuButtonRectLike
		uni.setStorageSync('menuButtonHeight', height ? height : 32)

		if (top && top !== 0 && height && height !== 0) {
			const navigationBarHeight = (top - statusBarHeight) * 2 + height
			uni.setStorageSync('navigationBarHeight', navigationBarHeight)
		} else {
			uni.setStorageSync('navigationBarHeight', platform === 'android' ? 48 : 40)
		}

		const navigationBarAndStatusBarHeight = `${uni.getStorageSync('statusBarHeight') + uni.getStorageSync('navigationBarHeight')}px`
		topHeight.value = navigationBarAndStatusBarHeight
		paddingTop.value = `${uni.getStorageSync('statusBarHeight') / 2}px`
		imgTop.value = `${uni.getStorageSync('statusBarHeight') + uni.getStorageSync('navigationBarHeight') - 40}rpx`
		uni.setStorageSync('contentPaddingTop', navigationBarAndStatusBarHeight)
		// #endif

		// #ifndef MP-WEIXIN
		const info = uni.getSystemInfoSync() as unknown as WindowInfoLike
		uni.setStorageSync('pageHeight', `${info.windowHeight || 0}px`)
		uni.setStorageSync('statusBarHeight', info.statusBarHeight || 0)
		// #endif
	}

	return { topHeight, paddingTop, imgTop, init }
}

