<template>
	<view class="auth-page">
		<image class="page-bg" src="/static/image/bg.png" mode="aspectFill" />
		<view class="nav">
			<view class="back-btn" @tap="goBack">
				<uni-icons type="left" size="20" color="#0f172a" />
			</view>
		</view>

		<view class="auth-card">
			<view class="title">{{ $t('auth.password.setTitle') }}</view>
			<view class="subtitle">{{ $t('auth.password.setSubtitle') }}</view>

			<view class="form">
				<view class="ipt">
					<uni-icons type="locked-filled" size="20" color="#9ca3af" />
					<input
						class="ipt-input"
						type="text"
						password="true"
						:placeholder="$t('auth.password.placeholderPassword')"
						placeholder-class="ipt-placeholder"
						v-model="password"
					/>
				</view>

				<view class="ipt">
					<uni-icons type="locked-filled" size="20" color="#9ca3af" />
					<input
						class="ipt-input"
						type="text"
						password="true"
						:placeholder="$t('auth.password.placeholderConfirm')"
						placeholder-class="ipt-placeholder"
						v-model="confirmPassword"
					/>
				</view>

				<view class="policy-row">
					<checkbox-group @change="onAgreeChange">
						<label class="policy-label">
							<checkbox value="1" :checked="agree" color="#0b3bb6" style="transform:scale(0.8)" />
							<text class="policy-text">{{ $t('auth.policy.agreePrefix') }}</text>
							<text class="policy-link" @tap.stop="openContent('user_policy')">{{ $t('auth.policy.userAgreement') }}</text>
							<text class="policy-text">{{ $t('auth.policy.and') }}</text>
							<text class="policy-link" @tap.stop="openContent('privacy_policy')">{{ $t('auth.policy.privacyPolicy') }}</text>
						</label>
					</checkbox-group>
				</view>

				<button class="primary-btn" :disabled="submitDisabled" :loading="loading" @tap="submit">{{ $t('auth.password.registerBtn') }}</button>

				<view class="bottom">
					<text class="bottom-text">{{ $t('auth.register.hasAccount') }}</text>
					<text class="bottom-link" @tap="goLogin">{{ $t('auth.register.goLogin') }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import { registerByCode } from '@/service/app-auth'
import api from '@/API/'
import { openPublicAppPage } from '@/common/public-content'
import type { ApiResponse } from '@/types/api'

const { t } = useI18n()

const identifier = ref<string>('')
const verifyCode = ref<string>('')
const password = ref<string>('')
const confirmPassword = ref<string>('')
const agree = ref<boolean>(true)
const loading = ref<boolean>(false)

const submitDisabled = computed<boolean>(() => !password.value || !confirmPassword.value || !agree.value || loading.value)

onLoad((query?: Record<string, string | undefined>) => {
	identifier.value = query && query.identifier ? decodeURIComponent(query.identifier) : ''
	verifyCode.value = query && query.code ? decodeURIComponent(query.code) : ''
})

const goBack = () => {
	uni.navigateBack()
}

const goLogin = () => {
	uni.navigateTo({ url: '/pages/login/login' })
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
	uni.navigateTo({ url: '/pages/content/page?key=' + key })
}

const onAgreeChange = (e: { detail: { value: unknown } }) => {
	agree.value = Array.isArray(e.detail.value) && (e.detail.value as string[]).includes('1')
}

const validatePassword = (pwd: string) => {
	const s = String(pwd || '')
	if (!s.trim()) return { ok: false, msg: t('auth.password.pwdRequired') as string }
	if (s.length < 8 || s.length > 16) return { ok: false, msg: t('auth.password.pwdLength') as string }
	const hasLower = /[a-z]/.test(s)
	const hasNumber = /\d/.test(s)
	if (!hasLower || !hasNumber) return { ok: false, msg: t('auth.password.pwdRule') as string }
	return { ok: true as const }
}

const afterRegisterSuccess = async (token: string) => {
	uni.setStorageSync('access_token', token)
	api
		.apiRequest('/api/v1/user/tenant/id', {}, 'GET')
		.then((rsp: ApiResponse) => {
			if (rsp && rsp.code === 200 && rsp.data) uni.setStorageSync('tenant_id', rsp.data)
		})
		.catch(() => {})
	uni.switchTab({ url: '/pages/home/home' })
}

const submit = async () => {
	if (loading.value) return
	if (!identifier.value || !verifyCode.value) {
		uni.showToast({ title: t('auth.toast.missingParams') as string, icon: 'none' })
		return
	}
	if (!agree.value) {
		uni.showToast({ title: t('auth.toast.pleaseAgree') as string, icon: 'none' })
		return
	}
	const p1 = validatePassword(password.value)
	if (!p1.ok) {
		uni.showToast({ title: p1.msg, icon: 'none' })
		return
	}
	if (password.value !== confirmPassword.value) {
		uni.showToast({ title: t('auth.toast.passwordMismatch') as string, icon: 'none' })
		return
	}
	loading.value = true
	try {
		const resp = (await registerByCode(identifier.value, verifyCode.value, password.value)) as ApiResponse<{ token?: string }>
		if (resp && resp.code === 200 && resp.data && resp.data.token) {
			await afterRegisterSuccess(resp.data.token)
			uni.showToast({ title: t('auth.register.success') as string, icon: 'none' })
		} else {
			uni.showToast({
				title: (resp && (resp.message as string)) || (t('auth.register.failed') as string),
				icon: 'none'
			})
		}
	} catch (e) {
		uni.showToast({ title: t('auth.toast.networkError') as string, icon: 'none' })
	} finally {
		loading.value = false
	}
}
</script>

<style>
page {
	background: #f6f7fb;
}

	.auth-page {
		min-height: 100vh;
		padding: 40rpx 40rpx 60rpx;
		box-sizing: border-box;
		background: #f6f7fb;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.page-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.nav,
	.auth-card {
		position: relative;
		z-index: 1;
	}

	.nav {
		width: 100%;
		max-width: 680rpx;
		display: flex;
	justify-content: flex-start;
	margin-top: 10rpx;
}

.back-btn {
	width: 68rpx;
	height: 68rpx;
	border-radius: 34rpx;
	background: rgba(255, 255, 255, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 10rpx 35rpx rgba(15, 23, 42, 0.1);
}

.auth-card {
	width: 100%;
	max-width: 680rpx;
	margin-top: 30rpx;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(10rpx);
	border-radius: 34rpx;
	padding: 46rpx 34rpx 34rpx;
	box-shadow: 0 18rpx 60rpx rgba(15, 23, 42, 0.12);
}

.title {
	font-size: 44rpx;
	font-weight: 800;
	color: #0f172a;
}

.subtitle {
	margin-top: 12rpx;
	font-size: 26rpx;
	color: #94a3b8;
}

.form {
	margin-top: 36rpx;
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
	font-weight: 700;
}

.primary-btn {
	margin-top: 8rpx;
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

.bottom {
	margin-top: 10rpx;
	display: flex;
	justify-content: center;
	gap: 12rpx;
}

.bottom-text {
	font-size: 26rpx;
	color: #94a3b8;
}

.bottom-link {
	font-size: 26rpx;
	color: #0b3bb6;
	font-weight: 700;
}
</style>
