<template>
	<view class="my-page">
		<view class="top-bg">
			<image class="bg-layer-1" src="/static/image/my/my-top-1@2x.png" mode="aspectFill" />
			<image class="bg-layer-2" src="/static/image/my/my-top-2@2x.png" mode="aspectFill" />
		</view>

		<view class="content">
			<view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
				<view class="user-row">
					<view class="user" hover-class="user--hover" @tap="handleUserClick">
						<image class="avatar" :src="avatarSrc" mode="aspectFill" />
						<view class="user-text">
							<text class="user-name">{{ displayName }}</text>
							<text class="user-phone">{{ displayPhone }}</text>
						</view>
					</view>

					<view class="setting-btn" hover-class="setting-btn--hover" @tap="goSetting">
						<image class="setting-icon" src="/static/image/my/icon-setting@2x.png" mode="aspectFit" />
					</view>
				</view>

				<view class="stats">
					<view class="stat">
						<text class="stat-value">{{ deviceCountText }}</text>
						<text class="stat-label">{{ $t('pages.my.boundDeviceCountLabel') }}</text>
					</view>
					<view class="stat stat--right">
						<text class="stat-value">{{ registeredAtText }}</text>
						<text class="stat-label">{{ $t('pages.my.registeredAtLabel') }}</text>
					</view>
				</view>
			</view>

			<view class="menu-card">
				<view class="menu-item menu-item--switch" hover-class="menu-item--hover" @tap="goBluetooth">
					<view class="menu-left">
						<image class="menu-icon" src="/static/image/my/icon-bluetooth@2x.png" mode="aspectFit" />
						<text class="menu-title">{{ $t('pages.my.bluetoothAutoConnect') }}</text>
					</view>
					<view @tap.stop>
						<u-switch
							v-model="bluetoothAutoConnect"
							:activeColor="'#0B3BFF'"
							:inactiveColor="'#E6E7EB'"
							:size="24"
							@change="onBluetoothAutoConnectChange"
						></u-switch>
					</view>
				</view>

				<view class="menu-divider"></view>

				<view class="menu-item" hover-class="menu-item--hover" @tap="openLangSheet">
					<view class="menu-left">
						<image class="menu-icon" src="/static/image/my/icon-lang@2x.png" mode="aspectFit" />
						<text class="menu-title">{{ $t('ucenter.language') }}</text>
					</view>
					<view class="menu-right">
						<text class="menu-right-text">{{ currentLangLabel }}</text>
						<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
					</view>
				</view>

				<view class="menu-divider"></view>

				<view class="menu-item" hover-class="menu-item--hover" @tap="goHelpFeedback">
					<view class="menu-left">
						<image class="menu-icon" src="/static/image/my/icon-help@2x.png" mode="aspectFit" />
						<text class="menu-title">{{ $t('pages.my.helpFeedback') }}</text>
					</view>
					<view class="menu-right">
						<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
					</view>
				</view>

				<view class="menu-divider"></view>

				<view class="menu-item" hover-class="menu-item--hover" @tap="goContact">
					<view class="menu-left">
						<image class="menu-icon" src="/static/image/my/icon-contact@2x.png" mode="aspectFit" />
						<text class="menu-title">{{ $t('pages.my.contact') }}</text>
					</view>
					<view class="menu-right">
						<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
					</view>
				</view>

				<view class="menu-divider"></view>

				<view class="menu-item" hover-class="menu-item--hover" @tap="clearCache">
					<view class="menu-left">
						<image class="menu-icon" src="/static/image/my/icon-clear@2x.png" mode="aspectFit" />
						<text class="menu-title">{{ $t('pages.my.clearCache') }}</text>
					</view>
					<view class="menu-right">
						<text class="menu-right-text">{{ $t('pages.my.oneTapClear') }}</text>
						<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
					</view>
				</view>

				<view class="menu-divider"></view>

				<view class="menu-item" hover-class="menu-item--hover" @tap="goAbout">
					<view class="menu-left">
						<image class="menu-icon" src="/static/image/my/icon-about@2x.png" mode="aspectFit" />
						<text class="menu-title">{{ $t('pages.my.about') }}</text>
					</view>
					<view class="menu-right">
						<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>

			</view>
		</view>
	</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/user'
