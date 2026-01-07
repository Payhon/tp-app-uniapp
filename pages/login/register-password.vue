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

<script>
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import { registerByCode } from '@/service/app-auth'

export default {
	components: { uniIcons },
	data() {
		return {
			identifier: '',
			verifyCode: '',
			password: '',
			confirmPassword: '',
			agree: true,
			loading: false
		}
	},
	computed: {
		submitDisabled() {
			return !this.password || !this.confirmPassword || !this.agree || this.loading
		}
	},
	onLoad(query) {
		this.identifier = query && query.identifier ? decodeURIComponent(query.identifier) : ''
		this.verifyCode = query && query.code ? decodeURIComponent(query.code) : ''
	},
	methods: {
		goBack() {
			uni.navigateBack()
		},
		goLogin() {
			uni.navigateTo({ url: '/pages/login/login' })
		},
		openContent(key) {
			uni.navigateTo({ url: '/pages/content/page?key=' + key })
		},
		onAgreeChange(e) {
			this.agree = Array.isArray(e.detail.value) && e.detail.value.includes('1')
		},
		validatePassword(pwd) {
			const s = String(pwd || '')
			if (!s.trim()) return { ok: false, msg: this.$t('auth.password.pwdRequired') }
			if (s.length < 8 || s.length > 16) return { ok: false, msg: this.$t('auth.password.pwdLength') }
			const hasLower = /[a-z]/.test(s)
			const hasNumber = /\d/.test(s)
			if (!hasLower || !hasNumber) return { ok: false, msg: this.$t('auth.password.pwdRule') }
			return { ok: true }
		},
		async afterRegisterSuccess(token) {
			uni.setStorageSync('access_token', token)
			this.API.apiRequest('/api/v1/user/tenant/id', {}, 'GET')
				.then((rsp) => {
					if (rsp && rsp.code === 200 && rsp.data) uni.setStorageSync('tenant_id', rsp.data)
				})
				.catch(() => {})
			uni.switchTab({ url: '/pages/fishery-monitor/fishery-monitor' })
		},
		async submit() {
			if (this.loading) return
			if (!this.identifier || !this.verifyCode) {
				uni.showToast({ title: this.$t('auth.toast.missingParams'), icon: 'none' })
				return
			}
			if (!this.agree) {
				uni.showToast({ title: this.$t('auth.toast.pleaseAgree'), icon: 'none' })
				return
			}
			const p1 = this.validatePassword(this.password)
			if (!p1.ok) {
				uni.showToast({ title: p1.msg, icon: 'none' })
				return
			}
			if (this.password !== this.confirmPassword) {
				uni.showToast({ title: this.$t('auth.toast.passwordMismatch'), icon: 'none' })
				return
			}
			this.loading = true
			try {
				const resp = await registerByCode(this.identifier, this.verifyCode, this.password)
				if (resp && resp.code === 200 && resp.data && resp.data.token) {
					await this.afterRegisterSuccess(resp.data.token)
					uni.showToast({ title: this.$t('auth.register.success'), icon: 'none' })
				} else {
					uni.showToast({ title: (resp && resp.message) || this.$t('auth.register.failed'), icon: 'none' })
				}
			} catch (e) {
				uni.showToast({ title: this.$t('auth.toast.networkError'), icon: 'none' })
			} finally {
				this.loading = false
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
