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

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onReachBottom, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { useInjected } from '@/common/composables/useInjected'
import { useAppRuntime } from '@/common/composables/useAppRuntime'

type FeedbackItem = { id: number; status?: string; created_at?: string; content?: string; reply?: string }
type FeedbackMineRes = { total?: number; list?: FeedbackItem[] }

const { t } = useI18n()
const { apiRequest, login } = useInjected()
const { getAppId } = useAppRuntime()

const list = ref<FeedbackItem[]>([])
const page = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>(0)
const loading = ref<boolean>(false)

const hasMore = computed(() => list.value.length < total.value)

const statusLabel = (status?: string) => t(`pages.feedbackStatus.${status}`) || status || ''

const load = async (reset: boolean) => {
	const req = apiRequest
	if (!req) return

	const appid = getAppId()
	if (reset) {
		page.value = 1
		list.value = []
		total.value = 0
	}

	loading.value = true
	try {
		const res = await req<FeedbackMineRes>('/api/v1/app/content/feedback/mine', { appid, page: page.value, page_size: pageSize.value }, 'get')
		if (res && res.code == 200) {
			total.value = res.data.total || 0
			const next = res.data.list || []
			list.value = reset ? next : list.value.concat(next)
		}
	} finally {
		loading.value = false
	}
}

const loadMore = () => {
	if (!hasMore.value) return
	page.value += 1
	load(false)
}

const openDetail = (id: number) => {
	uni.navigateTo({ url: `/pages/feedback/detail?id=${id}` })
}

const goSubmit = () => {
	uni.navigateTo({ url: '/pages/feedback/submit' })
}

onLoad(() => {
	if (!login?.isLoginType?.().isLogin) {
		uni.showToast({ title: t('pages.pleaseLogin'), icon: 'none' })
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	uni.setNavigationBarTitle({ title: t('pages.myFeedback') })
	load(true)
})

onShow(() => {
	if (login?.isLoginType?.().isLogin) load(true)
})

onReachBottom(() => {
	if (hasMore.value && !loading.value) loadMore()
})
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
