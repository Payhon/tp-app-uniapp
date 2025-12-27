<template>
	<view class="tp-box tp-box-sizing tp-pd-l-r-30 tp-pd-t-b-30">
		<view v-if="loading" class="tp-flex tp-flex-j-c tp-flex-a-c tp-mg-t-50">
			<text>{{ $t('common.loading') }}</text>
		</view>
		<view v-else-if="detail" class="card">
			<view class="row">
				<text class="k">{{ $t('pages.feedbackStatusLabel') }}</text>
				<text class="v">{{ statusLabel(detail.status) }}</text>
			</view>
			<view class="row">
				<text class="k">{{ $t('pages.feedbackCreatedAt') }}</text>
				<text class="v">{{ detail.created_at || '--' }}</text>
			</view>

			<view class="section">
				<view class="k">{{ $t('pages.feedbackContent') }}</view>
				<view class="content">{{ detail.content }}</view>
			</view>

			<view v-if="detail.images && detail.images.length" class="section">
				<view class="k">{{ $t('pages.feedbackImages') }}</view>
				<view class="images">
					<image v-for="(img, idx) in detail.images" :key="img" :src="toPublicUrl(img)" class="img" mode="aspectFill"
						@click="preview(idx)"></image>
				</view>
			</view>

			<view v-if="detail.reply" class="section reply">
				<view class="k">{{ $t('pages.feedbackReply') }}</view>
				<view class="content">{{ detail.reply }}</view>
				<view v-if="detail.replied_at" class="time">{{ detail.replied_at }}</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				id: '',
				loading: false,
				detail: null,
				baseUrl: ''
			}
		},
		onLoad(options) {
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
			this.id = options.id || ''
			this.baseUrl = uni.getStorageSync('serverAddress') || 'http://demo.thingspanel.cn'
			uni.setNavigationBarTitle({
				title: this.$t('pages.feedbackDetail')
			})
			this.load()
		},
		methods: {
			toPublicUrl(path) {
				if (!path) return ''
				// path like "./files/xxx" => "/files/xxx"
				return this.baseUrl + path.slice(1)
			},
			statusLabel(status) {
				return this.$t(`pages.feedbackStatus.${status}`) || status
			},
			preview(idx) {
				const urls = (this.detail.images || []).map(p => this.toPublicUrl(p))
				uni.previewImage({
					current: idx,
					urls: urls
				})
			},
			load() {
				if (!this.id) return
				this.loading = true
				this.API.apiRequest('/api/v1/app/content/feedback/' + this.id, {}, 'get').then(res => {
					if (res && res.code == 200) {
						this.detail = res.data
					}
				}).catch(() => {}).finally(() => {
					this.loading = false
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
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 0;
	}

	.k {
		color: #999;
		font-size: 12px;
	}

	.v {
		color: #333;
		font-size: 12px;
	}

	.section {
		margin-top: 12px;
	}

	.content {
		margin-top: 6px;
		color: #333;
		font-size: 14px;
		white-space: pre-wrap;
		line-height: 1.6;
	}

	.images {
		margin-top: 8px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.img {
		width: 92px;
		height: 92px;
		border-radius: 8px;
	}

	.reply {
		padding-top: 10px;
		border-top: 1px solid #f0f0f0;
	}

	.time {
		margin-top: 6px;
		color: #999;
		font-size: 12px;
	}
</style>

