<template>
	<view :style="{ height: pageHeight, background: '#f5f5f5' }">
		<customNav :pageTitle="$t('pages.deviceProvision.bleSearchTitle')" iconColor="#fff" background="#246FDD" fontColor="#fff" />

		<view class="wrap" :style="{ marginTop: marginTopHeight }">
			<view class="hint" v-if="targetMac">
				<text class="hint-text">{{ $t('pages.deviceProvision.matchingMac', { mac: targetMacDisplay }) }}</text>
			</view>

			<view class="actions">
				<u-button type="primary" size="small" :loading="starting" @click="toggleScan">
					{{ isScanning ? $t('pages.deviceProvision.stopScan') : $t('pages.deviceProvision.startScan') }}
				</u-button>
				<u-button type="default" size="small" @click="clearList">{{ $t('pages.deviceProvision.clearList') }}</u-button>
			</view>

			<view class="status" v-if="errorMsg">
				<text class="status-error">{{ errorMsg }}</text>
			</view>

			<scroll-view scroll-y class="list">
				<view v-for="d in visibleDevices" :key="d.deviceId" class="item" @click="selectDevice(d)">
					<view class="item-main">
						<text class="item-name">{{ d.displayName }}</text>
						<text class="item-rssi">{{ d.RSSI == null ? '' : $t('pages.deviceProvision.rssi', { rssi: d.RSSI }) }}</text>
					</view>
					<view class="item-sub">
						<text class="item-sub-text">{{ d.deviceId }}</text>
					</view>
					<view class="item-sub" v-if="d.advMac">
						<text class="item-sub-text">{{ $t('pages.deviceProvision.advMac', { mac: d.advMac }) }}</text>
						<text v-if="targetMac && d.advMac === targetMac" class="item-match">{{ $t('pages.deviceProvision.matched') }}</text>
					</view>
				</view>
				<view v-if="!visibleDevices.length" class="empty">
					<text class="empty-text">{{ $t('pages.deviceProvision.emptyDeviceList') }}</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { mac12ToColon, normalizeMac, parseMacFromAdvertisement } from '@/common/device-provision/ble'

type FoundDevice = {
	deviceId: string
	name?: string
	localName?: string
	RSSI?: number
	advertisData?: ArrayBuffer
}

type DeviceRow = {
	deviceId: string
	displayName: string
	RSSI: number | null
	advMac: string | null
	lastSeenAt: number
}

const { t } = useI18n()

const pageHeight = ref<string | number>(0)
const marginTopHeight = ref<string | number>(0)

const starting = ref(false)
const isScanning = ref(false)
const errorMsg = ref('')

const mode = ref<'manual' | 'qr'>('manual')
const targetMac = ref<string | null>(null)
const targetMacDisplay = computed(() => (targetMac.value ? mac12ToColon(targetMac.value) : ''))

const rows = ref<Map<string, DeviceRow>>(new Map())
const navigated = ref(false)

const visibleDevices = computed(() => {
	const list = Array.from(rows.value.values())
	list.sort((a, b) => {
		if (!targetMac.value) return (b.RSSI ?? -999) - (a.RSSI ?? -999)
		const am = a.advMac === targetMac.value ? 0 : 1
		const bm = b.advMac === targetMac.value ? 0 : 1
		if (am !== bm) return am - bm
		return (b.RSSI ?? -999) - (a.RSSI ?? -999)
	})
	return list
})

function clearList() {
	rows.value = new Map()
}

