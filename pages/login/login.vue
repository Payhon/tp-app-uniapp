<template>
	<view class="auth-page">
		<image class="page-bg" :src="$img('bg@2x.png')" mode="aspectFill" />
		<view class="brand">
			<image class="brand-logo" src="/static/image/logo@2x.png" mode="heightFix" @tap="onBrandLogoTap" />
		</view>

		<view class="auth-card">
			<view class="tabs">
				<view class="tab" :class="{ active: activeTab === 'phone' }" @tap="activeTab = 'phone'">
					<text class="tab-text">{{ $t('auth.login.tabAccount') }}</text>
					<view class="tab-line" v-if="activeTab === 'phone'"></view>
				</view>
				<view class="tab" :class="{ active: activeTab === 'email' }" @tap="activeTab = 'email'">
					<text class="tab-text">{{ $t('auth.login.tabEmail') }}</text>
					<view class="tab-line" v-if="activeTab === 'email'"></view>
				</view>
			</view>

			<view class="form">
				<view class="ipt">
					<uni-icons :type="activeTab === 'phone' ? 'phone-filled' : 'email-filled'" size="20"
						color="#9ca3af" />
					<input class="ipt-input" type="text"
						:placeholder="activeTab === 'phone' ? $t('auth.login.placeholderPhone') : $t('auth.login.placeholderEmail')"
						placeholder-class="ipt-placeholder" v-model="identifier" />
				</view>

				<view class="ipt">
					<uni-icons type="locked-filled" size="20" color="#9ca3af" />
					<input class="ipt-input" type="text" password="true"
						:placeholder="$t('auth.login.placeholderPassword')" placeholder-class="ipt-placeholder"
						v-model="password" />
				</view>

				<view class="captcha-row">
					<view class="ipt captcha-input">
						<uni-icons type="image-filled" size="20" color="#9ca3af" />
						<input class="ipt-input" type="text"
							:placeholder="$t('auth.login.placeholderCaptcha')" placeholder-class="ipt-placeholder"
							v-model="captchaCode" />
					</view>
					<view class="captcha-box" @tap="refreshCaptcha">
						<image v-if="captchaImage" class="captcha-image" :src="captchaImage" mode="aspectFit" />
						<text v-else class="captcha-text">{{ $t('auth.login.captchaRefresh') }}</text>
					</view>
				</view>

				<view class="policy-row">
					<checkbox-group @change="onAgreeChange">
						<label class="policy-label">
							<checkbox value="1" :checked="agree" color="#0b3bb6" style="transform:scale(0.8)" />
							<text class="policy-text">{{ $t('auth.policy.agreePrefix') }}</text>
							<text class="policy-link" @tap.stop="openContent('user_policy')">{{
								$t('auth.policy.userAgreement') }}</text>
							<text class="policy-text">{{ $t('auth.policy.and') }}</text>
							<text class="policy-link" @tap.stop="openContent('privacy_policy')">{{
								$t('auth.policy.privacyPolicy') }}</text>
						</label>
					</checkbox-group>
				</view>

				<button class="primary-btn" :loading="loading" :disabled="!canSubmit" @tap="doLogin">{{
					$t('auth.login.loginBtn') }}</button>

				<view class="links">
					<text class="link" @tap="goRegister">{{ $t('auth.login.createAccount') }}</text>
					<text class="link muted" @tap="goForgot">{{ $t('auth.login.forgotPassword') }}</text>
				</view>

				<view v-if="isDeveloperMode" class="dev-panel">
					<text class="dev-title">{{ $t('auth.login.developerModeTitle') }}</text>
					<view class="dev-item">
						<text class="dev-label">{{ $t('auth.login.baseVersionLabel') }}</text>
						<text class="dev-value">{{ debugInfo.baseVersion }}</text>
					</view>
					<view class="dev-item">
						<text class="dev-label">{{ $t('auth.login.appVersionLabel') }}</text>
						<text class="dev-value">{{ debugInfo.appVersion }}</text>
					</view>
					<view class="dev-item">
						<text class="dev-label">{{ $t('auth.login.apiBaseUrlLabel') }}</text>
						<text class="dev-value">{{ debugInfo.apiBaseUrl }}</text>
					</view>
					<button class="dev-exit-btn" @tap="exitDeveloperMode">{{ $t('auth.login.disableDeveloperMode') }}</button>
				</view>
			</view>
		</view>

		<view v-if="hasOtherLoginMethods" class="other">
			<text class="other-title">{{ $t('auth.login.otherMethods') }}</text>
			<!-- #ifdef MP-WEIXIN -->
			<view class="wx-btn" @tap="doWxmpLogin">
				<uni-icons type="weixin" size="34" color="#22c55e" />
			</view>
			<!-- #endif -->
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import { fetchLoginCaptcha, loginByPassword, wxmpLogin } from '@/service/app-auth'
import api from '@/API/'
import { createDefaultAppDebugInfo, getAppDebugInfo, type AppDebugInfo } from '@/common/app-debug'
import { openPublicAppPage } from '@/common/public-content'
import type { ApiResponse } from '@/types/api'
import { useDeveloperStore } from '@/store/developer'
import { useUserStore } from '@/store/user'