import { useInjected } from '@/common/composables/useInjected'
import { deviceList } from '@/service/device'
import { AVAILABLE_LANGUAGES, changeLanguage, type SupportedLocale } from '@/lang/index'

const { t, locale } = useI18n()
const userStore = useUserStore()
const { apiRequest, login } = useInjected()

const defaultAvatar = '/static/image/my/avatar-default@2x.png'
const STORAGE_BT_AUTO_CONNECT = 'bluetoothAutoConnect'

const statusBarHeight = ref(0)
const deviceCount = ref(0)
const loadingDeviceCount = ref(false)

const bluetoothAutoConnect = ref<boolean>(true)

const isLoggedIn = ref<boolean>(false)
const refreshLoginState = () => {
	isLoggedIn.value = login?.isLoginType?.()?.isLogin ?? false
}

const userInfo = computed(() => userStore.userInfo)

const avatarUrl = computed(() => {
	const raw = (userInfo.value as unknown as { avatar_url?: string } | null)?.avatar_url
	if (!raw) return defaultAvatar
	const serverUrl = String(uni.getStorageSync('serverAddress') || '')
	const baseUrl = serverUrl ? serverUrl.replace('/api/v1', '') : ''
	return baseUrl + '/' + String(raw)
})

const avatarSrc = computed(() => {
	if (isLoggedIn.value && (userInfo.value as any)?.avatar_url) return avatarUrl.value
	return defaultAvatar
})

const displayName = computed(() => {
	if (!isLoggedIn.value) return t('pages.my.notLoggedIn')
	const username = String(userInfo.value?.name || '').trim()
	// #ifdef MP-WEIXIN
	const u = userInfo.value as any
	const additional = u?.additional_info ?? u?.additionalInfo
	let wxNick = ''
	try {
		const obj = typeof additional === 'string' ? JSON.parse(additional) : additional
		wxNick = String(obj?.wx_profile?.nick_name || '').trim()
	} catch (e) {
		wxNick = ''
	}
	// #endif
	// #ifndef MP-WEIXIN
	const wxNick = ''
	// #endif
	return username || wxNick || t('pages.my.defaultName')
})

const displayPhone = computed(() => {
	if (!isLoggedIn.value) return t('pages.my.loginHint')
	const mobile = String(userInfo.value?.mobile || '').trim()
	if (mobile) return mobile
	return t('pages.my.phoneUnset')
})

const deviceCountText = computed(() => {
	if (!isLoggedIn.value) return '0'
	return String(Math.max(0, deviceCount.value || 0))
})

const formatYmd = (input: unknown): string | null => {
	if (input === null || input === undefined) return null
	if (typeof input === 'number') {
		const ms = input > 1e12 ? input : input * 1000
		const d = new Date(ms)
		if (Number.isNaN(d.getTime())) return null
		const yyyy = d.getFullYear()
		const mm = String(d.getMonth() + 1).padStart(2, '0')
		const dd = String(d.getDate()).padStart(2, '0')
		return `${yyyy}.${mm}.${dd}`
	}
	const s = String(input).trim()
	if (!s) return null
	if (/^\d{4}\.\d{2}\.\d{2}$/.test(s)) return s
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.replaceAll('-', '.')
	const d = new Date(s)
	if (Number.isNaN(d.getTime())) return null
	const yyyy = d.getFullYear()
	const mm = String(d.getMonth() + 1).padStart(2, '0')
	const dd = String(d.getDate()).padStart(2, '0')
	return `${yyyy}.${mm}.${dd}`
}

const registeredAtText = computed(() => {
	if (!isLoggedIn.value) return '--'
	const u = userInfo.value as Record<string, unknown> | null
	const raw = u?.created_at ?? u?.createdAt ?? u?.created_time ?? u?.createdTime ?? u?.register_time ?? u?.registerTime
	return formatYmd(raw) || '--'
})

const currentLangLabel = computed(() => {
	const cur = String(locale.value || '').trim() as SupportedLocale
	const hit = AVAILABLE_LANGUAGES.find((x) => x.code === cur)
	return hit?.label || AVAILABLE_LANGUAGES[0].label
})

const setMpTabSelected = () => {
	// #ifdef MP-WEIXIN
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pages = (globalThis as any).getCurrentPages?.() as any[] | undefined
		const current = pages && pages.length ? pages[pages.length - 1] : null
		const tabBar = current?.getTabBar?.()
		tabBar?.setSelected?.(1)
	} catch (e) {}
	// #endif
}

