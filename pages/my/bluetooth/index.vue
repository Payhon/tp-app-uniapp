<template>
	<view class="bluetooth-page">
		<view class="placeholder">
			<text class="placeholder-text">{{ $t('pages.my.bluetoothPlaceholder') }}</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.my.bluetoothTitle')
	})
})
</script>

<style lang="scss" scoped>
.bluetooth-page {
	min-height: 100vh;
	background-color: #f5f6f8;
	display: flex;
	align-items: center;
	justify-content: center;
}

.placeholder {
	text-align: center;
	padding: 40rpx;
}

.placeholder-text {
	font-size: 28rpx;
	color: #999999;
}
</style>