type LoginTab = 'phone' | 'email'

type UniLoginResult = {
	code: string
	[key: string]: unknown
}

type PushClientIdResult = {
	cid?: string
	[key: string]: unknown
}

const { t } = useI18n()
const developerStore = useDeveloperStore()
const userStore = useUserStore()

const activeTab = ref<LoginTab>('phone')
const identifier = ref<string>('')
const password = ref<string>('')
const captchaId = ref<string>('')
const captchaCode = ref<string>('')
const captchaImage = ref<string>('')
const loading = ref<boolean>(false)
const captchaLoading = ref<boolean>(false)
const logoTapCount = ref<number>(0)
const debugInfo = ref<AppDebugInfo>(createDefaultAppDebugInfo())

let logoTapResetTimer: ReturnType<typeof setTimeout> | null = null

const getInitialAgreementChecked = (): boolean => {
	// #ifdef MP-WEIXIN
	return false
	// #endif
	// #ifndef MP-WEIXIN
	return true
	// #endif
}

const agree = ref<boolean>(getInitialAgreementChecked())

const isDeveloperMode = computed<boolean>(() => developerStore.enabled)

const hasOtherLoginMethods = computed<boolean>(() => {
	// #ifdef MP-WEIXIN
	return true
	// #endif
	// #ifndef MP-WEIXIN
	return false
	// #endif
})

const canSubmit = computed<boolean>(() => {
	return !!identifier.value && !!password.value && !!captchaCode.value && !!agree.value && !loading.value
})

const clearLogoTapResetTimer = () => {
	if (!logoTapResetTimer) return
	clearTimeout(logoTapResetTimer)
	logoTapResetTimer = null
}

const resetLogoTapState = () => {
	logoTapCount.value = 0
	clearLogoTapResetTimer()
}

const scheduleLogoTapReset = () => {
	clearLogoTapResetTimer()
	logoTapResetTimer = setTimeout(() => {
		logoTapCount.value = 0
		logoTapResetTimer = null
	}, 1500)
}

const refreshDeveloperDebugInfo = async () => {
	debugInfo.value = await getAppDebugInfo()
}

const onBrandLogoTap = async () => {
	logoTapCount.value += 1
	if (logoTapCount.value < 9) {
		scheduleLogoTapReset()
		return
	}

	resetLogoTapState()
	const changed = developerStore.enable()
	await refreshDeveloperDebugInfo()
	uni.showToast({
		title: changed ? (t('auth.login.developerModeEnabled') as string) : (t('auth.login.developerModeAlreadyEnabled') as string),
		icon: 'none'
	})
}

const exitDeveloperMode = () => {
	const changed = developerStore.disable()
	if (!changed) return
	uni.showToast({
		title: t('auth.login.developerModeDisabled') as string,
		icon: 'none'
	})
}

const onAgreeChange = (e: { detail: { value: unknown } }) => {
	agree.value = Array.isArray(e.detail.value) && (e.detail.value as string[]).includes('1')
}

const validateIdentifier = () => {
	const v = String(identifier.value || '').trim()
	if (!v) {
		return {
			ok: false as const,
			msg: activeTab.value === 'phone' ? (t('auth.login.placeholderPhone') as string) : (t('auth.login.placeholderEmail') as string)
		}
	}
	if (activeTab.value === 'email') {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(v)) return { ok: false as const, msg: t('auth.login.invalidEmail') as string }
		return { ok: true as const }
	}
	const phoneRegex = /^1[3-9]\d{9}$/
	if (!phoneRegex.test(v.replace(/\s+/g, ''))) return { ok: false as const, msg: t('auth.login.invalidPhone') as string }
	return { ok: true as const }
}

const validatePassword = () => {
	if (!String(password.value || '').trim()) return { ok: false as const, msg: t('auth.login.placeholderPassword') as string }
	return { ok: true as const }
}

const validateCaptcha = () => {
	if (!String(captchaId.value || '').trim()) return { ok: false as const, msg: t('auth.login.captchaLoadFailed') as string }
	if (!String(captchaCode.value || '').trim()) return { ok: false as const, msg: t('auth.login.placeholderCaptcha') as string }
	return { ok: true as const }
}