const refreshMpCustomTabbarTexts = () => {
	// #ifdef MP-WEIXIN
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pages = (globalThis as any).getCurrentPages?.() as any[] | undefined
		const current = pages && pages.length ? pages[pages.length - 1] : null
		const tabBar = current?.getTabBar?.()
		tabBar?.updateTexts?.()
	} catch (e) {}
	// #endif
}

const loadDeviceCount = async () => {
	if (loadingDeviceCount.value) return
	if (!isLoggedIn.value) {
		deviceCount.value = 0
		return
	}
	loadingDeviceCount.value = true
	try {
		const rsp = await deviceList({ page: 1, page_size: 1 })
		if (!rsp || (rsp as any).code !== 200) {
			deviceCount.value = 0
			return
		}

		const total = Number((rsp as any).data?.total)
		if (Number.isFinite(total)) {
			deviceCount.value = Math.max(0, total)
			return
		}

		const list = (rsp as any).data?.list
		deviceCount.value = Array.isArray(list) ? list.length : 0
	} catch (e) {
		deviceCount.value = 0
	} finally {
		loadingDeviceCount.value = false
	}
}

const loadUserInfo = async () => {
	if (!apiRequest) return
	if (!isLoggedIn.value) return
	try {
		const res = await apiRequest<Record<string, unknown>>('/api/v1/user/detail', {}, 'get')
		if (res && (res as any).code === 200 && (res as any).data) {
			userStore.setUserInfo((res as any).data as any)
		}
	} catch {}
}

onLoad(() => {
	try {
		const sys = uni.getSystemInfoSync()
		statusBarHeight.value = Number(sys?.statusBarHeight || 0)
	} catch (e) {
		statusBarHeight.value = 0
	}

	// #ifdef MP-WEIXIN
	// 微信小程序：顶部胶囊按钮会覆盖页面，使用胶囊 bottom 作为额外安全区，将整体内容下移
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const rect =
			((uni as any).getMenuButtonBoundingClientRect?.() as { bottom?: number } | undefined) ||
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			((wx as any)?.getMenuButtonBoundingClientRect?.() as { bottom?: number } | undefined)
		const bottom = Number(rect?.bottom || 0)
		if (bottom > 0) statusBarHeight.value = Math.max(statusBarHeight.value, bottom)
	} catch (e) {}
	// #endif

	const raw = uni.getStorageSync(STORAGE_BT_AUTO_CONNECT)
	if (raw === '' || raw === undefined || raw === null) {
		bluetoothAutoConnect.value = true
	} else {
		bluetoothAutoConnect.value = Boolean(Number(raw))
	}
})

onShow(() => {
	uni.setStorageSync('__last_tab_url__', '/pages/my/my')
	refreshLoginState()
	setMpTabSelected()
	loadUserInfo()
	loadDeviceCount()
})

