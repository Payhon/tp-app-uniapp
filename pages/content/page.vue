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

<script setup lang="ts">
import { getCurrentInstance, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

declare const plus: { runtime: { appid: string } }

type ContentPage = { title?: string; content_html?: string }
type ApiResponse<T> = { code: number; data: T }

const { t } = useI18n()

const contentKey = ref<string>('')
const title = ref<string>('')
const contentHtml = ref<string>('')
const loading = ref<boolean>(false)

const getLang = (): string => uni.getStorageSync('language') || 'zh-CN'

const getAppId = (): string => {
	// #ifdef APP-PLUS
	return plus.runtime.appid
	// #endif
	return uni.getStorageSync('app_appid') || ''
}

const getApiRequest = () => {
	const { proxy } = getCurrentInstance() || {}
	return (proxy as any)?.API?.apiRequest as
		| (<T>(url: string, params: Record<string, unknown>, method: string) => Promise<ApiResponse<T>>)
		| undefined
}

const setTitle = () => {
	let pageTitle = t('pages.contentPage')
	if (contentKey.value === 'user_policy') pageTitle = t('pages.userPolicy')
	if (contentKey.value === 'privacy_policy') pageTitle = t('pages.privacyPolicy')
	uni.setNavigationBarTitle({ title: pageTitle })
}

const loadContent = async () => {
	if (!contentKey.value) return
	const apiRequest = getApiRequest()
	if (!apiRequest) return

	loading.value = true
	try {
		const appid = getAppId()
		const res = await apiRequest<ContentPage>(`/api/v1/app/content/pages/${contentKey.value}`, { appid, lang: getLang() }, 'get')
		if (res && res.code == 200) {
			title.value = res.data.title || ''
			contentHtml.value = res.data.content_html || ''
		} else {
			contentHtml.value = ''
		}
	} catch {
		contentHtml.value = ''
	} finally {
		loading.value = false
	}
}

onLoad((options) => {
	const opt = options as Record<string, string | undefined>
	contentKey.value = opt.key || ''
	setTitle()
	loadContent()
})
</script>

<style>
</style>
