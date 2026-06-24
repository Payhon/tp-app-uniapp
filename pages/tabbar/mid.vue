<template>
	<view class="tabbar-mid-page"></view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { showAddDeviceActionSheet } from '@/common/composables/useAddDeviceActionSheet'

const LAST_TAB_URL_KEY = '__last_tab_url__'

onShow(() => {
	// 作为 App-Plus 的“中间凸起按钮”兜底页：
	// - 某些基座/机型 midButton 点击不触发生命周期 hook
	// - 此时会切到 tabBar 的中间页；在这里主动弹出 ActionSheet
	const baseTabUrl = String(uni.getStorageSync(LAST_TAB_URL_KEY) || '/pages/home/home')
	const handled = showAddDeviceActionSheet({ baseTabUrl })
	if (!handled) {
		uni.switchTab({ url: baseTabUrl })
	}
})
</script>

<style scoped>
.tabbar-mid-page {
	/* 占位页面：保持空白即可 */
	width: 100%;
	height: 100%;
}
</style>
