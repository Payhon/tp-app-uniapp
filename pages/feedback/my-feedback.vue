<template>
	<view class="tp-box tp-box-sizing tp-pd-l-r-30 tp-pd-t-b-30">
		<view class="top-actions">
			<button class="tp-btn primary" @click="goSubmit">{{ $t('pages.submitFeedback') }}</button>
		</view>

		<view v-if="loading" class="tp-flex tp-flex-j-c tp-flex-a-c tp-mg-t-50">
			<text>{{ $t('common.loading') }}</text>
		</view>
		<view v-else>
			<view v-if="list.length === 0" class="tp-mg-t-30" style="color: #999;">
				{{ $t('common.noData') }}
			</view>
			<view v-for="item in list" :key="item.id" class="item" @click="openDetail(item.id)">
				<view class="item-top">
					<text class="status">{{ statusLabel(item.status) }}</text>
					<text class="time">{{ item.created_at || '--' }}</text>
				</view>
				<view class="content">{{ item.content }}</view>
				<view v-if="item.reply" class="reply">
					<text class="reply-label">{{ $t('pages.feedbackReply') }}：</text>
					<text class="reply-text">{{ item.reply }}</text>
				</view>
			</view>

			<view v-if="hasMore" class="tp-mg-t-20 tp-flex tp-flex-j-c">
				<button class="tp-btn" size="mini" @click="loadMore">{{ $t('common.loading') }}</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				page: 1,
				pageSize: 10,
				total: 0,
				loading: false
			}
		},
		computed: {
			hasMore() {
				return this.list.length < this.total
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
				title: this.$t('pages.myFeedback')
			})
			this.load(true)
		},
		onShow() {
			// 处理完后返回刷新
			if (this.$login.isLoginType().isLogin) {
				this.load(true)
			}
		},
		onReachBottom() {
			if (this.hasMore && !this.loading) {
				this.loadMore()
			}
		},
		methods: {
			getAppId() {
				// #ifdef APP-PLUS
				return plus.runtime.appid
				// #endif
				return uni.getStorageSync('app_appid') || ''
			},
			statusLabel(status) {
				return this.$t(`pages.feedbackStatus.${status}`) || status
			},
			load(reset) {
				const appid = this.getAppId()
				if (reset) {
					this.page = 1
					this.list = []
					this.total = 0
				}
				this.loading = true
				this.API.apiRequest('/api/v1/app/content/feedback/mine', {
					appid: appid,
					page: this.page,
					page_size: this.pageSize
				}, 'get').then(res => {
					if (res && res.code == 200) {
						const data = res.data || {}
						this.total = data.total || 0
						const next = data.list || []
						this.list = reset ? next : this.list.concat(next)
					}
				}).catch(() => {}).finally(() => {
					this.loading = false
				})
			},
			loadMore() {
				if (!this.hasMore) return
				this.page += 1
				this.load(false)
			},
			openDetail(id) {
				uni.navigateTo({
					url: '/pages/feedback/detail?id=' + id
				})
			},
			goSubmit() {
				uni.navigateTo({
					url: '/pages/feedback/submit'
				})
			}
		}
	}
</script>

<style>
	.top-actions {
		margin-bottom: 12px;
		display: flex;
		justify-content: flex-end;
	}

	.primary {
		background: #18a058;
		color: #fff;
	}

	.item {
		background: #fff;
		border-radius: 10px;
		padding: 12px;
		margin-bottom: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
	}

	.item-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.status {
		font-size: 12px;
		color: #18a058;
		font-weight: 600;
	}

	.time {
		font-size: 12px;
		color: #999;
	}

	.content {
		font-size: 14px;
		color: #333;
		white-space: pre-wrap;
	}

	.reply {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid #f0f0f0;
		color: #333;
	}

	.reply-label {
		color: #999;
		font-size: 12px;
	}

	.reply-text {
		font-size: 13px;
	}
</style>

