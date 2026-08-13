<script lang="ts">
import api from '@/API/'
import { syncCurrentUniLocale } from '@/lang'
import { useWarrantyReminderStore } from '@/store/warranty-reminder'
// #ifdef MP-WEIXIN
import {
	notifyWxMiniappAppHide,
	notifyWxMiniappAppShow,
	startWxMiniappUpdateCheck,
} from '@/common/wx-miniapp-update'
// #endif
// #ifdef APP-PLUS
import { showAddDeviceActionSheet } from '@/common/composables/useAddDeviceActionSheet'
// #endif
// APP 端自动检查更新（对接自建 backend，不依赖 uniCloud）
// #ifdef APP
import checkAppUpdate from '@/uni_modules/fjbms-upgrade/utils/check-update'
// #endif

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

export default {
	onLaunch() {
		// #ifdef MP-WEIXIN
		// 微信小程序新版本由微信下载；下载完成后提示用户确认并自动应用重启。
		try {
			startWxMiniappUpdateCheck()
		} catch (e) {}
		// #endif

		try {
			syncCurrentUniLocale()
		} catch (e) {}
		try {
			void useWarrantyReminderStore().refresh()
		} catch (e) {}

		// #ifdef APP-PLUS
		try {
			if (typeof uni.getPushClientId === 'function') {
				uni.getPushClientId({
					fail() {}
				})
			}
		} catch (e) {}
		// #endif

		// #ifdef APP
		// 启动自动检测升级（失败不阻断启动流程）
		try {
			checkAppUpdate().catch(() => {})
		} catch (e) {}
		// #endif
	},

	onShow() {
		// #ifdef MP-WEIXIN
		try {
			startWxMiniappUpdateCheck()
			notifyWxMiniappAppShow()
		} catch (e) {}
		// #endif

		try {
			void useWarrantyReminderStore().refresh()
		} catch (e) {}
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
	},

	onHide() {
		// #ifdef MP-WEIXIN
		try {
			notifyWxMiniappAppHide()
		} catch (e) {}
		// #endif
	},

	// #ifdef APP-PLUS
	onTabBarMidButtonTap() {
		showAddDeviceActionSheet()
	}
	// #endif
}
</script>

<style>
	/* 引入公共样式 */
	@import './common/styles/uni.css';
	/* 引入字体库样式 */
	@import './common/styles/icon.css';
	/* 引入公共库样式 */
	@import './common/styles/util.css';
	/* */ 
	@import './common/styles/common.css';
</style>
