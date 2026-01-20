<template>
	<view class="home-page">
		<image class="home-bg" :src="$img('bg@2x.png')" mode="aspectFill" />

		<view class="home-top">
			<image class="home-top-bg" :src="$img('home/home-top@2x.png')" mode="widthFix" />

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
					<home-device-card
						v-for="item in deviceCards"
						:key="item.id"
						:device="item"
						@select="goDeviceDetail"
						@longpress="onCardLongPress"
					></home-device-card>
				</view>
			</scroll-view>
		</view>

		<u-action-sheet
			:show="actionSheetShow"
			:actions="actionSheetActions"
			:cancelText="$t('common.cancel')"
			@close="actionSheetShow = false"
			@select="onActionSelect"
		></u-action-sheet>

		<u-popup :show="renamePopupShow" mode="center" :round="16" @close="renamePopupShow = false">
			<view class="rename">
				<view class="rename__title">{{ $t('home.deviceMenu.renameTitle') }}</view>
				<view class="rename__input">
					<u-input
						v-model="renameValue"
						:placeholder="$t('home.deviceMenu.renamePlaceholder')"
						border="surround"
						clearable
					></u-input>
				</view>
				<view class="rename__actions">
					<view class="rename__btn rename__btn--cancel" @tap="renamePopupShow = false">{{
						$t('common.cancel')
					}}</view>
					<view class="rename__btn rename__btn--ok" @tap="doRename">{{ $t('common.confirm') }}</view>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onHide, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import HomeDeviceCard from '@/components/home/device-card.vue'
import { appUnbindDevice, deviceMapTelemetry, updateDeviceName } from '@/service/device'
import type { HomeDeviceCardModel } from '@/types/home'
import { useBoundDevicesStore } from '@/store/bound-devices'
import { canBleAutoConnect, connectBleClient, getBleClientEntry, releaseBleClient, retainBleClient } from '@/common/ble/ble-client-cache'

