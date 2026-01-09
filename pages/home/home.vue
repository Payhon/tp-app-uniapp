<template>
	<view class="home-page">
		<image class="home-bg" src="/static/image/bg@2x.png" mode="aspectFill" />

		<view class="home-top">
			<image class="home-top-bg" src="/static/image/home/home-top@2x.png" mode="widthFix" />

			<view class="alarm-btn" @tap="goAlarm">
				<u-icon name="bell" size="14" color="#FFFFFF"></u-icon>
				<text class="alarm-btn__text">{{ $t('home.alarmDevices') }}</text>
			</view>
		</view>

		<view class="device-panel">
			<view class="device-panel__header">
				<text class="device-panel__title">{{ $t('home.myDevices') }}</text>
				<image class="device-panel__filter" src="/static/image/home/icon-filter@2x.png" mode="aspectFit" />
			</view>

			<view v-if="!isLoggedIn || !deviceCards.length" class="empty">
				<image class="empty__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
				<text class="empty__text">{{ $t('home.emptyTip') }}</text>
			</view>

			<scroll-view v-else class="list" scroll-y>
				<view class="list__inner">
					<home-device-card v-for="item in deviceCards" :key="item.id" :device="item" @select="goDeviceDetail"></home-device-card>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'

import HomeDeviceCard from '@/components/home/device-card.vue'
import { deviceList, deviceMapTelemetry } from '@/service/device'
import type { HomeDeviceCardModel } from '@/types/home'

type DeviceListItem = {
	id: string
	name?: string
	device_config_name?: string
	is_online?: number
	protocol_type?: string
	access_way?: string
	[key: string]: unknown
}

type TelemetryItem = {
	key?: string
	value?: unknown
	label?: string | null
	unit?: string | null
}

type TelemetryMapRsp = {
	device_id?: string
	device_name?: string
	is_online?: number
	last_push_time?: string | null
	telemetry_data?: TelemetryItem[]
	[key: string]: unknown
}

const isLoggedIn = computed(() => Boolean(uni.getStorageSync('access_token')))
const deviceCards = ref<HomeDeviceCardModel[]>([])
const loading = ref(false)

const parseBatteryPercent = (data: TelemetryMapRsp | null | undefined) => {
	const list = Array.isArray(data?.telemetry_data) ? data?.telemetry_data : []
	const candidates = ['battery', 'battery_percent', 'bat', 'soc', 'SOC', 'bms_soc', 'bmsSoc']
	for (const key of candidates) {
		const hit = list.find((x) => String(x?.key || '') === key)
		if (!hit) continue
		const raw = hit.value as unknown
		const num = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim())
		if (!Number.isFinite(num)) continue
		return Math.max(0, Math.min(100, Math.round(num)))
	}
	return 0
}

const guessConnectType = (d: DeviceListItem): HomeDeviceCardModel['connectType'] => {
	if (Number(d?.is_online || 0) !== 1) return 'offline'
	const p = String(d?.protocol_type || '').toLowerCase()
	const a = String(d?.access_way || '').toLowerCase()
	if (p.includes('bluetooth') || a.includes('bluetooth')) return 'bluetooth'
	return 'mqtt'
}

const toHomeModel = async (d: DeviceListItem): Promise<HomeDeviceCardModel> => {
	let batteryPercent = 0
	try {
		const rsp = await deviceMapTelemetry(d.id)
		if (rsp && (rsp as any).code === 200) {
			batteryPercent = parseBatteryPercent((rsp as any).data as TelemetryMapRsp)
		}
	} catch (e) {}

	return {
		id: d.id,
		name: String(d?.name || '').trim() || '-',
		model: String(d?.device_config_name || '').trim() || '-',
		isOnline: Number(d?.is_online || 0) === 1,
		connectType: guessConnectType(d),
		batteryPercent
	}
}

const load = async () => {
	if (loading.value) return
	loading.value = true
	try {
		if (!isLoggedIn.value) {
			deviceCards.value = []
			return
		}

		const rsp = await deviceList({ page: 1, page_size: 50 })
		if (!rsp || (rsp as any).code !== 200) {
			deviceCards.value = []
			return
		}

		const rawList = (rsp as any).data?.list as unknown
		const list = Array.isArray(rawList) ? (rawList as DeviceListItem[]) : []

		const out: HomeDeviceCardModel[] = []
		for (const item of list) {
			if (!item || !item.id) continue
			// eslint-disable-next-line no-await-in-loop
			out.push(await toHomeModel(item))
		}
		deviceCards.value = out
	} finally {
		loading.value = false
		try {
			uni.stopPullDownRefresh()
		} catch (e) {}
	}
}

const goAlarm = () => {
	uni.navigateTo({ url: '/pages/alarm/alarm' })
}

const goDeviceDetail = (id: string) => {
	uni.navigateTo({ url: `/pages/device-battery/detail?device_id=${encodeURIComponent(String(id || ''))}` })
}

const setMpTabSelected = () => {
	// #ifdef MP-WEIXIN
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pages = (globalThis as any).getCurrentPages?.() as any[] | undefined
		const current = pages && pages.length ? pages[pages.length - 1] : null
		const tabBar = current?.getTabBar?.()
		tabBar?.setSelected?.(0)
	} catch (e) {}
	// #endif
}

onShow(() => {
	setMpTabSelected()
	load()
})

onPullDownRefresh(() => load())
</script>

<style lang="scss" scoped>
.home-page {
	position: relative;
	min-height: 100vh;
	background: #f5f6f8;
}

.home-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 100%;
	width: 100%;
	z-index: 0;
}

.home-top {
	position: relative;
	z-index: 1;
}

.home-top-bg {
	width: 100%;
	display: block;
}

.alarm-btn {
	position: absolute;
	right: 24rpx;
	top: 96rpx;
	height: 56rpx;
	padding: 0 22rpx;
	border-radius: 28rpx;
	background: #ff4d3f;
	display: flex;
	align-items: center;
	gap: 10rpx;
	box-sizing: border-box;
}

.alarm-btn__text {
	color: #ffffff;
	font-size: 26rpx;
}

.device-panel {
	position: relative;
	z-index: 1;
	margin-top: -34rpx;
	border-top-left-radius: 32rpx;
	border-top-right-radius: 32rpx;
	background: #ffffff;
	min-height: 70vh;
	padding: 28rpx 28rpx 0;
	box-sizing: border-box;
}

.device-panel__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 16rpx;
}

.device-panel__title {
	font-size: 34rpx;
	font-weight: 600;
	color: #1d1d1d;
}

.device-panel__filter {
	width: 44rpx;
	height: 44rpx;
}

.empty {
	height: 64vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.empty__img {
	width: 340rpx;
	height: 260rpx;
}

.empty__text {
	margin-top: 24rpx;
	color: #a6a6a6;
	font-size: 26rpx;
}

.list {
	height: 64vh;
}

.list__inner {
	padding-bottom: 40rpx;
}
</style>
