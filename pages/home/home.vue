<template>
	<view class="home-page">
		<image class="home-bg" :src="$img('bg@2x.png')" mode="aspectFill" />

		<view class="home-top">
			<image v-if="homeBannerUrl" class="home-top-bg" :src="homeBannerUrl" mode="widthFix" />

			<view class="alarm-btn" @tap="goAlarm">
				<u-icon name="bell" size="14" color="#FFFFFF"></u-icon>
				<text class="alarm-btn__text">{{ $t('home.alarmDevices') }}</text>
			</view>
		</view>

		<view class="device-panel">
			<view class="device-panel__header">
				<view class="device-panel__title-wrap">
					<text class="device-panel__title">{{ $t('home.myDevices') }}</text>
					<text class="device-panel__mode">{{ currentModeLabel }}</text>
				</view>
				<image
					class="device-panel__filter"
					src="/static/image/home/icon-filter@2x.png"
					mode="aspectFit"
					@tap="openFilterPopup"
				/>
			</view>

			<view v-if="!isLoggedIn || (!loading && !deviceCards.length)" class="empty">
				<image class="empty__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
				<text class="empty__text">{{ $t('home.emptyTip') }}</text>
			</view>

			<scroll-view v-else class="list" scroll-y @scrolltolower="loadMore">
				<view class="list__inner">
					<home-device-card
						v-for="item in deviceCards"
						:key="item.id"
						:device="item"
						@select="goDeviceDetail"
						@longpress="onCardLongPress"
						@disconnect="disconnectCardBluetooth"
					></home-device-card>
					<view v-if="loading" class="list__footer">{{ $t('home.loadMoreLoading') }}</view>
					<view v-else-if="deviceCards.length && !hasMore" class="list__footer">{{ $t('home.loadMoreNoMore') }}</view>
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

		<u-popup :show="filterPopupShow" mode="bottom" :round="20" @close="filterPopupShow = false">
			<view class="filter-popup">
				<view class="filter-popup__title">{{ $t('home.filterTitle') }}</view>

				<view v-if="showNameFilter" class="filter-popup__field">
					<text class="filter-popup__label">{{ $t('home.filterDeviceName') }}</text>
					<u-input
						v-model="filterForm.device_name"
						:placeholder="$t('home.filterDeviceName')"
						border="surround"
						clearable
					></u-input>
				</view>

				<view class="filter-popup__field">
					<text class="filter-popup__label">{{ $t('home.filterDeviceNumber') }}</text>
					<u-input
						v-model="filterForm.device_number"
						:placeholder="$t('home.filterDeviceNumber')"
						border="surround"
						clearable
					></u-input>
				</view>

				<view class="filter-popup__field">
					<text class="filter-popup__label">{{ $t('home.filterBleMac') }}</text>
					<u-input
						v-model="filterForm.ble_mac"
						:placeholder="$t('home.filterBleMac')"
						border="surround"
						clearable
					></u-input>
				</view>

				<view v-if="showAddedDateFilter" class="filter-popup__field">
					<text class="filter-popup__label">{{ $t('home.filterAddedDate') }}</text>
					<uni-datetime-picker
						v-model="filterForm.added_range"
						type="daterange"
						return-type="string"
						:start-placeholder="$t('home.filterStartDate')"
						:end-placeholder="$t('home.filterEndDate')"
					/>
				</view>

				<view class="filter-popup__actions">
					<view class="filter-popup__btn filter-popup__btn--reset" @tap="resetFilters">
						{{ $t('home.filterReset') }}
					</view>
					<view class="filter-popup__btn filter-popup__btn--apply" @tap="applyFilters">
						{{ $t('home.filterApply') }}
					</view>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onHide, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import HomeDeviceCard from '@/components/home/device-card.vue'
import {
	getStoredHomeDeviceViewMode,
	isOrgUserLike,
	resolveAddTrackingViewMode,
	type HomeDeviceViewMode
} from '@/common/device-view-mode'
import { mac12ToColon, normalizeMac } from '@/common/device-provision/ble'
import { useInjected } from '@/common/composables/useInjected'
import { canBleAutoConnect, connectBleClient, disconnectBleClient, getBleClientEntry, releaseBleClient, retainBleClient } from '@/common/ble/ble-client-cache'
import { useBoundDevicesStore } from '@/store/bound-devices'
import { useUserStore } from '@/store/user'
import { appBoundDeviceList, appRemoveDevice, appUnbindDevice, updateDeviceName } from '@/service/device'
import { imageUrl } from '@/common/assets/images'
import { fetchWxmpRuntimeConfig, shouldUseDefaultWxmpBrandAsset } from '@/common/wxmp-runtime'
import type { HomeDeviceCardModel } from '@/types/home'

