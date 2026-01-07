<template>
	<view class="auth-page">
		<image class="page-bg" src="/static/image/bg.png" mode="aspectFill" />
		<view class="nav">
			<view class="back-btn" @tap="goBack">
				<uni-icons type="left" size="20" color="#0f172a" />
			</view>
		</view>

		<view class="auth-card">
			<view class="title">{{ $t('auth.forgot.title') }}</view>
			<view class="subtitle">{{ $t('auth.forgot.subtitle') }}</view>

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

				<button class="primary-btn" :disabled="nextDisabled" :loading="loadingNext" @tap="nextStep">{{ $t('auth.forgot.next') }}</button>
			</view>
		</view>
	</view>
</template>

<script>
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import { sendVerifyCode } from '@/service/app-auth'

export default {
	components: { uniIcons },
	data() {
		return {
			identifier: '',
			verifyCode: '',
			countdown: 0,
			timer: null,
			loadingCode: false,
			loadingNext: false
		}
	},
	computed: {
		codeBtnText() {
			if (this.loadingCode) return this.$t('auth.register.sending')
			if (this.countdown > 0) return `${this.countdown}s`
			return this.$t('auth.register.getCode')
		},
		codeBtnDisabled() {
			return this.loadingCode || this.countdown > 0 || !this.isIdentifierValid
		},
		isIdentifierValid() {
			const v = String(this.identifier || '').trim()
			if (!v) return false
			if (v.includes('@')) {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				return emailRegex.test(v)
			}
			const phoneRegex = /^1[3-9]\d{9}$/
			return phoneRegex.test(v.replace(/\s+/g, ''))
		},
		nextDisabled() {
			return !this.isIdentifierValid || !String(this.verifyCode || '').trim() || this.loadingNext
		}
	},
	onUnload() {
		this.clearTimer()
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		clearTimer() {
			if (this.timer) clearInterval(this.timer)
			this.timer = null
		},
		startCountdown() {
			this.clearTimer()
			this.countdown = 60
			this.timer = setInterval(() => {
				this.countdown -= 1
				if (this.countdown <= 0) this.clearTimer()
			}, 1000)
		},
		async sendCode() {
			if (this.codeBtnDisabled) return
			if (!this.isIdentifierValid) {
				uni.showToast({ title: this.$t('auth.register.invalidIdentifier'), icon: 'none' })
				return
			}
			this.loadingCode = true
			try {
				const resp = await sendVerifyCode(this.identifier, 'RESET_PASSWORD')
				if (resp && resp.code === 200) {
					uni.showToast({ title: this.$t('auth.register.codeSent'), icon: 'none' })
					this.startCountdown()
				} else {
					uni.showToast({ title: (resp && resp.message) || this.$t('auth.register.sendFailed'), icon: 'none' })
				}
			} catch (e) {
				uni.showToast({ title: this.$t('auth.toast.networkError'), icon: 'none' })
			} finally {
				this.loadingCode = false
			}
		},
		async nextStep() {
			if (this.nextDisabled) return
			this.loadingNext = true
			try {
				const url =
					'/pages/login/forgot-reset?identifier=' +
					encodeURIComponent(String(this.identifier || '').trim()) +
					'&code=' +
					encodeURIComponent(String(this.verifyCode || '').trim())
				uni.navigateTo({ url })
			} finally {
				this.loadingNext = false
			}
		}
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
</style>