const handleUserClick = () => {
	if (!isLoggedIn.value) {
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	uni.navigateTo({ url: '/pages/my/setting/index' })
}

const goSetting = () => {
	uni.navigateTo({ url: '/pages/my/setting/index' })
}

const goBluetooth = () => {
	uni.navigateTo({ url: '/pages/my/bluetooth/index' })
}

const goHelpFeedback = () => {
	uni.navigateTo({ url: '/pages/my/help-feedback/index' })
}

const goContact = () => {
	uni.navigateTo({ url: '/pages/my/contact/index' })
}

const goAbout = () => {
	uni.navigateTo({ url: '/pages/my/about/index' })
}

const onBluetoothAutoConnectChange = (val: boolean) => {
	bluetoothAutoConnect.value = Boolean(val)
	uni.setStorageSync(STORAGE_BT_AUTO_CONNECT, bluetoothAutoConnect.value ? 1 : 0)
}

const openLangSheet = () => {
	uni.showActionSheet({
		itemList: AVAILABLE_LANGUAGES.map((x) => x.label),
		success: (res) => {
			const selected = AVAILABLE_LANGUAGES[res.tapIndex]
			if (!selected) return
			changeLanguage(selected.code)
			locale.value = selected.code
			refreshMpCustomTabbarTexts()
		}
	})
}

const clearCache = () => {
	uni.showModal({
		title: t('common.tip'),
		content: t('pages.my.clearCacheConfirm'),
		cancelText: t('common.cancel'),
		confirmText: t('common.confirm'),
		success: (res) => {
			if (!res.confirm) return
			uni.showLoading({ title: t('common.loading') })
			const token = uni.getStorageSync('access_token')
			const accessToken = uni.getStorageSync('accessToken')
			const refreshToken = uni.getStorageSync('refreshToken')
			const serverAddress = uni.getStorageSync('serverAddress')
			const language = uni.getStorageSync('language')
			const btAutoConnect = uni.getStorageSync(STORAGE_BT_AUTO_CONNECT)
			uni.clearStorageSync()
			if (token) uni.setStorageSync('access_token', token)
			if (accessToken) uni.setStorageSync('accessToken', accessToken)
			if (refreshToken) uni.setStorageSync('refreshToken', refreshToken)
			if (serverAddress) uni.setStorageSync('serverAddress', serverAddress)
			if (language) uni.setStorageSync('language', language)
			if (btAutoConnect !== '' && btAutoConnect !== null && btAutoConnect !== undefined) {
				uni.setStorageSync(STORAGE_BT_AUTO_CONNECT, btAutoConnect)
				bluetoothAutoConnect.value = Boolean(Number(btAutoConnect))
			}
			uni.hideLoading()
			uni.showToast({ title: t('pages.my.clearCacheSuccess'), icon: 'success' })
		}
	})
}
</script>

<script lang="ts">
import { showAddDeviceActionSheet } from '@/common/composables/useAddDeviceActionSheet'

export default {
	// #ifdef APP-PLUS
	onTabBarMidButtonTap() {
		showAddDeviceActionSheet()
	}
	// #endif
}
</script>

<style lang="scss" scoped>
.my-page {
	min-height: 100vh;
	background-color: #f5f6f8;
	position: relative;
	padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.top-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 520rpx;
	overflow: hidden;

	.bg-layer-1 {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.bg-layer-2 {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.95;
	}
}

.content {
	position: relative;
	z-index: 2;
	padding: 0 30rpx;
}

.header {
	padding: 32rpx 0 0;
	color: #fff;
}

.user-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
}

.user {
	display: flex;
	align-items: center;
}

.user--hover {
	opacity: 0.9;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 60rpx;
	background-color: rgba(255, 255, 255, 0.6);
	border: 4rpx solid rgba(255, 255, 255, 0.8);
}

.user-text {
	margin-left: 20rpx;
}

.user-name {
	display: block;
	font-size: 36rpx;
	font-weight: 600;
	line-height: 1.2;
	color: #ffffff;
}

.user-phone {
	display: block;
	font-size: 26rpx;
	margin-top: 10rpx;
	line-height: 1.2;
	color: rgba(255, 255, 255, 0.85);
}

.setting-btn {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.setting-btn--hover {
	opacity: 0.9;
}

.setting-icon {
	width: 44rpx;
	height: 44rpx;
}

.stats {
	margin-top: 36rpx;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: 0 4rpx;
}

.stat {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.stat--right {
	align-items: flex-end;
}

.stat-value {
	font-size: 34rpx;
	font-weight: 600;
	line-height: 1.2;
	color: #ffffff;
}

.stat-label {
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.2;
	color: rgba(255, 255, 255, 0.85);
}

.menu-card {
	margin-top: 34rpx;
	background-color: #ffffff;
	border-radius: 24rpx;
	box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.menu-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 40rpx 24rpx;
	background-color: #ffffff;
}

.menu-item--hover {
	background-color: rgba(0, 0, 0, 0.03);
}

.menu-item--switch {
	padding-top: 28rpx;
	padding-bottom: 28rpx;
}

.menu-left {
	display: flex;
	align-items: center;
	min-width: 0;
}

.menu-icon {
	width: 36rpx;
	height: 36rpx;
}

.menu-title {
	margin-left: 16rpx;
	font-size: 28rpx;
	color: #1f1f1f;
	line-height: 1.2;
}

.menu-right {
	display: flex;
	align-items: center;
}

.menu-right-text {
	margin-right: 8rpx;
	font-size: 24rpx;
	color: #a5a7aa;
}

.menu-divider {
	height: 2rpx;
	background-color: #f1f2f4;
	margin-left: 76rpx;
}
</style>
