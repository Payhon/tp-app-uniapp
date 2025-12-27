<template>
	<view class="tp-box tp-box-sizing tp-pd-l-r-30 tp-pd-t-b-30">
		<view class="card">
			<view class="label">{{ $t('pages.feedbackContent') }}</view>
			<textarea class="textarea" v-model="content" :placeholder="$t('pages.feedbackPlaceholder')" maxlength="10000" />
			<view class="count">{{ content.length }}/10000</view>
		</view>

		<view class="card">
			<view class="label">{{ $t('pages.feedbackImages') }}</view>
			<view class="images">
				<view v-for="(img, idx) in images" :key="img" class="img-item">
					<image :src="img" mode="aspectFill" class="img" @click="preview(idx)"></image>
					<view class="img-del" @click.stop="remove(idx)">×</view>
				</view>
				<view v-if="images.length < maxImages" class="img-add" @click="chooseImage">
					<text class="img-add-plus">+</text>
				</view>
			</view>
			<view class="hint">{{ $t('pages.feedbackImageHint', { count: maxImages }) }}</view>
		</view>

		<view class="actions">
			<button class="tp-btn primary" :disabled="submitting" @click="submit">
				{{ submitting ? $t('common.loading') : $t('pages.submitFeedback') }}
			</button>
			<button class="tp-btn" @click="goMyFeedback">{{ $t('pages.myFeedback') }}</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				content: '',
				images: [],
				maxImages: 6,
				submitting: false
			}
		},
		onLoad() {
			if (!this.$login.isLoginType().isLogin) {
				uni.showToast({
					title: this.$t('pages.pleaseLogin'),
					icon: 'none'
				})
				uni.navigateTo({
					url: '/pages/login/login'
				})
				return
			}
			uni.setNavigationBarTitle({
				title: this.$t('pages.submitFeedback')
			})
		},
		methods: {
			getLang() {
				return uni.getStorageSync('language') || 'zh-CN'
			},
			getAppId() {
				// #ifdef APP-PLUS
				return plus.runtime.appid
				// #endif
				return uni.getStorageSync('app_appid') || ''
			},
			getBaseUrl() {
				return uni.getStorageSync('serverAddress') || 'http://demo.thingspanel.cn'
			},
			getHeaders() {
				const token = uni.getStorageSync('access_token')
				const tenantId = uni.getStorageSync('tenant_id')
				const h = {}
				if (token) h['x-token'] = token
				if (tenantId) h['X-TenantID'] = tenantId
				return h
			},
			getDeviceMeta() {
				const info = uni.getSystemInfoSync()
				let appVersion = ''
				// #ifdef APP-PLUS
				appVersion = plus.runtime.version || ''
				// #endif
				return {
					platform: info.platform || '',
					app_version: appVersion,
					device_model: info.model || '',
					os_version: info.system || ''
				}
			},
			chooseImage() {
				const remain = this.maxImages - this.images.length
				if (remain <= 0) return
				uni.chooseImage({
					count: remain,
					sizeType: ['compressed'],
					success: res => {
						const files = res.tempFilePaths || []
						this.images = this.images.concat(files)
					}
				})
			},
			remove(idx) {
				this.images.splice(idx, 1)
			},
			preview(idx) {
				uni.previewImage({
					current: idx,
					urls: this.images
				})
			},
			uploadOne(filePath) {
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: this.getBaseUrl() + '/api/v1/file/up',
						filePath: filePath,
						name: 'file',
						formData: {
							type: 'feedback'
						},
						header: this.getHeaders(),
						success: (res) => {
							try {
								const data = JSON.parse(res.data || '{}')
								if (data && data.code == 200 && data.data && data.data.path) {
									resolve(data.data.path)
								} else {
									reject(new Error(data.message || 'upload failed'))
								}
							} catch (e) {
								reject(e)
							}
						},
						fail: (err) => reject(err)
					})
				})
			},
			async submit() {
				const appid = this.getAppId()
				if (!appid) {
					uni.showToast({ title: this.$t('pages.appIdMissing'), icon: 'none' })
					return
				}
				if (!this.content || this.content.trim().length === 0) {
					uni.showToast({ title: this.$t('pages.feedbackEmpty'), icon: 'none' })
					return
				}
				this.submitting = true
				try {
					const uploaded = []
					for (let i = 0; i < this.images.length; i++) {
						const p = await this.uploadOne(this.images[i])
						uploaded.push(p)
					}
					const meta = this.getDeviceMeta()
					const res = await this.API.apiRequest('/api/v1/app/content/feedback', {
						appid: appid,
						content: this.content,
						images: uploaded,
						...meta
					}, 'post')
					if (res && res.code == 200) {
						uni.showToast({ title: this.$t('pages.feedbackSubmitSuccess'), icon: 'none' })
						this.content = ''
						this.images = []
						uni.navigateTo({ url: '/pages/feedback/my-feedback' })
					} else {
						uni.showToast({ title: (res && res.message) || this.$t('pages.feedbackSubmitFailed'), icon: 'none' })
					}
				} catch (e) {
					uni.showToast({ title: this.$t('pages.feedbackSubmitFailed'), icon: 'none' })
				} finally {
					this.submitting = false
				}
			},
			goMyFeedback() {
				uni.navigateTo({
					url: '/pages/feedback/my-feedback'
				})
			}
		}
	}
</script>

<style>
	.card {
		background: #fff;
		border-radius: 10px;
		padding: 12px;
		margin-bottom: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
	}

	.label {
		font-size: 14px;
		font-weight: 600;
		color: #333;
		margin-bottom: 8px;
	}

	.textarea {
		width: 100%;
		min-height: 140px;
		font-size: 14px;
		color: #333;
	}

	.count {
		text-align: right;
		color: #999;
		font-size: 12px;
		margin-top: 6px;
	}

	.images {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.img-item {
		width: 90px;
		height: 90px;
		position: relative;
		border-radius: 8px;
		overflow: hidden;
	}

	.img {
		width: 90px;
		height: 90px;
	}

	.img-del {
		position: absolute;
		right: 4px;
		top: 4px;
		width: 18px;
		height: 18px;
		line-height: 18px;
		text-align: center;
		border-radius: 9px;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		font-size: 14px;
	}

	.img-add {
		width: 90px;
		height: 90px;
		border: 1px dashed #ccc;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
	}

	.img-add-plus {
		font-size: 28px;
	}

	.hint {
		margin-top: 8px;
		color: #999;
		font-size: 12px;
	}

	.actions {
		display: flex;
		gap: 12px;
		margin-top: 6px;
	}

	.primary {
		background: #18a058;
		color: #fff;
	}
</style>

