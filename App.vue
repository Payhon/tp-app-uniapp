<script setup lang="ts">
import { onHide, onLaunch, onShow, onTabBarMidButtonTap } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import api from '@/API/'
import { parseAddDeviceScanCode } from '@/common/device-provision/scan-code'

type AlarmPayload = {
	alarm_id?: string | number
	[key: string]: unknown
}

type PushMessage = {
	type?: 'receive' | 'click' | string
	data?: {
		title?: string
		content?: string
		payload?: AlarmPayload
		[key: string]: unknown
	}
	[key: string]: unknown
}

const { t } = useI18n()

const fetchAlarmInfo = async (url: string, headers?: Record<string, string>) => {
	// NOTE: 现有 apiRequest 额外入参会被忽略；这里保留形参以避免业务侧调用习惯变化
	const response = await (api as any).apiRequest(url, null, 'get', headers)
	return response && typeof (response as any).then === 'function' ? await response : response
}

const navigateToDetail = (data: unknown) => {
	uni.navigateTo({
		url: '/pages/notify/detail',
		success: (navRes) => {
			if (navRes.eventChannel) {
				navRes.eventChannel.emit('acceptData', { item: data })
			}
		}
	})
}

onLaunch(() => {
	// #ifdef APP-PLUS
	try {
		if (typeof uni.getPushClientId === 'function') {
			uni.getPushClientId({
				fail() {}
			})
		}
	} catch (e) {}
	// #endif
})

onShow(() => {
	// #ifdef APP-PLUS
	if (typeof uni.onPushMessage !== 'function') return
	uni.onPushMessage(async (res: PushMessage) => {
		if (res.type === 'receive') {
			uni.createPushMessage({
				title: res.data?.title,
				content: res.data?.content,
				payload: res.data?.payload
			})
			return
		}

		if (res.type === 'click') {
			const alarmId = res.data?.payload?.alarm_id
			const headers = {
				Authorization: `Bearer ${uni.getStorageSync('access_token')}`
			}
			const apiUrl = `/api/v1/alarm/info/history/${alarmId ?? ''}`
			try {
				const { code, data } = await fetchAlarmInfo(apiUrl, headers)
				if (code === 200) {
					navigateToDetail(data)
				} else {
					console.error('API request failed with code:', code)
				}
			} catch (error) {
				console.error('API request failed:', error)
			}
		}
	})
	// #endif
})

onHide(() => {
	// no-op
})

// #ifdef APP-PLUS
onTabBarMidButtonTap(() => {
	uni.showActionSheet({
		itemList: [t('pages.deviceProvision.bleSearch'), t('pages.deviceProvision.cameraScan')],
		success: (res) => {
			const idx = (res as any)?.tapIndex
			if (idx === 0) {
				uni.navigateTo({ url: '/pages/device-provision/ble-scan' })
				return
			}
			if (idx === 1) {
				uni.scanCode({
					success: (scanRes) => {
						const parsed = parseAddDeviceScanCode(String((scanRes as any)?.result ?? ''))
						if (!parsed) {
							uni.showToast({ title: t('pages.deviceProvision.invalidCode'), icon: 'none' })
							return
						}
						if (parsed.type === 'mac') {
							uni.navigateTo({ url: `/pages/device-provision/ble-scan?mode=qr&mac=${parsed.value}` })
							return
						}
						uni.navigateTo({ url: `/pages/device-provision/uuid-bind?uuid=${parsed.value}` })
					},
					fail: () => {
						// 用户取消扫码，不提示
					},
				})
			}
		},
		fail: () => {
			// 用户取消，不提示
		},
	})
})
// #endif
</script>

<style>
	/* 引入公共样式 */
	@import './common/styles/uni.css';
	/* 引入字体库样式 */
	@import './common/styles/icon.css';
	/* 引入动画库 */
	@import './common/styles/animate.css';
	/* 引入公共库样式 */
	@import './common/styles/util.css';
	/* */ 
	@import './common/styles/common.css';
</style>