type DeviceListItem = {
	id?: string
	device_id: string
	device_number: string
	device_name?: string
	ble_mac?: string | null
	iccid?: string | null
	imei?: string | null
	bms_comm_type?: number | null
	is_online?: number
	soc?: number | null
	relation_type?: string
	activation_status?: string | null
	[key: string]: unknown
}

type HomeDeviceRow = HomeDeviceCardModel & {
	relationType: string
}

const { t } = useI18n()
const { apiRequest } = useInjected()
const userStore = useUserStore()
const boundDevicesStore = useBoundDevicesStore()

const isLoggedIn = ref(false)
const loading = ref(false)
const deviceCards = ref<HomeDeviceRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const filterPopupShow = ref(false)
const currentViewMode = ref<HomeDeviceViewMode>('self_bound')
const defaultHomeBannerUrl = imageUrl('home/home-top@2x.png')
const getInitialHomeBannerUrl = () => {
	// #ifdef MP-WEIXIN
	return ''
	// #endif
	// #ifndef MP-WEIXIN
	return defaultHomeBannerUrl
	// #endif
}
const homeBannerUrl = ref(getInitialHomeBannerUrl())

const selectedDevice = ref<HomeDeviceRow | null>(null)
const actionSheetShow = ref(false)
const renamePopupShow = ref(false)
const renameValue = ref('')
const submitting = ref(false)
const disconnectingBleDeviceIds = ref<Set<string>>(new Set())

const appliedFilters = reactive({
	device_name: '',
	device_number: '',
	ble_mac: '',
	added_start_at: '',
	added_end_at: '',
})

const filterForm = reactive({
	device_name: '',
	device_number: '',
	ble_mac: '',
	added_range: [] as string[],
})

const STORAGE_BT_AUTO_CONNECT = 'bluetoothAutoConnect'
const BLE_MAX_READ_REGS = 60
const homeBleKeys = new Set<string>()
let autoConnectToken = 0

const isOrgUser = computed(() => isOrgUserLike(userStore.userInfo))
const hasMore = computed(() => deviceCards.value.length < total.value)
const showNameFilter = computed(() => currentViewMode.value !== 'org_added')
const showAddedDateFilter = computed(() => currentViewMode.value === 'org_added')

const currentModeLabel = computed(() => {
	if (currentViewMode.value === 'org_added') return t('home.modeOrgAdded') as string
	if (currentViewMode.value === 'end_user_bound') return t('home.modeEndUserBound') as string
	return t('home.modeSelfBound') as string
})

const actionSheetActions = computed(() => {
	if (!selectedDevice.value) return []
	if (currentViewMode.value === 'self_bound') {
		return [
			{ key: 'rename', name: t('home.deviceMenu.rename') as string },
			{ key: 'unbind', name: t('home.deviceMenu.unbind') as string, color: '#ff4d3f' }
		]
	}
	if (currentViewMode.value === 'org_added') {
		return [{ key: 'remove', name: t('home.deviceMenu.remove') as string, color: '#ff4d3f' }]
	}
	return []
})

const refreshLoginState = () => {
	isLoggedIn.value = Boolean(uni.getStorageSync('access_token'))
}

const loadWxmpRuntimeConfig = async () => {
	// #ifdef MP-WEIXIN
	homeBannerUrl.value = ''
	try {
		const runtime = await fetchWxmpRuntimeConfig()
		const banner = String(runtime?.home_banner_url || '').trim()
		if (banner) {
			homeBannerUrl.value = banner
		} else if (shouldUseDefaultWxmpBrandAsset(runtime)) {
			homeBannerUrl.value = defaultHomeBannerUrl
		}
	} catch (e) {}
	// #endif
}

const parseBooleanStorage = (raw: unknown, defaultValue: boolean) => {
	if (raw === '' || raw === undefined || raw === null) return defaultValue
	if (typeof raw === 'boolean') return raw
	const text = String(raw).trim().toLowerCase()
	if (text === '1' || text === 'true' || text === 'on') return true
	if (text === '0' || text === 'false' || text === 'off') return false
	const n = Number(text)
	if (Number.isFinite(n)) return n !== 0
	return defaultValue
}

