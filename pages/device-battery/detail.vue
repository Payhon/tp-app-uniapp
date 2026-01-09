<template>
	<view class="page">
		<image class="bg" src="/static/image/bg@2x.png" mode="aspectFill" />

		<view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav__inner">
				<view class="nav__left" hover-class="nav__left--hover" @tap="goBack">
					<u-icon name="arrow-left" size="20" color="#333333"></u-icon>
				</view>
				<view class="nav__title u-line-1">{{ titleText }}</view>
				<view class="nav__right">
					<view class="conn-pill" :class="`conn-pill--${connType}`">
						<image class="conn-pill__icon" :src="connIcon" mode="aspectFit" />
						<text class="conn-pill__text">{{ connText }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="content" :style="{ paddingTop: navHeight + 'px' }">
			<dashboard-tab
				v-if="activeTab === 0"
				:battery="battery"
				:status="status"
				:connType="connType"
			/>
			<cells-tab v-else-if="activeTab === 1" :status="status" />
			<params-tab v-else :battery="battery" :status="status" :client="client" :connType="connType" />
		</view>

		<view class="bottom-bar" :style="{ paddingBottom: safeBottom + 'px' }">
			<view class="bottom-bar__inner">
				<view class="tab" hover-class="tab--hover" @tap="activeTab = 0">
					<image class="tab__icon" :src="activeTab === 0 ? '/static/image/device/navbar-dashboard-on@2x.png' : '/static/image/device/navbar-dashboard@2x.png'" mode="aspectFit" />
					<text class="tab__text" :class="{ 'tab__text--on': activeTab === 0 }">{{ $t('deviceDetail.tabs.dashboard') }}</text>
				</view>
				<view class="tab" hover-class="tab--hover" @tap="activeTab = 1">
					<image class="tab__icon" :src="activeTab === 1 ? '/static/image/device/navbar-cell-on@2x.png' : '/static/image/device/navbar-cell@2x.png'" mode="aspectFit" />
					<text class="tab__text" :class="{ 'tab__text--on': activeTab === 1 }">{{ $t('deviceDetail.tabs.cells') }}</text>
				</view>
				<view class="tab" hover-class="tab--hover" @tap="activeTab = 2">
					<image class="tab__icon" :src="activeTab === 2 ? '/static/image/device/navbar-params-on@2x.png' : '/static/image/device/navbar-params@2x.png'" mode="aspectFit" />
					<text class="tab__text" :class="{ 'tab__text--on': activeTab === 2 }">{{ $t('deviceDetail.tabs.params') }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import DashboardTab from './components/dashboard-tab.vue'
import CellsTab from './components/cells-tab.vue'
import ParamsTab from './components/params-tab.vue'

import { appBatteryDetail, type AppBatteryDetail } from '@/service/app-battery'
import $C from '@/common/config'
import { BmsClient, createUniBleBmsTransport, createUniMqttSocketBmsTransport, type UniBleBmsTransport, type UniMqttSocketBmsTransport } from '@/common/lib/bms-protocol'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'
import { getWindowInfo } from '@/common/platform'

const { t } = useI18n()

const activeTab = ref<0 | 1 | 2>(0)
const deviceId = ref('')
const battery = ref<AppBatteryDetail | null>(null)
const status = ref<BmsStatus | null>(null)
const client = ref<BmsClient | null>(null)

// 连接类型：后续接入 BLE/MQTT 透传时会更新
const connType = ref<'bluetooth' | 'mqtt' | 'offline'>('offline')
const connecting = ref(false)

const statusBarHeight = getWindowInfo().statusBarHeight || 0
const safeBottom = getWindowInfo().safeAreaInsets?.bottom || 0
const navHeight = 44 + statusBarHeight

const titleText = computed(() => {
	const name = String(battery.value?.device_name || '').trim()
	return name || t('pages.deviceDetailTitle')
})

const connText = computed(() => {
	if (connType.value === 'bluetooth') return t('deviceDetail.conn.bluetooth') as string
	if (connType.value === 'mqtt') return t('deviceDetail.conn.mqtt') as string
	return t('deviceDetail.conn.offline') as string
})

const connIcon = computed(() => {
	if (connType.value === 'bluetooth') return '/static/image/device/icon-bluetoolth@2x.png'
	if (connType.value === 'mqtt') return '/static/image/home/icon-wifi@2x.png'
	return '/static/image/home/icon-unlink@2x.png'
})

const goBack = () => uni.navigateBack()

let pollTimer: number | null = null
let bleTransport: UniBleBmsTransport | null = null
let mqttTransport: UniMqttSocketBmsTransport | null = null

const normalizeMac = (s: unknown) =>
	String(s || '')
		.trim()
		.toUpperCase()
		.replace(/[^0-9A-F]/g, '')

const buildWsUrl = () => {
	const stored = String(uni.getStorageSync('serverAddress') || '').trim()
	const base = stored || String($C.apiBaseUrl || '').trim()
	const noSlash = base.endsWith('/') ? base.slice(0, -1) : base
	if (noSlash.startsWith('wss://') || noSlash.startsWith('ws://')) return `${noSlash}/api/v1/app/battery/socket/ws`
	if (noSlash.startsWith('https://')) return `wss://${noSlash.slice('https://'.length)}/api/v1/app/battery/socket/ws`
	if (noSlash.startsWith('http://')) return `ws://${noSlash.slice('http://'.length)}/api/v1/app/battery/socket/ws`
	return `${noSlash}/api/v1/app/battery/socket/ws`
}

const stopPolling = () => {
	if (pollTimer != null) {
		clearInterval(pollTimer)
		pollTimer = null
	}
}

const startPolling = (c: BmsClient) => {
	stopPolling()
	const run = async () => {
		try {
			status.value = await c.readAllStatus()
		} catch (e) {
			// ignore polling error; connection may recover
		}
	}
	run()
	pollTimer = setInterval(run, 2000) as unknown as number
}

const disconnectAll = async () => {
	stopPolling()
	client.value = null
	connType.value = 'offline'
	try {
		await bleTransport?.disconnect()
	} catch (e) {}
	try {
		await mqttTransport?.disconnect()
	} catch (e) {}
	bleTransport = null
	mqttTransport = null
}

const connectBleFirst = async (): Promise<boolean> => {
	const targetMac = normalizeMac(battery.value?.ble_mac)
	if (!targetMac) return false

	try {
		bleTransport = createUniBleBmsTransport({})
		const list = await bleTransport.discover({ durationMs: 2500 })
		const hit = list.find((d: any) => {
			const idNorm = normalizeMac(d?.deviceId)
			const nameNorm = normalizeMac(d?.name || d?.localName)
			if (idNorm && idNorm === targetMac) return true
			if (nameNorm && nameNorm.includes(targetMac)) return true
			if (nameNorm && targetMac.length >= 6 && nameNorm.includes(targetMac.slice(-6))) return true
			return false
		})
		if (!hit?.deviceId) return false

		await bleTransport.connect({ deviceId: hit.deviceId })
		const c = new BmsClient({ transport: bleTransport })
		client.value = c
		connType.value = 'bluetooth'
		startPolling(c)
		return true
	} catch (e) {
		try {
			await bleTransport?.disconnect()
		} catch (e2) {}
		bleTransport = null
		return false
	}
}

const connectMqttSocket = async (): Promise<boolean> => {
	try {
		const token = String(uni.getStorageSync('access_token') || '').trim()
		if (!token) throw new Error('token missing')
		mqttTransport = createUniMqttSocketBmsTransport({ wsUrl: buildWsUrl(), deviceId: deviceId.value, token })
		await mqttTransport.connect()
		const c = new BmsClient({ transport: mqttTransport })
		client.value = c
		connType.value = 'mqtt'
		startPolling(c)
		return true
	} catch (e) {
		try {
			await mqttTransport?.disconnect()
		} catch (e2) {}
		mqttTransport = null
		return false
	}
}

const connectAuto = async () => {
	if (!deviceId.value || connecting.value) return
	connecting.value = true
	try {
		await disconnectAll()
		if (await connectBleFirst()) return
		if (await connectMqttSocket()) return
		connType.value = 'offline'
	} finally {
		connecting.value = false
	}
}

const load = async () => {
	if (!deviceId.value) return
	const rsp = await appBatteryDetail(deviceId.value)
	if (rsp && (rsp as any).code === 200) {
		battery.value = (rsp as any).data as AppBatteryDetail
		connectAuto()
	}
}

onLoad((query) => {
	deviceId.value = String((query as any)?.device_id || (query as any)?.id || '').trim()
	load()
})

onUnload(() => {
	disconnectAll()
})
</script>

<style lang="scss" scoped>
.page {
	position: relative;
	min-height: 100vh;
	background: #f5f6f8;
}

.bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 100%;
	width: 100%;
	z-index: 0;
}

.nav {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	z-index: 10;
}

.nav__inner {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24rpx;
	box-sizing: border-box;
}

.nav__left {
	width: 64rpx;
	height: 64rpx;
	border-radius: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.8);
}

