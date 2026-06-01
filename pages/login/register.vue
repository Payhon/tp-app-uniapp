<template>
	<view class="auth-page">
		<image class="page-bg" src="/static/image/bg.png" mode="aspectFill" />
		<view class="nav">
			<view class="back-btn" @tap="goBack">
				<uni-icons type="left" size="20" color="#0f172a" />
			</view>
		</view>

			<view class="auth-card">
			<view class="title">{{ $t('auth.register.title') }}</view>
			<view class="subtitle">{{ $t('auth.register.subtitle') }}</view>

			<view class="form">
				<view class="ipt">
					<uni-icons type="person-filled" size="20" color="#9ca3af" />
					<input
						class="ipt-input"
						type="text"
						:placeholder="$t('auth.register.placeholderIdentifier')"
						placeholder-class="ipt-placeholder"
						v-model="identifier"
					/>
				</view>

				<view class="ipt code-ipt">
					<uni-icons type="shield-filled" size="20" color="#9ca3af" />
					<input
						class="ipt-input"
						type="text"
						:placeholder="$t('auth.register.placeholderCode')"
						placeholder-class="ipt-placeholder"
						v-model="verifyCode"
					/>
					<view class="code-btn" :class="{ disabled: codeBtnDisabled }" @tap="sendCode">
						<text class="code-btn-text">{{ codeBtnText }}</text>
					</view>
				</view>

				<button class="primary-btn" :disabled="nextDisabled" :loading="loadingNext" @tap="nextStep">{{ $t('auth.register.next') }}</button>

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
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import { sendVerifyCode } from '@/service/app-auth'
import { fetchWxmpRuntimeConfig, isPackWxmpRuntime } from '@/common/wxmp-runtime'
import type { ApiResponse } from '@/types/api'

const { t } = useI18n()

const identifier = ref<string>('')
const verifyCode = ref<string>('')

const countdown = ref<number>(0)
// uni-app 不同平台 setInterval 返回值类型不一致，这里用 number 做兼容
const timer = ref<number | null>(null)

const loadingCode = ref<boolean>(false)
const loadingNext = ref<boolean>(false)

const isIdentifierValid = computed<boolean>(() => {
	const v = String(identifier.value || '').trim()
	if (!v) return false
	if (v.includes('@')) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(v)
	}
	const phoneRegex = /^1[3-9]\d{9}$/
	return phoneRegex.test(v.replace(/\s+/g, ''))
})

const codeBtnText = computed<string>(() => {
	if (loadingCode.value) return t('auth.register.sending') as string
	if (countdown.value > 0) return `${countdown.value}s`
	return t('auth.register.getCode') as string
})

const codeBtnDisabled = computed<boolean>(() => {
	return loadingCode.value || countdown.value > 0 || !isIdentifierValid.value
})

const nextDisabled = computed<boolean>(() => {
	return !isIdentifierValid.value || !String(verifyCode.value || '').trim() || loadingNext.value
})

const goBack = () => {
	uni.navigateBack()
}

const goLogin = () => {
	uni.navigateTo({ url: '/pages/login/login' })
}

onLoad(async () => {
	// #ifdef MP-WEIXIN
	const runtime = await fetchWxmpRuntimeConfig()
	if (isPackWxmpRuntime(runtime)) {
		uni.redirectTo({ url: '/pages/login/login' })
	}
	// #endif
})

const clearTimer = () => {
	if (timer.value !== null) clearInterval(timer.value)
	timer.value = null
}

const startCountdown = () => {
	clearTimer()
	countdown.value = 60
	timer.value = setInterval(() => {
		countdown.value -= 1
		if (countdown.value <= 0) clearTimer()
	}, 1000) as unknown as number
}

const sendCode = async () => {
	if (codeBtnDisabled.value) return
	if (!isIdentifierValid.value) {
		uni.showToast({ title: t('auth.register.invalidIdentifier') as string, icon: 'none' })
		return
	}
	loadingCode.value = true
	try {
		const resp = (await sendVerifyCode(identifier.value, 'REGISTER')) as ApiResponse
		if (resp && resp.code === 200) {
			uni.showToast({ title: t('auth.register.codeSent') as string, icon: 'none' })
			startCountdown()
		} else {
			uni.showToast({
				title: (resp && (resp.message as string)) || (t('auth.register.sendFailed') as string),
				icon: 'none'
			})
		}
	} catch (e) {
		uni.showToast({ title: t('auth.toast.networkError') as string, icon: 'none' })
	} finally {
		loadingCode.value = false
	}
}

const nextStep = async () => {
	if (nextDisabled.value) return
	loadingNext.value = true
	try {
		const url =
			'/pages/login/register-password?identifier=' +
			encodeURIComponent(String(identifier.value || '').trim()) +
			'&code=' +
			encodeURIComponent(String(verifyCode.value || '').trim())
		uni.navigateTo({ url })
	} finally {
		loadingNext.value = false
	}
}

onUnload(() => {
	clearTimer()
})
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

.code-ipt {
	padding-right: 12rpx;
}

.code-btn {
	padding: 0 18rpx;
	height: 64rpx;
	border-radius: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.code-btn-text {
	font-size: 26rpx;
	color: #0b3bb6;
	font-weight: 700;
}

.code-btn.disabled .code-btn-text {
	color: #94a3b8;
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