const isBluetoothAutoConnectEnabled = () => {
	const raw = uni.getStorageSync(STORAGE_BT_AUTO_CONNECT)
	return parseBooleanStorage(raw, true)
}

const syncCurrentViewMode = () => {
	currentViewMode.value = isOrgUser.value ? getStoredHomeDeviceViewMode(userStore.userInfo) : 'self_bound'
}

const ensureUserInfo = async () => {
	if (!apiRequest || !isLoggedIn.value) return
	const current = userStore.userInfo as Record<string, unknown> | null
	if (current && (current.user_kind || current.org_id || current.org_type || current.authority)) {
		return
	}
	try {
		const res = await apiRequest<Record<string, unknown>>('/api/v1/user/detail', {}, 'get')
		if (res && (res as any).code === 200 && (res as any).data) {
			userStore.setUserInfo((res as any).data as any)
		}
	} catch (e) {}
}

const formatDeviceIdentifier = (item: DeviceListItem): string => {
	const fallback = String(item?.device_number || '').trim() || '-'
	const iccid = String(item?.iccid || '').trim()
	const imei = String(item?.imei || '').trim()
	const mac = normalizeMac(String(item?.ble_mac || ''))
	const macText = mac ? mac12ToColon(mac) : ''
	const rawComm = item?.bms_comm_type
	const commNum = rawComm == null ? null : Number(rawComm)
	const bmsCommType = Number.isFinite(commNum) ? commNum : null

	if (bmsCommType === 1 && macText) return macText
	if ((bmsCommType === 2 || bmsCommType === 3) && imei) return imei
	if ((bmsCommType === 2 || bmsCommType === 3) && iccid) return iccid
	if (macText) return macText
	if (imei) return imei
	if (iccid) return iccid
	return fallback
}

