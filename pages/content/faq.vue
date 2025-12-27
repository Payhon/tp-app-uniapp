<template>
	<view class="tp-box tp-box-sizing tp-pd-l-r-30 tp-pd-t-b-30">
		<view v-if="loading" class="tp-flex tp-flex-j-c tp-flex-a-c tp-mg-t-50">
			<text>{{ $t('common.loading') }}</text>
		</view>
		<view v-else>
			<view v-if="list.length === 0" class="tp-mg-t-30" style="color: #999;">
				{{ $t('common.noData') }}
			</view>
			<view v-for="item in list" :key="item.id" class="faq-item" @click="toggle(item.id)">
				<view class="faq-q">
					<view class="faq-q-left">
						<text v-if="item.is_pinned" class="tag">{{ $t('pages.faqPinned') }}</text>
						<text class="q-text">{{ item.question || '-' }}</text>
					</view>
					<text class="arrow">{{ expanded[item.id] ? '▲' : '▼' }}</text>
				</view>
				<view v-if="expanded[item.id]" class="faq-a">
					<rich-text :nodes="item.answer_html"></rich-text>
				</view>
			</view>

			<view v-if="hasMore" class="tp-mg-t-20 tp-flex tp-flex-j-c">
				<button class="tp-btn" size="mini" @click.stop="loadMore">{{ $t('common.loading') }}</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				expanded: {},
				page: 1,
				pageSize: 20,
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
			uni.setNavigationBarTitle({
				title: this.$t('pages.faq')
			})
			this.load(true)
		},
		onReachBottom() {
			if (this.hasMore && !this.loading) {
				this.loadMore()
			}
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
			toggle(id) {
				this.$set(this.expanded, id, !this.expanded[id])
			},
			load(reset) {
				const appid = this.getAppId()
				if (!appid) return
				if (reset) {
					this.page = 1
					this.list = []
					this.total = 0
					this.expanded = {}
				}
				this.loading = true
				this.API.apiRequest('/api/v1/app/content/faqs', {
					appid: appid,
					lang: this.getLang(),
					page: this.page,
					page_size: this.pageSize
				}, 'get').then(res => {
					if (res && res.code == 200) {
						const data = res.data || {}
						this.total = data.total || 0
						const next = data.list || []
						this.list = this.list.concat(next)
					}
				}).catch(() => {}).finally(() => {
					this.loading = false
				})
			},
			loadMore() {
				if (!this.hasMore) return
				this.page += 1
				this.load(false)
			}
		}
	}
</script>

<style>
	.faq-item {
		background: #fff;
		border-radius: 8px;
		padding: 12px;
		margin-bottom: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
	}

	.faq-q {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.faq-q-left {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
	}

	.tag {
		font-size: 12px;
		color: #fff;
		background: #f0a020;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.q-text {
		font-size: 15px;
		font-weight: 600;
		color: #333;
	}

	.arrow {
		color: #999;
		font-size: 12px;
	}

	.faq-a {
		margin-top: 10px;
		color: #444;
		font-size: 14px;
		line-height: 1.6;
	}
</style>

