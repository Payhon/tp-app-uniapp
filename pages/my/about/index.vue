<template>
	<view class="about-page">
		<view class="card">
			<view class="row">
				<text class="label">{{ $t('pages.my.aboutPage.version') }}</text>
				<view class="right">
					<text class="value">{{ appVersion || '--' }}</text>
				</view>
			</view>
			<view class="divider"></view>
			<view class="row">
				<text class="label">{{ $t('pages.my.aboutPage.vendor') }}</text>
				<view class="right">
					<text class="value">{{ vendorName }}</text>
				</view>
			</view>
			<view class="divider"></view>
			<view class="row" hover-class="row--hover" @tap="openContent('user_policy')">
				<text class="label">{{ $t('pages.my.aboutPage.userPolicy') }}</text>
				<view class="right">
					<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
				</view>
			</view>
			<view class="divider"></view>
			<view class="row" hover-class="row--hover" @tap="openContent('privacy_policy')">
				<text class="label">{{ $t('pages.my.aboutPage.privacyPolicy') }}</text>
				<view class="right">
					<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
				</view>
			</view>
		</view>

		<view class="content-card card--mt">
			<view v-if="loading" class="loading">
				<text class="loading-text">{{ $t('common.loading') }}</text>
			</view>
			<view v-else-if="contentMarkdown">
				<u-markdown :content="contentMarkdown"></u-markdown>
			</view>
			<view v-else class="empty">
				<text class="empty-text">{{ $t('common.noData') }}</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { useInjected } from '@/common/composables/useInjected'
import { useAppRuntime } from '@/common/composables/useAppRuntime'

const { t } = useI18n()
const { apiRequest } = useInjected()
const { getAppId, getLang } = useAppRuntime()

type ContentPage = { title?: string; content_markdown?: string }

const loading = ref<boolean>(false)
const contentMarkdown = ref<string>('')

const vendorName = computed(() => t('pages.my.aboutPage.vendorName') as string)
const appVersion = ref<string>('')

declare const plus: { runtime?: { version?: string } }
declare const wx: { getAccountInfoSync?: () => any }

const loadVersion = () => {
	let v = ''
	// #ifdef APP-PLUS
	try {
		v = String(plus?.runtime?.version || '')
	} catch {}
	// #endif
	// #ifdef MP-WEIXIN
	try {
		v = String(wx?.getAccountInfoSync?.()?.miniProgram?.version || '')
	} catch {}
	// #endif
	appVersion.value = v
}

const loadContent = async () => {
	if (!apiRequest) return
	const appid = getAppId()
	if (!appid) return
	loading.value = true
	try {
		const res = await apiRequest<ContentPage>('/api/v1/app/content/pages/about_us', { appid, lang: getLang() }, 'get')
		if (res && (res as any).code == 200) {
			contentMarkdown.value = String((res as any).data?.content_markdown || '')
		} else {
			contentMarkdown.value = ''
		}
	} finally {
		loading.value = false
	}
}

const openContent = (key: string) => {
	uni.navigateTo({ url: `/pages/content/page?key=${key}` })
}

onLoad(() => {
	loadVersion()
	loadContent()
})

onShow(() => {
	uni.setNavigationBarTitle({ title: t('pages.my.aboutTitle') as string })
})
</script>

<style lang="scss" scoped>
.about-page {
	min-height: 100vh;
	background-color: #f5f6f8;
	padding: 24rpx 30rpx 40rpx;
	box-sizing: border-box;
}

.card {
	background: #fff;
	border-radius: 20rpx;
	box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.06);
	overflow: hidden;
}

.card--mt {
	margin-top: 24rpx;
}

.row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 26rpx 24rpx;
	background: #fff;
}

.row--hover {
	background: rgba(0, 0, 0, 0.03);
}

.label {
	font-size: 28rpx;
	color: #1f1f1f;
}

.right {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.value {
	font-size: 26rpx;
	color: #606266;
}

.divider {
	height: 2rpx;
	background: #f1f2f4;
	margin-left: 24rpx;
}

.content-card {
	background: #fff;
	border-radius: 20rpx;
	box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.06);
	padding: 20rpx 18rpx;
	box-sizing: border-box;
}

.loading {
	padding: 60rpx 0;
	text-align: center;
}

.loading-text {
	font-size: 26rpx;
	color: #909399;
}

.empty {
	padding: 60rpx 0;
	text-align: center;
}

.empty-text {
	font-size: 26rpx;
	color: #909399;
}
</style>