const refreshCaptcha = async () => {
	if (captchaLoading.value) return
	captchaLoading.value = true
	try {
		const resp = (await fetchLoginCaptcha()) as ApiResponse<{ captcha_id?: string; captcha_image?: string }>
		if (resp && resp.code === 200 && resp.data) {
			captchaId.value = String(resp.data.captcha_id || '').trim()
			captchaImage.value = String(resp.data.captcha_image || '').trim()
			captchaCode.value = ''
			return
		}
		captchaId.value = ''
		captchaImage.value = ''
		uni.showToast({ title: (resp && (resp.message as string)) || (t('auth.login.captchaLoadFailed') as string), icon: 'none' })
	} catch (e) {
		captchaId.value = ''
		captchaImage.value = ''
		uni.showToast({ title: t('auth.login.captchaLoadFailed') as string, icon: 'none' })
	} finally {
		captchaLoading.value = false
	}
}

const openContent = (key: string) => {
	if (key === 'user_policy') {
		openPublicAppPage('user-policy', t('pages.userPolicy') as string)
		return
	}
	if (key === 'privacy_policy') {
		openPublicAppPage('privacy', t('pages.privacyPolicy') as string)
		return
	}
	uni.navigateTo({
		url: '/pages/content/page?key=' + key
	})
}

const goRegister = () => {
	uni.navigateTo({
		url: '/pages/login/register'
	})
}

const goForgot = () => {
	uni.navigateTo({
		url: '/pages/login/forgot'
	})
}

const afterLoginSuccess = async (token: string) => {
	uni.setStorageSync('access_token', token)

	// 获取并缓存租户ID（用于 APP 内容接口 X-TenantID Header）
	api
		.apiRequest('/api/v1/user/tenant/id', {}, 'GET')
		.then((rsp: ApiResponse) => {
			if (rsp && rsp.code === 200 && rsp.data) uni.setStorageSync('tenant_id', rsp.data)
		})
		.catch(() => { })

	// 拉取用户信息（用于“我的”页显示）
	api
		.apiRequest('/api/v1/user/detail', {}, 'GET')
		.then((rsp: ApiResponse<Record<string, unknown>>) => {
			if (rsp && rsp.code === 200 && rsp.data) userStore.setUserInfo(rsp.data as any)
		})
		.catch(() => {})

	// #ifdef APP-PLUS
	try {
		uni.getPushClientId({
			success: (res: PushClientIdResult) => {
				const cid = res && res.cid ? res.cid : ''
				if (!cid) return
				api
					.apiRequest('/api/v1/push-id', { push_id: cid }, 'POST')
					.then(() => uni.setStorageSync('push_id', cid))
					.catch(() => uni.setStorageSync('push_id', cid))
			}
		})
	} catch (e) { }
	// #endif

	uni.switchTab({
		url: '/pages/home/home'
	})
}

const doLogin = async () => {
	if (loading.value) return
	if (!agree.value) {
		uni.showToast({ title: t('auth.toast.pleaseAgree') as string, icon: 'none' })
		return
	}
	const idRes = validateIdentifier()
	if (!idRes.ok) {
		uni.showToast({ title: idRes.msg, icon: 'none' })
		return
	}
	const pwdRes = validatePassword()
	if (!pwdRes.ok) {
		uni.showToast({ title: pwdRes.msg, icon: 'none' })
		return
	}
	const captchaRes = validateCaptcha()
	if (!captchaRes.ok) {
		uni.showToast({ title: captchaRes.msg, icon: 'none' })
		return
	}

	loading.value = true
	try {
		const resp = (await loginByPassword(
			identifier.value,
			password.value,
			captchaId.value,
			captchaCode.value
		)) as ApiResponse<{ token?: string }>
		if (resp && resp.code === 200 && resp.data && resp.data.token) {
			await afterLoginSuccess(resp.data.token)
			uni.showToast({ title: t('auth.login.success') as string, icon: 'none' })
		} else {
			uni.showToast({ title: (resp && (resp.message as string)) || (t('auth.login.failed') as string), icon: 'none' })
			await refreshCaptcha()
		}
	} catch (e) {
		uni.showToast({ title: t('auth.toast.networkError') as string, icon: 'none' })
		await refreshCaptcha()
	} finally {
		loading.value = false
	}
}

onShow(() => {
	void refreshCaptcha()
	if (developerStore.enabled) {
		void refreshDeveloperDebugInfo()
	}
})

onUnload(() => {
	resetLogoTapState()
})

