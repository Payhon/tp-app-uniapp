<template>
	<view class="card" hover-class="card--hover" @tap="onTap" @longpress="onLongPress">
		<view class="status" :class="`status--${device.connectType}`">
			<image class="status__icon" :src="statusIcon" mode="aspectFit" />
			<text class="status__text">{{ statusText }}</text>
		</view>

		<view class="card__top">
			<view class="card__title-wrap">
				<text class="card__title u-line-1">{{ device.name }}</text>
				<text class="card__sub u-line-1">{{ device.model }}</text>
			</view>
		</view>

		<view class="battery">
			<text class="battery__label">{{ $t('home.battery') }}</text>
			<text class="battery__pct">{{ device.batteryPercent }}%</text>
		</view>

		<view class="bar">
			<view class="bar__bg"></view>
			<view class="bar__fg" :style="{ width: barWidth }"></view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { HomeDeviceCardModel } from '@/types/home'

const props = defineProps<{
	device: HomeDeviceCardModel
}>()

const emit = defineEmits<{
	(e: 'select', id: string): void
	(e: 'longpress', device: HomeDeviceCardModel): void
}>()

const { t } = useI18n()

const onTap = () => emit('select', String(props.device.id))
const onLongPress = () => emit('longpress', props.device)

const statusText = computed(() => {
	if (props.device.connectType === 'bluetooth') return t('home.status.bluetooth') as string
	if (props.device.connectType === 'mqtt') return t('home.status.mqttOnline') as string
	return t('home.status.offline') as string
})

const statusIcon = computed(() => {
	if (props.device.connectType === 'bluetooth') return '/static/image/home/icon-bluetooth@2x.png'
	if (props.device.connectType === 'mqtt') return '/static/image/home/icon-wifi@2x.png'
	return '/static/image/home/icon-unlink@2x.png'
})

const barWidth = computed(() => `${Math.max(0, Math.min(100, Number(props.device.batteryPercent || 0)))}%`)
</script>

<style lang="scss" scoped>
.card {
	position: relative;
	background: #ffffff;
	border-radius: 22rpx;
	padding: 24rpx;
	box-sizing: border-box;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
	margin-bottom: 22rpx;
}

.card--hover {
	opacity: 0.92;
}

.card__top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16rpx;
}

.card__title-wrap {
	flex: 1;
	min-width: 0;
	padding-right: 170rpx; // avoid overlap with status corner tag
}

.card__title {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #333333;
}

.card__sub {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #9aa0a6;
}

.status {
	position: absolute;
	top: 0;
	right: 0;
	height: 56rpx;
	padding: 0 18rpx 0 16rpx;
	border-top-right-radius: 22rpx;
	border-bottom-left-radius: 22rpx;
	display: flex;
	align-items: center;
	gap: 8rpx;
	flex-shrink: 0;
}

.status__icon {
	width: 24rpx;
	height: 24rpx;
}

.status__text {
	font-size: 22rpx;
}

.status--bluetooth {
	background: rgba(33, 155, 255, 0.12);
	color: #219bff;
}

.status--mqtt {
	background: rgba(29, 207, 102, 0.12);
	color: #1dcf66;
}

.status--offline {
	background: rgba(160, 160, 160, 0.12);
	color: #a0a0a0;
}

.battery {
	margin-top: 28rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.battery__label {
	font-size: 24rpx;
	color: #333333;
}

.battery__pct {
	font-size: 24rpx;
	color: #333333;
}

.bar {
	position: relative;
	margin-top: 12rpx;
	height: 12rpx;
	border-radius: 999px;
	overflow: hidden;
}

.bar__bg {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	background: #e8eefc;
}

.bar__fg {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	background-image: linear-gradient(90deg, #0b2dff 0%, #00c2ff 100%);
	border-radius: 999px;
}
</style>