const toHomeModel = (item: DeviceListItem): HomeDeviceRow => {
	const soc = Number(item?.soc ?? 0)
	const batteryPercent = Number.isFinite(soc) ? Math.max(0, Math.min(100, Math.round(soc))) : 0
	const isOnline = Number(item?.is_online || 0) === 1
	const rawComm = item?.bms_comm_type
	const commNum = rawComm == null ? null : Number(rawComm)
	const bmsCommType = Number.isFinite(commNum) ? commNum : null
	const relationType = String(item?.relation_type || 'BINDING')

	return {
		id: String(item?.device_id || ''),
		name: String(item?.device_name || '').trim() || String(item?.device_number || '').trim() || '-',
		identifierText: formatDeviceIdentifier(item),
		isOnline,
		connectType: isOnline ? 'mqtt' : 'offline',
		batteryPercent,
		bleMac: item?.ble_mac ?? null,
		iccid: item?.iccid ?? null,
		imei: item?.imei ?? null,
		bmsCommType,
		relationType,
	}
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

const applyCardFallbackConnectType = (deviceId: string) => {
	deviceCards.value = deviceCards.value.map((card) => {
		if (String(card.id) !== String(deviceId)) return card
		return { ...card, connectType: card.isOnline ? 'mqtt' : 'offline' }
	})
}

const autoConnectBleDevices = async () => {
	if (!isBluetoothAutoConnectEnabled()) return
	const token = ++autoConnectToken
	const list = deviceCards.value
	if (!Array.isArray(list) || !list.length) return

	for (const item of list) {
		if (token !== autoConnectToken) return
		if (!item?.id) continue
		const decision = canBleAutoConnect(item?.bmsCommType, item?.bleMac)
		if (!decision.ok || !decision.mac) continue
		const entry = await connectBleClient({ mac: decision.mac, maxReadRegisters: BLE_MAX_READ_REGS })
		if (!entry) continue
		if (token !== autoConnectToken) return
		if (!homeBleKeys.has(entry.key)) {
			retainBleClient(entry.key)
			homeBleKeys.add(entry.key)
		}
		markCardBleConnected(String(item.id))
	}
}

const buildListParams = (nextPage: number) => ({
	page: nextPage,
	page_size: pageSize,
	view_mode: isOrgUser.value ? currentViewMode.value : 'self_bound',
	device_name: appliedFilters.device_name || undefined,
	device_number: appliedFilters.device_number || undefined,
	ble_mac: appliedFilters.ble_mac || undefined,
	added_start_at: showAddedDateFilter.value ? appliedFilters.added_start_at || undefined : undefined,
	added_end_at: showAddedDateFilter.value ? appliedFilters.added_end_at || undefined : undefined,
})

const load = async (reset = true) => {
	if (loading.value) return
	refreshLoginState()
	if (reset) stopAutoConnect()

	loading.value = true
	try {
		if (!isLoggedIn.value) {
			deviceCards.value = []
			total.value = 0
			page.value = 1
			boundDevicesStore.clear()
			releaseHomeBleClients()
			return
		}

		await ensureUserInfo()
		syncCurrentViewMode()

		const nextPage = reset ? 1 : page.value
		const rsp = await appBoundDeviceList(buildListParams(nextPage))
		if (!rsp || (rsp as any).code !== 200) {
			if (reset) {
				deviceCards.value = []
				total.value = 0
				page.value = 1
			}
			return
		}

		const payload = (rsp as any).data || {}
		const list = Array.isArray(payload?.list) ? (payload.list as DeviceListItem[]) : []
		const mapped = list.map(toHomeModel)
		deviceCards.value = reset ? mapped : deviceCards.value.concat(mapped)
		total.value = Number(payload?.total || 0)
		page.value = nextPage + 1

		applyBleCacheStatus()
		void autoConnectBleDevices()

		const trackingMode = resolveAddTrackingViewMode(userStore.userInfo)
		if ((isOrgUser.value && currentViewMode.value === trackingMode) || (!isOrgUser.value && trackingMode === 'self_bound')) {
			boundDevicesStore.list = list as any
			boundDevicesStore.lastFetchedAt = Date.now()
			boundDevicesStore.viewMode = trackingMode
		}
	} finally {
		loading.value = false
		try {
			uni.stopPullDownRefresh()
		} catch (e) {}
	}
}

const loadMore = () => {
	if (loading.value || !hasMore.value) return
	load(false)
}

const openFilterPopup = () => {
	filterForm.device_name = appliedFilters.device_name
	filterForm.device_number = appliedFilters.device_number
	filterForm.ble_mac = appliedFilters.ble_mac
	filterForm.added_range =
		appliedFilters.added_start_at && appliedFilters.added_end_at
			? [appliedFilters.added_start_at, appliedFilters.added_end_at]
			: []
	filterPopupShow.value = true
}

const applyFilters = () => {
	appliedFilters.device_name = showNameFilter.value ? String(filterForm.device_name || '').trim() : ''
	appliedFilters.device_number = String(filterForm.device_number || '').trim()
	appliedFilters.ble_mac = String(filterForm.ble_mac || '').trim()
	if (showAddedDateFilter.value && Array.isArray(filterForm.added_range) && filterForm.added_range.length === 2) {
		appliedFilters.added_start_at = String(filterForm.added_range[0] || '').trim()
		appliedFilters.added_end_at = String(filterForm.added_range[1] || '').trim()
	} else {
		appliedFilters.added_start_at = ''
		appliedFilters.added_end_at = ''
	}
	filterPopupShow.value = false
	load(true)
}

const resetFilters = () => {
	filterForm.device_name = ''
	filterForm.device_number = ''
	filterForm.ble_mac = ''
	filterForm.added_range = []
	appliedFilters.device_name = ''
	appliedFilters.device_number = ''
	appliedFilters.ble_mac = ''
	appliedFilters.added_start_at = ''
	appliedFilters.added_end_at = ''
	filterPopupShow.value = false
	load(true)
}

const goAlarm = () => {
	uni.navigateTo({ url: '/pages/alarm/alarm' })
}

const goDeviceDetail = (id: string) => {
	uni.navigateTo({ url: `/pages/device-battery/detail?device_id=${encodeURIComponent(String(id || ''))}` })
}

const disconnectCardBluetooth = async (device: HomeDeviceCardModel) => {
	const targetId = String(device?.id || '')
	if (!targetId || device.connectType !== 'bluetooth') return
	if (disconnectingBleDeviceIds.value.has(targetId)) return

	const bleKey = String(device.bleMac || '').trim()
	if (!bleKey) return
	const entry = getBleClientEntry(bleKey, { touch: false })
	if (!entry) {
		applyCardFallbackConnectType(targetId)
		return
	}

	disconnectingBleDeviceIds.value.add(targetId)
	try {
		const ok = await disconnectBleClient(entry.key)
		homeBleKeys.delete(entry.key)
		applyCardFallbackConnectType(targetId)
		if (!ok) {
			console.warn('[home] BLE disconnect command failed, local connection state cleared', {
				deviceId: targetId,
				bleKey: entry.key,
			})
		}
		uni.showToast({
			title: t('home.disconnect.disconnected') as string,
			icon: 'none',
		})
	} finally {
		disconnectingBleDeviceIds.value.delete(targetId)
	}
}

const onCardLongPress = (device: HomeDeviceRow) => {
	if (!isLoggedIn.value) return
	if (!actionSheetActions.value.length && currentViewMode.value === 'end_user_bound') return
	selectedDevice.value = device
	if (!actionSheetActions.value.length) return
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

const removeDeviceFromView = (device: HomeDeviceRow) => {
	deviceCards.value = deviceCards.value.filter((x) => x.id !== device.id)
	const trackingMode = resolveAddTrackingViewMode(userStore.userInfo)
	if (currentViewMode.value === trackingMode) {
		boundDevicesStore.removeByDeviceId(String(device.id))
	}
	const decision = canBleAutoConnect(device.bmsCommType, device.bleMac)
	if (decision.mac) {
		homeBleKeys.delete(decision.mac)
		releaseBleClient(decision.mac)
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
					removeDeviceFromView(d)
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

const confirmRemove = () => {
	const d = selectedDevice.value
	if (!d) return
	actionSheetShow.value = false
	uni.showModal({
		title: t('common.tip') as string,
		content: t('home.deviceMenu.removeConfirm') as string,
		cancelText: t('common.cancel') as string,
		confirmText: t('common.confirm') as string,
		success: async (res: { confirm: boolean }) => {
			if (!res.confirm) return
			if (submitting.value) return
			submitting.value = true
			try {
				const rsp = await appRemoveDevice(String(d.id))
				if (rsp && (rsp as any).code === 200) {
					removeDeviceFromView(d)
					uni.showToast({ title: t('home.deviceMenu.removeSuccess') as string, icon: 'none' })
				} else {
					uni.showToast({
						title: (rsp as any)?.message || (t('home.deviceMenu.removeFailed') as string),
						icon: 'none'
					})
				}
			} catch (e) {
				uni.showToast({ title: t('home.deviceMenu.removeFailed') as string, icon: 'none' })
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
	else if (key === 'remove') confirmRemove()
}

const setMpTabSelected = () => {
	// #ifdef MP-WEIXIN
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pages = (globalThis as any).getCurrentPages?.() as any[] | undefined
		const current = pages && pages.length ? pages[pages.length - 1] : null
		const tabBar = current?.getTabBar?.()
		tabBar?.updateTexts?.()
		tabBar?.setSelected?.(0)
	} catch (e) {}
	// #endif
}

onShow(() => {
	uni.setStorageSync('__last_tab_url__', '/pages/home/home')
	refreshLoginState()
	setMpTabSelected()
	void loadWxmpRuntimeConfig()
	load(true)
})

onHide(() => {
	stopAutoConnect()
	releaseHomeBleClients()
})

onPullDownRefresh(() => load(true))
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
	height: 421rpx;
	overflow: hidden;
}

.home-top-bg {
	width: 100%;
	height: 421rpx;
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
	gap: 16rpx;
}

.device-panel__title-wrap {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
}

.device-panel__title {
	font-size: 34rpx;
	font-weight: 600;
	color: #1d1d1d;
}

.device-panel__mode {
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: #eef3ff;
	color: #246fdd;
	font-size: 22rpx;
	line-height: 1;
}

.device-panel__filter {
	width: 44rpx;
	height: 44rpx;
	flex-shrink: 0;
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

.list__footer {
	padding: 16rpx 0 32rpx;
	text-align: center;
	color: #a6a6a6;
	font-size: 24rpx;
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

.filter-popup {
	padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
	background: #ffffff;
}

.filter-popup__title {
	text-align: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #1d1d1d;
}

.filter-popup__field {
	margin-top: 24rpx;
}

.filter-popup__label {
	display: block;
	margin-bottom: 12rpx;
	font-size: 26rpx;
	color: #3d3d3d;
}

.filter-popup__actions {
	margin-top: 32rpx;
	display: flex;
	gap: 18rpx;
}

.filter-popup__btn {
	flex: 1;
	height: 80rpx;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
}

.filter-popup__btn--reset {
	background: #f2f2f2;
	color: #777777;
}

.filter-popup__btn--apply {
	background: #0b2dff;
	color: #ffffff;
}
</style>
