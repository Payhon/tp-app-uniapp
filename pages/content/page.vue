<template>
	<view class="tp-box tp-box-sizing tp-pd-l-r-30 tp-pd-t-b-30">
		<view v-if="loading" class="tp-flex tp-flex-j-c tp-flex-a-c tp-mg-t-50">
			<text>{{ $t('common.loading') }}</text>
		</view>
		<view v-else>
			<view v-if="title" class="tp-mg-b-20" style="font-size: 18px; font-weight: 600;">
				{{ title }}
			</view>
			<rich-text :nodes="contentHtml"></rich-text>
			<view v-if="!contentHtml" class="tp-mg-t-30" style="color: #999;">
				{{ $t('common.noData') }}
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				contentKey: '',
				title: '',
				contentHtml: '',
				loading: false
			}
		},
		onLoad(options) {
			this.contentKey = options.key || ''
			this.setTitle()
			this.loadContent()
		},
		methods: {
			setTitle() {
				let t = this.$t('pages.contentPage')
				if (this.contentKey === 'user_policy') t = this.$t('pages.userPolicy')
				if (this.contentKey === 'privacy_policy') t = this.$t('pages.privacyPolicy')
				uni.setNavigationBarTitle({
					title: t
				})
			},
			getLang() {
				return uni.getStorageSync('language') || 'zh-CN'
			},
			getAppId() {
				// #ifdef APP-PLUS
				return plus.runtime.appid
				// #endif
				return uni.getStorageSync('app_appid') || ''
			},
			loadContent() {
				if (!this.contentKey) return
				this.loading = true
				const appid = this.getAppId()
				this.API.apiRequest(`/api/v1/app/content/pages/${this.contentKey}`, {
					appid: appid,
					lang: this.getLang()
				}, 'get').then(res => {
					if (res && res.code == 200) {
						this.title = res.data.title || ''
						this.contentHtml = res.data.content_html || ''
					} else {
						this.contentHtml = ''
					}
				}).catch(() => {
					this.contentHtml = ''
				}).finally(() => {
					this.loading = false
				})
			}
		}
	}
</script>

<style>
</style>