// #ifdef MP-WEIXIN
const doWxmpLogin = async () => {
	if (loading.value) return
	if (!agree.value) {
		uni.showToast({ title: t('auth.toast.pleaseAgree') as string, icon: 'none' })
		return
	}
	loading.value = true
	try {
		// NOTE: 各平台 LoginRes 类型定义存在差异，这里避免过度约束导致 HBuilderX 编译报错
		const loginRes = await new Promise<any>((resolve, reject) => {
			uni.login({
				provider: 'weixin',
				success: resolve,
				fail: reject
			})
		})
		const resp = (await wxmpLogin(loginRes.code)) as ApiResponse<{ token?: string }>
		if (resp && resp.code === 200 && resp.data && resp.data.token) {
			await afterLoginSuccess(resp.data.token)
			uni.showToast({ title: t('auth.login.success') as string, icon: 'none' })
		} else {
			uni.showToast({ title: (resp && (resp.message as string)) || (t('auth.login.failed') as string), icon: 'none' })
		}
	} catch (e) {
		uni.showToast({ title: t('auth.login.failedRetry') as string, icon: 'none' })
	} finally {
		loading.value = false
	}
}
// #endif
</script>

<style>
page {
	background: #f6f7fb;
}

.auth-page {
	min-height: 100vh;
	padding: 80rpx 40rpx 60rpx;
	box-sizing: border-box;
	background: #f6f7fb;
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.page-bg {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.brand,
.auth-card,
.other {
	position: relative;
	z-index: 1;
}

.brand {
	width: 100%;
	display: flex;
	justify-content: center;
	margin-top: 10rpx;
	margin-bottom: 40rpx;
}

.brand-logo {
	height: 90rpx;
}

.auth-card {
	width: 100%;
	max-width: 686rpx;
	margin: 0 32rpx;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(10rpx);
	border-radius: 34rpx;
	padding: 36rpx 32rpx 30rpx;
	box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.12);
}

.tabs {
	display: flex;
	gap: 56rpx;
	padding: 8rpx 10rpx 18rpx;
}

.tab {
	position: relative;
	padding-bottom: 16rpx;
}

.tab-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #94a3b8;
}

.tab.active .tab-text {
	color: #0f172a;
}

.tab-line {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	margin: 0 auto;
	width: 64rpx;
	height: 6rpx;
	border-radius: 6rpx;
	background: #0b3bb6;
}

.form {
	margin-top: 14rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.ipt {
	height: 86rpx;
	border-radius: 18rpx;
	background: #f4f6fb;
	padding: 0 22rpx;
	display: flex;
	align-items: center;
	gap: 18rpx;
}

.captcha-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.captcha-input {
	flex: 1;
}

.captcha-box {
	width: 220rpx;
	height: 86rpx;
	border-radius: 18rpx;
	background: #f4f6fb;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	padding: 8rpx 12rpx;
	box-sizing: border-box;
}

.captcha-image {
	width: 100%;
	height: 100%;
}

.captcha-text {
	font-size: 24rpx;
	color: #64748b;
}

.ipt-input {
	flex: 1;
	font-size: 28rpx;
	color: #0f172a;
}

.ipt-placeholder {
	color: #94a3b8;
	font-size: 26rpx;
}

.policy-row {
	margin-top: 2rpx;
}

.policy-label {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6rpx;
}

.policy-text {
	font-size: 24rpx;
	color: #64748b;
}

.policy-link {
	font-size: 24rpx;
	color: #0b3bb6;
	font-weight: 600;
}

.primary-btn {
	margin-top: 12rpx;
	height: 92rpx;
	line-height: 92rpx;
	border-radius: 46rpx;
	background: #0b3bb6;
	color: #fff;
	font-size: 30rpx;
	font-weight: 700;
}

.primary-btn[disabled] {
	opacity: 0.55;
}

.links {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 6rpx 8rpx 0;
}

.dev-panel {
	margin-top: 12rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(148, 163, 184, 0.24);
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

.dev-title {
	font-size: 22rpx;
	font-weight: 700;
	color: #475569;
}

.dev-item {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.dev-label {
	font-size: 22rpx;
	color: #94a3b8;
}

.dev-value {
	font-size: 24rpx;
	line-height: 1.5;
	color: #0f172a;
	word-break: break-all;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.dev-exit-btn {
	margin-top: 8rpx;
	height: 72rpx;
	line-height: 72rpx;
	border-radius: 16rpx;
	border: 1rpx solid rgba(11, 59, 182, 0.24);
	background: rgba(11, 59, 182, 0.06);
	color: #0b3bb6;
	font-size: 24rpx;
	font-weight: 600;
}

.link {
	font-size: 26rpx;
	color: #0b3bb6;
	font-weight: 700;
}

.link.muted {
	color: #94a3b8;
	font-weight: 600;
}

.other {
	margin-top: 46rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18rpx;
}

.other-title {
	font-size: 24rpx;
	color: #94a3b8;
}

.wx-btn {
	width: 86rpx;
	height: 86rpx;
	border-radius: 43rpx;
	background: rgba(255, 255, 255, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 10rpx 35rpx rgba(15, 23, 42, 0.1);
}
</style>