.nav__left--hover {
	opacity: 0.85;
}

.nav__title {
	flex: 1;
	min-width: 0;
	margin: 0 16rpx;
	font-size: 30rpx;
	font-weight: 600;
	color: #333333;
	text-align: center;
}

.nav__right {
	width: 200rpx;
	display: flex;
	justify-content: flex-end;
}

.conn-pill {
	height: 44rpx;
	padding: 0 16rpx;
	border-radius: 22rpx;
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	background: rgba(11, 59, 255, 0.12);
	color: #0b3bff;
}

.conn-pill--mqtt {
	background: rgba(29, 207, 102, 0.12);
	color: #1dcf66;
}

.conn-pill--offline {
	background: rgba(160, 160, 160, 0.12);
	color: #a0a0a0;
}

.conn-pill__icon {
	width: 24rpx;
	height: 24rpx;
}

.conn-pill__text {
	font-size: 22rpx;
}

.content {
	position: relative;
	z-index: 1;
	padding-bottom: 160rpx;
	box-sizing: border-box;
}

.bottom-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 10;
	padding: 18rpx 24rpx 0;
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(12px);
	border-top-left-radius: 28rpx;
	border-top-right-radius: 28rpx;
}

.bottom-bar__inner {
	display: flex;
	align-items: center;
	justify-content: space-around;
	height: 108rpx;
}

.tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	gap: 6rpx;
}

.tab--hover {
	opacity: 0.85;
}

.tab__icon {
	width: 44rpx;
	height: 44rpx;
}

.tab__text {
	font-size: 22rpx;
	color: #8e95a2;
}

.tab__text--on {
	color: #0b3bff;
	font-weight: 600;
}
</style>
