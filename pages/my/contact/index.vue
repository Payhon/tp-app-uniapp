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
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { useInjected } from '@/common/composables/useInjected'
import { useAppRuntime } from '@/common/composables/useAppRuntime'

type ContentPage = { title?: string; content_html?: string }

const { t } = useI18n()
const { apiRequest } = useInjected()
const { getAppId, getLang } = useAppRuntime()

const title = ref<string>('')
const contentHtml = ref<string>('')
const loading = ref<boolean>(false)

const setPageTitle = () => {
	uni.setNavigationBarTitle({ title: t('pages.contactService') as string })
}

const loadContent = async () => {
	if (!apiRequest) return
	const appid = getAppId()
	if (!appid) return

	loading.value = true
	try {
		const res = await apiRequest<ContentPage>('/api/v1/app/content/pages/contact_service', { appid, lang: getLang() }, 'get')
		if (res && (res as any).code == 200) {
			title.value = String((res as any).data?.title || '')
			contentHtml.value = String((res as any).data?.content_html || '')
		} else {
			title.value = ''
			contentHtml.value = ''
		}
	} catch {
		title.value = ''
		contentHtml.value = ''
	} finally {
		loading.value = false
	}
}

onLoad(() => {
	setPageTitle()
	loadContent()
})

onShow(() => {
	setPageTitle()
})
</script>

<style>
</style>