function upsertDevice(d: FoundDevice) {
	if (!d?.deviceId) return
	const advMac = parseMacFromAdvertisement((d as any).advertisData || (d as any).advertisingData || null)
	const existing = rows.value.get(d.deviceId)
	const displayName = String(d.name || d.localName || t('pages.deviceProvision.unknownDevice'))
	rows.value.set(d.deviceId, {
		deviceId: d.deviceId,
		displayName,
		RSSI: typeof d.RSSI === 'number' ? d.RSSI : existing?.RSSI ?? null,
		advMac: advMac || existing?.advMac || null,
		lastSeenAt: Date.now(),
	})

	// 扫码模式：发现匹配设备后自动进入向导页
	if (mode.value === 'qr' && targetMac.value && advMac === targetMac.value && !navigated.value) {
		navigated.value = true
		stopScan().finally(() => {
			uni.navigateTo({
				url: `/pages/device-provision/provision-wizard?deviceId=${encodeURIComponent(d.deviceId)}&qrMac=${targetMac.value}`,
			})
		})
	}
}

const onDeviceFound = (res: { devices?: FoundDevice[] }) => {
	const list = (res && res.devices) || []
	list.forEach((d) => upsertDevice(d))
}

async function startScan() {
	starting.value = true
	errorMsg.value = ''
	try {
		await new Promise((resolve, reject) => {
			uni.openBluetoothAdapter({ success: resolve, fail: reject })
		})

		// uni-app 部分平台支持 offBluetoothDeviceFound；这里优先卸载旧回调避免重复。
		const offFn = (uni as any).offBluetoothDeviceFound
		if (typeof offFn === 'function') offFn(onDeviceFound)
		uni.onBluetoothDeviceFound(onDeviceFound as any)

		await new Promise((resolve, reject) => {
			uni.startBluetoothDevicesDiscovery({
				allowDuplicatesKey: true,
				success: resolve,
				fail: reject,
			})
		})
		isScanning.value = true
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		errorMsg.value = t('pages.deviceProvision.bleInitFailed', { error: msg })
	} finally {
		starting.value = false
	}
}

async function stopScan() {
	try {
		await new Promise((resolve) => {
			uni.stopBluetoothDevicesDiscovery({ complete: resolve })
		})
	} finally {
		isScanning.value = false
	}
}

async function toggleScan() {
	if (isScanning.value) return stopScan()
	return startScan()
}

function selectDevice(d: DeviceRow) {
	uni.navigateTo({
		url: `/pages/device-provision/provision-wizard?deviceId=${encodeURIComponent(d.deviceId)}${
			targetMac.value ? `&qrMac=${targetMac.value}` : ''
		}`,
	})
}

onLoad((option) => {
	const opt = option as Record<string, string | undefined>
	const m = opt.mode === 'qr' ? 'qr' : 'manual'
	mode.value = m
	if (m === 'qr') {
		targetMac.value = normalizeMac(opt.mac || '') || null
	}
})

onShow(() => {
	marginTopHeight.value = uni.getStorageSync('contentPaddingTop')
	pageHeight.value = uni.getStorageSync('pageHeight')
	// 默认进入即开始扫描
	startScan()
})

onUnload(() => {
	stopScan()
	try {
		uni.closeBluetoothAdapter()
	} catch (e) {}
})
</script>

<style scoped>
.wrap {
	padding: 24rpx;
}

.hint {
	padding: 16rpx 20rpx;
	background: #ffffff;
	border-radius: 12rpx;
	margin-bottom: 16rpx;
}

.hint-text {
	font-size: 28rpx;
	color: #333333;
}

.actions {
	display: flex;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.status {
	margin-bottom: 16rpx;
}

.status-error {
	color: #e54d42;
	font-size: 26rpx;
}

.list {
	height: 70vh;
}

.item {
	background: #ffffff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
}

.item-main {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.item-name {
	font-size: 30rpx;
	color: #111111;
}

.item-rssi {
	font-size: 26rpx;
	color: #666666;
}

.item-sub {
	margin-top: 8rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.item-sub-text {
	font-size: 24rpx;
	color: #888888;
}

.item-match {
	font-size: 24rpx;
	color: #19be6b;
}

.empty {
	padding: 48rpx 0;
	text-align: center;
}

.empty-text {
	font-size: 26rpx;
	color: #999999;
}
</style>
