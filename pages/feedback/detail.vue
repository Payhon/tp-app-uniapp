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

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { useInjected } from '@/common/composables/useInjected'
import { useAppRuntime } from '@/common/composables/useAppRuntime'

type FeedbackDetail = {
	status?: string
	created_at?: string
	content?: string
	images?: string[]
	reply?: string
	replied_at?: string
}

const { t } = useI18n()
const { apiRequest, login } = useInjected()
const { getBaseUrl } = useAppRuntime()

const id = ref<string>('')
const loading = ref<boolean>(false)
const detail = ref<FeedbackDetail | null>(null)
const baseUrl = ref<string>('')

const toPublicUrl = (path: string) => {
	if (!path) return ''
	return baseUrl.value + path.slice(1)
}

const statusLabel = (status?: string) => t(`pages.feedbackStatus.${status}`) || status || ''

const preview = (idx: number) => {
	const urls = (detail.value?.images || []).map((p) => toPublicUrl(p))
	uni.previewImage({ current: idx, urls })
}

const load = async () => {
	if (!id.value) return
	const req = apiRequest
	if (!req) return

	loading.value = true
	try {
		const res = await req<FeedbackDetail>(`/api/v1/app/content/feedback/${id.value}`, {}, 'get')
		if (res && res.code == 200) detail.value = res.data
	} finally {
		loading.value = false
	}
}

onLoad((options) => {
	if (!login?.isLoginType?.().isLogin) {
		uni.showToast({ title: t('pages.pleaseLogin'), icon: 'none' })
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	const opt = options as Record<string, string | undefined>
	id.value = opt.id || ''
	baseUrl.value = getBaseUrl()
	uni.setNavigationBarTitle({ title: t('pages.feedbackDetail') })
	load()
})
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
