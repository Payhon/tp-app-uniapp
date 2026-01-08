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

onShow(() => {
	uni.setNavigationBarTitle({ title: t('pages.deviceDetailTitle') })
})

onLoad((options) => {
	const opt = options as Record<string, string | undefined>
	const decodedUrl = decodeURIComponent(opt.url || '')
	const lang = uni.getStorageSync('language')
	const separator = decodedUrl.includes('?') ? '&' : '?'
	url.value = `${decodedUrl}${separator}lang=${lang}`
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