type BoundDeviceItem = {
	device_id: string
	device_number: string
	device_name?: string
	ble_mac?: string | null
	bms_comm_type?: number | null
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

const isLoggedIn = ref(false)
const deviceCards = ref<HomeDeviceCardModel[]>([])
const loading = ref(false)

const { t } = useI18n()

const boundDevicesStore = useBoundDevicesStore()

const selectedDevice = ref<HomeDeviceCardModel | null>(null)
const actionSheetShow = ref(false)
const renamePopupShow = ref(false)
const renameValue = ref('')
const submitting = ref(false)

const refreshLoginState = () => {
	isLoggedIn.value = Boolean(uni.getStorageSync('access_token'))
}

const STORAGE_BT_AUTO_CONNECT = 'bluetoothAutoConnect'
const BLE_MAX_READ_REGS = 60
const homeBleKeys = new Set<string>()
let autoConnectToken = 0

const actionSheetActions = computed(() => [
	{ key: 'rename', name: t('home.deviceMenu.rename') as string },
	{ key: 'unbind', name: t('home.deviceMenu.unbind') as string, color: '#ff4d3f' }
])

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

const toHomeModel = async (d: BoundDeviceItem): Promise<HomeDeviceCardModel> => {
	let batteryPercent = 0
	let isOnline = false
	try {
		const rsp = await deviceMapTelemetry(d.device_id)
		if (rsp && (rsp as any).code === 200) {
			const data = (rsp as any).data as TelemetryMapRsp
			batteryPercent = parseBatteryPercent(data)
			isOnline = Number(data?.is_online || 0) === 1
		}
	} catch (e) {}
	const rawComm = d?.bms_comm_type
	const commNum = rawComm == null ? null : Number(rawComm)
	const bmsCommType = Number.isFinite(commNum) ? commNum : null

	return {
		id: d.device_id,
		name: String(d?.device_name || '').trim() || String(d?.device_number || '').trim() || '-',
		model: String(d?.device_number || '').trim() || '-',
		isOnline,
		connectType: isOnline ? 'mqtt' : 'offline',
		batteryPercent,
		bleMac: d?.ble_mac ?? null,
		bmsCommType
	}
}

const isBluetoothAutoConnectEnabled = () => {
	const raw = uni.getStorageSync(STORAGE_BT_AUTO_CONNECT)
	if (raw === '' || raw === undefined || raw === null) return true
	return Boolean(Number(raw))
}

const applyBleCacheStatus = () => {
	deviceCards.value = deviceCards.value.map((card) => {
		const fallback = card.isOnline ? 'mqtt' : 'offline'
		if (card.bleMac && getBleClientEntry(card.bleMac, { touch: false })) {
			return { ...card, connectType: 'bluetooth' }
		}
		return { ...card, connectType: fallback }
	})
}

const stopAutoConnect = () => {
	autoConnectToken += 1
}

const releaseHomeBleClients = () => {
	for (const key of Array.from(homeBleKeys)) {
		releaseBleClient(key)
	}
	homeBleKeys.clear()
}

const markCardBleConnected = (deviceId: string) => {
	deviceCards.value = deviceCards.value.map((card) =>
		String(card.id) === String(deviceId) ? { ...card, connectType: 'bluetooth' } : card
	)
}

const autoConnectBleDevices = async () => {
	if (!isBluetoothAutoConnectEnabled()) return
	const token = ++autoConnectToken
	const list = boundDevicesStore.list
	if (!Array.isArray(list) || !list.length) return

	for (const item of list) {
		if (token !== autoConnectToken) return
		if (!item?.device_id) continue
		const decision = canBleAutoConnect(item?.bms_comm_type, item?.ble_mac)
		if (!decision.ok || !decision.mac) continue
		const entry = await connectBleClient({ mac: decision.mac, maxReadRegisters: BLE_MAX_READ_REGS })
		if (!entry) continue
		if (token !== autoConnectToken) return
		if (!homeBleKeys.has(entry.key)) {
			retainBleClient(entry.key)
			homeBleKeys.add(entry.key)
		}
		markCardBleConnected(String(item.device_id))
	}
}

const load = async () => {
	if (loading.value) return
	refreshLoginState()
	stopAutoConnect()
	loading.value = true
	try {
		if (!isLoggedIn.value) {
			deviceCards.value = []
			boundDevicesStore.clear()
			releaseHomeBleClients()
			return
		}

		await boundDevicesStore.refresh({ force: true })
		const list = boundDevicesStore.list
		if (!Array.isArray(list) || !list.length) {
			deviceCards.value = []
			releaseHomeBleClients()
			return
		}

		const out: HomeDeviceCardModel[] = []
		for (const item of list) {
			if (!item || !item.device_id) continue
			// eslint-disable-next-line no-await-in-loop
			out.push(await toHomeModel(item))
		}
		deviceCards.value = out
		applyBleCacheStatus()
		void autoConnectBleDevices()
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

const onCardLongPress = (device: HomeDeviceCardModel) => {
	if (!isLoggedIn.value) return
	selectedDevice.value = device
	actionSheetShow.value = true
}

const openRename = () => {
	if (!selectedDevice.value) return
	renameValue.value = String(selectedDevice.value.name || '').trim()
	actionSheetShow.value = false
	renamePopupShow.value = true
}

const doRename = async () => {
	if (submitting.value) return
	const d = selectedDevice.value
	if (!d) return
	const nextName = String(renameValue.value || '').trim()
	if (!nextName) {
		uni.showToast({ title: t('home.deviceMenu.renameEmpty') as string, icon: 'none' })
		return
	}

	submitting.value = true
	try {
		const rsp = await updateDeviceName({ id: String(d.id), name: nextName })
		if (rsp && (rsp as any).code === 200) {
			deviceCards.value = deviceCards.value.map((x) => (x.id === d.id ? { ...x, name: nextName } : x))
			renamePopupShow.value = false
			uni.showToast({ title: t('home.deviceMenu.renameSuccess') as string, icon: 'none' })
		} else {
			uni.showToast({
				title: (rsp as any)?.message || (t('home.deviceMenu.renameFailed') as string),
				icon: 'none'
			})
		}
	} catch (e) {
		uni.showToast({ title: t('home.deviceMenu.renameFailed') as string, icon: 'none' })
	} finally {
		submitting.value = false
	}
}

const confirmUnbind = () => {
	const d = selectedDevice.value
	if (!d) return
	actionSheetShow.value = false
	uni.showModal({
		title: t('common.tip') as string,
		content: t('home.deviceMenu.unbindConfirm') as string,
		cancelText: t('common.cancel') as string,
		confirmText: t('common.confirm') as string,
		success: async (res: { confirm: boolean }) => {
			if (!res.confirm) return
			if (submitting.value) return
			submitting.value = true
			try {
				const rsp = await appUnbindDevice(String(d.id))
				if (rsp && (rsp as any).code === 200) {
					deviceCards.value = deviceCards.value.filter((x) => x.id !== d.id)
					boundDevicesStore.removeByDeviceId(String(d.id))
					const decision = canBleAutoConnect(d.bmsCommType, d.bleMac)
					if (decision.mac) {
						homeBleKeys.delete(decision.mac)
						releaseBleClient(decision.mac)
					}
					uni.showToast({ title: t('home.deviceMenu.unbindSuccess') as string, icon: 'none' })
				} else {
					uni.showToast({
						title: (rsp as any)?.message || (t('home.deviceMenu.unbindFailed') as string),
						icon: 'none'
					})
				}
			} catch (e) {
				uni.showToast({ title: t('home.deviceMenu.unbindFailed') as string, icon: 'none' })
			} finally {
				submitting.value = false
			}
		}
	})
}

const onActionSelect = (item: { key?: string } | null) => {
	const key = item?.key || ''
	if (key === 'rename') openRename()
	else if (key === 'unbind') confirmUnbind()
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
	uni.setStorageSync('__last_tab_url__', '/pages/home/home')
	refreshLoginState()
	setMpTabSelected()
	load()
})

onHide(() => {
	stopAutoConnect()
	releaseHomeBleClients()
})

onPullDownRefresh(() => load())
</script>

<script lang="ts">
import { showAddDeviceActionSheet } from '@/common/composables/useAddDeviceActionSheet'

export default {
	// #ifdef APP-PLUS
	onTabBarMidButtonTap() {
		showAddDeviceActionSheet()
	}
	// #endif
}
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
	top: 310rpx;
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

.rename {
	width: 640rpx;
	background: #ffffff;
	border-radius: 16rpx;
	padding: 34rpx 28rpx 28rpx;
	box-sizing: border-box;
}

.rename__title {
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #1d1d1d;
	margin-bottom: 26rpx;
}

.rename__input {
	border-radius: 12rpx;
	overflow: hidden;
}

.rename__actions {
	margin-top: 28rpx;
	display: flex;
	gap: 18rpx;
}

.rename__btn {
	flex: 1;
	height: 76rpx;
	border-radius: 38rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
}

.rename__btn--cancel {
	background: #f2f2f2;
	color: #9b9b9b;
}

.rename__btn--ok {
	background: #0b2dff;
	color: #ffffff;
}
</style>
