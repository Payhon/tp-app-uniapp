<template>
	<view>
		<view class="tp-login-box tp-flex tp-flex-col tp-box-sizing tp-pd-l-r-50 tp-pd-t-50">

			<view class="tp-pd-t-b-30"></view>

				<view class="tp-flex tp-login-welcome tp-flex-col tp-mg-t-b-50">
					<view class="tp-login-title">{{ $t('components.login.welcome') }}</view>
					<view class="tp-login-subtitle tp-mg-t-05">{{ $t('components.login.welcomeSubtitle') }}</view>
				</view>

			<view
					class="tp-ipt tp-box-sizing tp-mg-t-b-20 tp-pd-t-b-15 tp-pd-l-r-30 tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c">
					<view class="iconfont iconwode tp-mg-r-15"></view>
					<input class="tp-login-input" type="text" placeholder-class="tp-plc" :placeholder="$t('components.login.accountPlaceholder')" v-model="email" />
				</view>
			<view
					class="tp-ipt tp-box-sizing tp-mg-t-b-20 tp-pd-t-b-15 tp-pd-l-r-30 tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c">
					<view class="iconfont iconmima tp-mg-r-15"></view>
					<input class="tp-login-input" type="text" placeholder-class="tp-plc" :placeholder="$t('components.login.passwordPlaceholder')" v-model="password" password=true />
				</view>

				<view class="tp-remember-password tp-mg-b-20">
					<label class="tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c tp-mg-l-25 tp-remember-label">
						<checkbox class="tp-remember-checkbox" value="cb" checked="true" color="#000000" /> {{ $t('components.login.rememberPassword') }}
					</label>
				</view>

			<button class="tp-btn tp-mg-t-50" :loading="loading" :class="{'vc-btn-disabled':disabled}"
				@tap="doLoginSubmit">{{ $t('components.login.loginButton') }}</button>

			<view class="tp-getpwd tp-mg-t-40 tp-flex tp-flex-row tp-flex-j-c tp-flex-a-c">{{ $t('components.login.forgotPassword') }}</view>

		</view>
		<uni-popup ref="authPopup" type="bottom">
			<authorize @getuserinfo="getAuth" @cancel="toCloseLogin"></authorize>
		</uni-popup>
		<!-- 消息提示框 -->
		<cys-toast ref="toast" :msg="toast.msg" :direction="row" location="top"></cys-toast>
	</view>

</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import http from '@/common/request'
import { isLoginType } from '@/store/login'
import legacyStore from '@/store'

const { t } = useI18n()

const disabled = ref(true)
const loading = ref(false)
const email = ref('1234567@qq.com')
const password = ref('12345678')

const toast = ref<{ msg: string }>({ msg: '' })

const authPopup = ref<any>(null)

const onBtnChange = () => {
	disabled.value = !(email.value && password.value)
}

watch([email, password], onBtnChange)

const toCloseLogin = () => {
	authPopup.value?.close?.()
}

const getAuth = () => {
	// #ifdef MP-WEIXIN
	uni.getUserProfile({
		desc: t('ucenter.authDescription') as string,
		success() {
			uni.setStorageSync('isAuth', '1')
			authPopup.value?.close?.()
		},
		fail(err: unknown) {
			console.log('未授权err==', err)
		}
	})
	// #endif
}

const doLoginSubmit = async () => {
	const userDetail = isLoginType()
	const isAuth = userDetail.isAuth
	if (!isAuth) {
		authPopup.value?.open?.()
		return
	}

	const url = '/auth/login'
	const data = {
		email: email.value,
		password: password.value
	}

	loading.value = true
	try {
		const res = await http.post(url, data)
		legacyStore.commit('login', res)
		legacyStore.dispatch('getUserInfo')
		uni.switchTab({
			url: '../fishery-monitor/fishery-monitor'
		})
		uni.showToast({
			title: t('components.login.loginSuccess') as string,
			icon: 'none'
		})
	} catch (err) {
		// ignore
	} finally {
		loading.value = false
	}
}

onLoad(() => {
	onBtnChange()
})
</script>

<style>
	.tp-login-box {
		width: 100%;
	}

	.tp-login-welcome {}

	.tp-login-title {
		font-size: 42rpx;
		font-weight: bold;
		color: #0F0F0F;
	}

	.tp-login-subtitle {
		font-size: 26rpx;
		font-weight: 500;
		color: #999999;
	}

	.tp-login-box>.tp-ipt {
		width: 100%;
		height: 84rpx;
		background: #F1F3F5;
		border-radius: 42rpx;
	}

	.tp-login-box>.tp-ipt>.iconfont {
		font-size: 36rpx;
		color: #999999;
		font-weight: bold;
	}

	.tp-login-input {
		width: 100%;
		color: #666666;
	}

	.tp-remember-password {}

	.tp-remember-label {
		font-size: 28rpx;
		font-weight: 500;
		color: #666666;
	}

	.tp-remember-checkbox {
		transform: scale(0.6);
	}

	.tp-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: #343436;
		box-shadow: 0rpx 8rpx 31rpx 1rpx rgba(147, 147, 147, 0.35);
		border-radius: 44rpx;
		font-size: 36rpx;
		font-weight: bold;
		color: #FFFFFF;
	}

	.vc-btn-disabled {
		background: #888888;
	}

	.tp-getpwd {
		font-size: 28rpx;
		font-weight: 500;
		color: #666666;
	}

	.tp-plc {
		font-size: 30rpx;
		font-weight: 500;
		color: #999999;
	}
</style>
