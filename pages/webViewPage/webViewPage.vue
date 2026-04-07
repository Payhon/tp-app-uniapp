<template>
  <view class="web-view-page">
    <web-view :src="url" :style="{ width: '100%', height: '100%' }" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const url = ref<string>('')
const pageTitle = ref<string>('')

onShow(() => {
	uni.setNavigationBarTitle({ title: pageTitle.value || (t('pages.deviceDetailTitle') as string) })
})

onLoad((options) => {
	const opt = options as Record<string, string | undefined>
	const decodedUrl = decodeURIComponent(opt.url || '')
	const lang = String(opt.lang || uni.getStorageSync('language') || 'zh-CN').trim() || 'zh-CN'
	const title = decodeURIComponent(opt.title || '')
	const hasLang = /[?&]lang=/.test(decodedUrl)
	const separator = decodedUrl.includes('?') ? '&' : '?'

	pageTitle.value = title
	uni.setNavigationBarTitle({ title: pageTitle.value || (t('pages.deviceDetailTitle') as string) })
	url.value = hasLang ? decodedUrl : `${decodedUrl}${separator}lang=${encodeURIComponent(lang)}`
})
</script>

<style scoped>
.web-view-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
