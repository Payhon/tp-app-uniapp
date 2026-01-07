<template>
	<view class="auth-page">
		<image class="page-bg" src="/static/image/bg.png" mode="aspectFill" />
		<view class="brand">
			<image class="brand-logo" src="/static/image/logo.png" mode="heightFix" />
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
					<uni-icons :type="activeTab === 'phone' ? 'phone-filled' : 'email-filled'" size="20" color="#9ca3af" />
					<input
						class="ipt-input"
						type="text"
						:placeholder="activeTab === 'phone' ? $t('auth.login.placeholderPhone') : $t('auth.login.placeholderEmail')"
						placeholder-class="ipt-placeholder"
						v-model="identifier"
					/>
				</view>

				<view class="ipt">
					<uni-icons type="locked-filled" size="20" color="#9ca3af" />
					<input
						class="ipt-input"
						type="text"
						password="true"
						:placeholder="$t('auth.login.placeholderPassword')"
						placeholder-class="ipt-placeholder"
						v-model="password"
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

				<button class="primary-btn" :loading="loading" :disabled="!canSubmit" @tap="doLogin">{{ $t('auth.login.loginBtn') }}</button>

				<view class="links">
					<text class="link" @tap="goRegister">{{ $t('auth.login.createAccount') }}</text>
					<text class="link muted" @tap="goForgot">{{ $t('auth.login.forgotPassword') }}</text>
				</view>
			</view>
		</view>

		<view class="other">
			<text class="other-title">{{ $t('auth.login.otherMethods') }}</text>
			<!-- #ifdef MP-WEIXIN -->
			<view class="wx-btn" @tap="doWxmpLogin">
				<uni-icons type="weixin" size="34" color="#22c55e" />
			</view>
			<!-- #endif -->
		</view>
	</view>
</template>

<script>
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue'
import { loginByPassword, wxmpLogin } from '@/service/app-auth'

export default {
	components: {
		uniIcons
	},
	data() {
		return {
			activeTab: 'phone',
			identifier: '',
			password: '',
			agree: true,
			loading: false
		}
	},
	computed: {
		canSubmit() {
			return !!this.identifier && !!this.password && !!this.agree && !this.loading
		}
	},
	methods: {
		onAgreeChange(e) {
			this.agree = Array.isArray(e.detail.value) && e.detail.value.includes('1')
		},
		validateIdentifier() {
			const v = String(this.identifier || '').trim()
			if (!v) return { ok: false, msg: this.activeTab === 'phone' ? this.$t('auth.login.placeholderPhone') : this.$t('auth.login.placeholderEmail') }
			if (this.activeTab === 'email') {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				if (!emailRegex.test(v)) return { ok: false, msg: this.$t('auth.login.invalidEmail') }
				return { ok: true }
			}
			const phoneRegex = /^1[3-9]\d{9}$/
			if (!phoneRegex.test(v.replace(/\s+/g, ''))) return { ok: false, msg: this.$t('auth.login.invalidPhone') }
			return { ok: true }
		},
		validatePassword() {
			if (!String(this.password || '').trim()) return { ok: false, msg: this.$t('auth.login.placeholderPassword') }
			return { ok: true }
		},
		openContent(key) {
			uni.navigateTo({
				url: '/pages/content/page?key=' + key
			})
		},
		goRegister() {
			uni.navigateTo({
				url: '/pages/login/register'
			})
		},
		goForgot() {
			uni.navigateTo({
				url: '/pages/login/forgot'
			})
		},
		async afterLoginSuccess(token) {
			uni.setStorageSync('access_token', token)

			// 获取并缓存租户ID（用于 APP 内容接口 X-TenantID Header）
			this.API.apiRequest('/api/v1/user/tenant/id', {}, 'GET')
				.then((rsp) => {
					if (rsp && rsp.code === 200 && rsp.data) uni.setStorageSync('tenant_id', rsp.data)
				})
				.catch(() => {})

			// #ifdef APP-PLUS
			try {
				uni.getPushClientId({
					success: (res) => {
						const cid = res && res.cid ? res.cid : ''
						if (!cid) return
						this.API.apiRequest('/api/v1/push-id', { push_id: cid }, 'POST')
							.then(() => uni.setStorageSync('push_id', cid))
							.catch(() => uni.setStorageSync('push_id', cid))
					}
				})
			} catch (e) {}
			// #endif

			uni.switchTab({
				url: '/pages/fishery-monitor/fishery-monitor'
			})
		},
		async doLogin() {
			if (this.loading) return
			if (!this.agree) {
				uni.showToast({ title: this.$t('auth.toast.pleaseAgree'), icon: 'none' })
				return
			}
			const idRes = this.validateIdentifier()
			if (!idRes.ok) {
				uni.showToast({ title: idRes.msg, icon: 'none' })
				return
			}
			const pwdRes = this.validatePassword()
			if (!pwdRes.ok) {
				uni.showToast({ title: pwdRes.msg, icon: 'none' })
				return
			}

			this.loading = true
			try {
				const resp = await loginByPassword(this.identifier, this.password)
				if (resp && resp.code === 200 && resp.data && resp.data.token) {
					await this.afterLoginSuccess(resp.data.token)
					uni.showToast({ title: this.$t('auth.login.success'), icon: 'none' })
				} else {
					uni.showToast({ title: (resp && resp.message) || this.$t('auth.login.failed'), icon: 'none' })
				}
			} catch (e) {
				uni.showToast({ title: this.$t('auth.toast.networkError'), icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		// #ifdef MP-WEIXIN
		async doWxmpLogin() {
			if (this.loading) return
			if (!this.agree) {
				uni.showToast({ title: this.$t('auth.toast.pleaseAgree'), icon: 'none' })
				return
			}
			this.loading = true
			try {
				const loginRes = await new Promise((resolve, reject) => {
					uni.login({
						provider: 'weixin',
						success: resolve,
						fail: reject
					})
				})
				const resp = await wxmpLogin(loginRes.code)
				if (resp && resp.code === 200 && resp.data && resp.data.token) {
					await this.afterLoginSuccess(resp.data.token)
					uni.showToast({ title: this.$t('auth.login.success'), icon: 'none' })
				} else {
					uni.showToast({ title: (resp && resp.message) || this.$t('auth.login.failed'), icon: 'none' })
				}
			} catch (e) {
				uni.showToast({ title: this.$t('auth.login.failedRetry'), icon: 'none' })
			} finally {
				this.loading = false
			}
		}
		// #endif
	}
}
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
	max-width: 680rpx;
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
