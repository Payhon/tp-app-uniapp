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

<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import $C from '@/common/config'

declare const plus: { runtime: { appid: string } }

type FaqItem = {
	id: number
	question?: string
	answer_html?: string
	is_pinned?: boolean
}
type FaqListRes = { total?: number; list?: FaqItem[] }
type ApiResponse<T> = { code: number; data: T }

const { t } = useI18n()

const list = ref<FaqItem[]>([])
const expanded = ref<Record<number, boolean>>({})
const page = ref<number>(1)
const pageSize = ref<number>(20)
const total = ref<number>(0)
const loading = ref<boolean>(false)

const hasMore = computed(() => list.value.length < total.value)

const getLang = (): string => uni.getStorageSync('language') || 'zh-CN'

const getAppId = (): string => {
	// #ifdef APP-PLUS
	return plus.runtime.appid
	// #endif
	return $C.appId || uni.getStorageSync('app_appid') || ''
}

const getApiRequest = () => {
	const { proxy } = getCurrentInstance() || {}
	return (proxy as any)?.API?.apiRequest as
		| (<T>(url: string, params: Record<string, unknown>, method: string) => Promise<ApiResponse<T>>)
		| undefined
}

const toggle = (id: number) => {
	expanded.value[id] = !expanded.value[id]
}

const load = async (reset: boolean) => {
	const appid = getAppId()
	if (!appid) return
	const apiRequest = getApiRequest()
	if (!apiRequest) return

	if (reset) {
		page.value = 1
		list.value = []
		total.value = 0
		expanded.value = {}
	}

	loading.value = true
	try {
		const res = await apiRequest<FaqListRes>(
			'/api/v1/app/content/faqs',
			{ appid, lang: getLang(), page: page.value, page_size: pageSize.value },
			'get'
		)
		if (res && res.code == 200) {
			total.value = res.data?.total || 0
			const next = res.data?.list || []
			list.value = list.value.concat(next)
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

onLoad(() => {
	uni.setNavigationBarTitle({ title: t('pages.faq') })
	load(true)
})

onReachBottom(() => {
	if (hasMore.value && !loading.value) loadMore()
})
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
