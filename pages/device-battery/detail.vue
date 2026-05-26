<template>
	<view class="page">
		<image class="bg" :src="$img('bg@2x.png')" mode="aspectFill" />

		<view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav__inner">
				<view class="nav__left" hover-class="nav__left--hover" @tap="goBack">
					<u-icon name="arrow-left" size="20" color="#333333"></u-icon>
				</view>
				<view class="nav__title u-line-1">{{ titleText }}</view>
				<!-- #ifndef MP-WEIXIN -->
				<view class="nav__right">
					<view class="conn-pill" :class="`conn-pill--${connClass}`">
						<text v-if="showFourGConnIcon" class="conn-pill__icon conn-pill__icon--4g">4G</text>
						<image v-else class="conn-pill__icon" :src="connIcon" mode="aspectFit" />
						<text class="conn-pill__text">{{ connText }}</text>
					</view>
					<view v-if="showBleDisconnectBtn" class="conn-disconnect" hover-class="conn-disconnect--hover" @tap="onDisconnectBluetooth">
						<u-icon name="close" size="12" color="#246FDD"></u-icon>
						<text class="conn-disconnect__text">{{ $t('deviceDetail.conn.disconnect') }}</text>
					</view>
					<view v-if="showMeterPanelTrigger" class="meter-entry" hover-class="meter-entry--hover" @tap="openMeterPanel">
						<image class="meter-entry__icon" src="/static/image/device/navbar-dashboard-on@2x.png" mode="aspectFit" />
					</view>
				</view>
				<!-- #endif -->
			</view>
			<!-- #ifdef MP-WEIXIN -->
			<view class="nav__conn-row">
				<view class="conn-pill" :class="`conn-pill--${connClass}`">
					<text v-if="showFourGConnIcon" class="conn-pill__icon conn-pill__icon--4g">4G</text>
					<image v-else class="conn-pill__icon" :src="connIcon" mode="aspectFit" />
					<text class="conn-pill__text">{{ connText }}</text>
				</view>
				<view v-if="showBleDisconnectBtn" class="conn-disconnect" hover-class="conn-disconnect--hover" @tap="onDisconnectBluetooth">
					<u-icon name="close" size="12" color="#246FDD"></u-icon>
					<text class="conn-disconnect__text">{{ $t('deviceDetail.conn.disconnect') }}</text>
				</view>
				<view v-if="showMeterPanelTrigger" class="meter-entry" hover-class="meter-entry--hover" @tap="openMeterPanel">
					<image class="meter-entry__icon" src="/static/image/device/navbar-dashboard-on@2x.png" mode="aspectFit" />
				</view>
			</view>
			<!-- #endif -->
		</view>

		<view class="content" :style="{ paddingTop: navHeight + 'px', paddingBottom: contentBottomPadPx + 'px' }">
			<!-- #ifdef MP-WEIXIN -->
			<cover-view v-if="showMeterFloatingPanel" class="session-float session-float--mp" :style="{ top: sessionFloatTopPx + 'px' }">
				<cover-view class="session-card session-card--mp">
					<cover-view class="session-card__head session-card__head--mp">
						<cover-view class="session-card__main session-card__main--mp">
							<cover-view class="session-card__title session-card__title--mp">{{ $t('deviceDetail.meter.sessionTitle') }}</cover-view>
							<cover-view class="session-card__desc session-card__desc--mp">{{ $t('deviceDetail.meter.sessionHint') }}</cover-view>
						</cover-view>
						<cover-view class="session-card__collapse session-card__collapse--mp" hover-class="session-card__collapse--hover" @tap="closeMeterPanel">
							<cover-view class="session-card__collapse-text">×</cover-view>
						</cover-view>
					</cover-view>
					<cover-view class="session-card__action session-card__action--mp">
						<cover-view class="session-card__cta" hover-class="session-card__cta--hover" @tap="scanAndBindBms">
							{{ $t('deviceDetail.meter.scanBindBms') }}
						</cover-view>
					</cover-view>
				</cover-view>
			</cover-view>
			<!-- #endif -->
			<!-- #ifndef MP-WEIXIN -->
			<view v-if="showMeterFloatingPanel" class="session-float" :style="{ top: sessionFloatTopPx + 'px' }">
				<view class="session-card">
					<view class="session-card__head">
						<view class="session-card__main">
							<view class="session-card__title">{{ $t('deviceDetail.meter.sessionTitle') }}</view>
							<view class="session-card__desc">{{ $t('deviceDetail.meter.sessionHint') }}</view>
						</view>
						<view class="session-card__collapse" hover-class="session-card__collapse--hover" @tap="closeMeterPanel">
							<u-icon name="close" size="16" color="#6B7280"></u-icon>
						</view>
					</view>
					<view class="session-card__action">
						<u-button type="primary" :customStyle="sessionActionButtonStyle" @click="scanAndBindBms">
							{{ $t('deviceDetail.meter.scanBindBms') }}
						</u-button>
					</view>
				</view>
			</view>
			<!-- #endif -->
			<view v-if="activeTab === 0 && showBmsDataLoading" class="data-loading">
				<view class="data-loading__spinner"></view>
				<text class="data-loading__title">{{ $t('deviceDetail.dashboard.loadingTitle') }}</text>
				<text class="data-loading__desc">{{ bmsDataLoadingDescText }}</text>
				<view v-if="showBmsDataActionButtons" class="data-loading__actions">
					<view class="data-loading__btn data-loading__btn--primary" hover-class="data-loading__btn--hover" @tap="reconnectBmsData">
						{{ $t('deviceDetail.dashboard.reconnectRead') }}
					</view>
					<view class="data-loading__btn" hover-class="data-loading__btn--hover" @tap="retryBmsDataRead">
						{{ $t('deviceDetail.dashboard.retryRead') }}
					</view>
				</view>
			</view>
			<dashboard-tab
				v-else-if="activeTab === 0"
				:battery="battery"
				:status="status"
				:connType="connType"
			/>
			<cells-tab v-else-if="activeTab === 1" :status="status" />
			<params-tab
				v-else-if="activeTab === 2"
				:battery="battery"
				:status="status"
				:client="client"
				:connType="connType"
				:active="activeTab === 2"
				:allowOta="allowOta"
				:otaInfo="otaCheckState"
				:otaChecking="otaCheckState.checking"
				:otaNeedUpgrade="showOtaBadge"
				:onPausePolling="pausePolling"
				:onResumePolling="resumePolling"
				@ota-state-change="patchOtaCheckState"
			/>
			<history-tab
				v-else-if="activeTab === 3 && canShowHistoryTab"
				ref="historyTabRef"
				:client="client"
				:connType="connType"
				:sessionMode="sessionMode"
				:active="activeTab === 3"
				:viewportHeightPx="historyViewportHeightPx"
				:onPausePolling="pausePolling"
				:onResumePolling="resumePolling"
			/>
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
					<view class="tab__text-wrap">
						<text class="tab__text" :class="{ 'tab__text--on': activeTab === 2 }">{{ $t('deviceDetail.tabs.params') }}</text>
						<view v-if="showOtaBadge" class="tab__badge"></view>
					</view>
				</view>
				<view v-if="canShowHistoryTab" class="tab" hover-class="tab--hover" @tap="activeTab = 3">
					<image class="tab__icon" src="/static/image/device/icon-charge-time@2x.png" mode="aspectFit" :class="{ 'tab__icon--muted': activeTab !== 3 }" />
					<text class="tab__text" :class="{ 'tab__text--on': activeTab === 3 }">{{ $t('deviceDetail.tabs.history') }}</text>
				</view>
			</view>
		</view>

		<view v-if="connecting" class="connecting-mask">
			<view class="connecting-mask__panel">
				<text class="connecting-mask__text">{{ $t('deviceDetail.conn.connecting') }}</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onLoad, onReachBottom, onUnload } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { fetchCurrentMobileUIPermissions } from '@/service/permissions'
import { appBatteryOtaCheck, type AppBatteryOtaCheck } from '@/service/app-battery'

import DashboardTab from './components/dashboard-tab.vue'
import CellsTab from './components/cells-tab.vue'
import HistoryTab from './components/history-tab.vue'
import ParamsTab from './components/params-tab.vue'

import { ensureLoggedIn } from '@/common/auth/ensure-login'
import { mac12ToColon, normalizeMac } from '@/common/device-provision/ble'
import { consumeDeviceDetailHandoff } from '@/common/device-provision/detail-handoff'
import { DEVICE_TYPE_BMS, isMeterMac } from '@/common/device-provision/device-prefix-shared'
import { parseAddDeviceScanCode } from '@/common/device-provision/scan-code'
import { getWindowInfo } from '@/common/platform'
import { useBatteryDetail } from './useBatteryDetail'
const { t } = useI18n()

type HistoryTabExposed = {
	loadMoreStatusRecords?: () => void | Promise<void>
}

type DeviceOtaCheckState = {
	checking: boolean
	checked: boolean
	needUpgrade: boolean
	targetVersion: string
	firmwareUrl: string
	lastCheckedVersion: string
	errorMessage: string
}

const DEVICE_HISTORY_PERMISSION = 'app_device_detail_history'
const activeTab = ref<0 | 1 | 2 | 3>(0)
const canShowHistoryTab = ref(false)
const historyTabRef = ref<HistoryTabExposed | null>(null)
const allowScanHandoff = ref(false)
const meterPanelVisible = ref(true)
const {
	battery,
	status,
	client,
	connType,
	connecting,
	bmsDataLoading,
	bmsDataLoadPhase,
	sessionMode,
	loadById,
	loadInstrumentSession,
	disconnectAll,
	disconnectBluetooth,
	retryBmsDataRead,
	reconnectBmsData,
	pausePolling,
	resumePolling,
} = useBatteryDetail()
const sessionActionButtonStyle = {
	width: '100%',
	height: '76rpx',
	borderRadius: '16rpx',
	fontSize: '28rpx',
	fontWeight: 600,
}

const statusBarHeight = getWindowInfo().statusBarHeight || 0
const safeBottom = getWindowInfo().safeAreaInsets?.bottom || 0
let mpExtraNavHeight = 0
// #ifdef MP-WEIXIN
mpExtraNavHeight = 32
// #endif
const navHeight = 44 + statusBarHeight + mpExtraNavHeight
const rpx2px = Number(getWindowInfo().windowWidth || getWindowInfo().screenWidth || 375) / 750
const contentBottomPadPx = Math.round(160 * rpx2px + safeBottom)
const windowHeight = Number(getWindowInfo().windowHeight || getWindowInfo().screenHeight || 667)
const historyViewportHeightPx = Math.max(320, Math.floor(windowHeight - navHeight - contentBottomPadPx))
const sessionFloatTopPx = navHeight + Math.round(16 * rpx2px)

const titleText = computed(() => {
	const name = String(battery.value?.device_name || '').trim()
	return name || t('pages.deviceDetailTitle')
})

const allowOta = computed(() => connType.value === 'bluetooth' || sessionMode.value === 'cloud')
const currentBleMac = computed(() =>
	String(battery.value?.ble_mac || status.value?.identity?.bluetoothMac || '').trim()
)
const isMeterDevice = computed(() => isMeterMac(currentBleMac.value))
const showMeterScanHandoff = computed(() => sessionMode.value === 'instrument' && allowScanHandoff.value)
const showMeterPanelReady = computed(() => showMeterScanHandoff.value && connType.value === 'bluetooth' && !connecting.value)
const showMeterFloatingPanel = computed(() => showMeterPanelReady.value && meterPanelVisible.value && activeTab.value === 0)
const showMeterPanelTrigger = computed(() => showMeterPanelReady.value && !meterPanelVisible.value)
const otaCheckState = reactive<DeviceOtaCheckState>({
	checking: false,
	checked: false,
	needUpgrade: false,
	targetVersion: '',
	firmwareUrl: '',
	lastCheckedVersion: '',
	errorMessage: '',
})
const otaAutoCheckedKeys = new Set<string>()
const showOtaBadge = computed(() => allowOta.value && !isMeterDevice.value && otaCheckState.needUpgrade)

const patchOtaCheckState = (patch: Partial<DeviceOtaCheckState>) => {
	Object.assign(otaCheckState, patch)
}

const applyOtaCheckResult = (payload: AppBatteryOtaCheck | null, version: string) => {
	const data = payload || ({} as AppBatteryOtaCheck)
	patchOtaCheckState({
		checking: false,
		checked: true,
		needUpgrade: !!data.need_upgrade,
		targetVersion: String(data.target_version || data.version || '').trim(),
		firmwareUrl: String(data.firmware_url || (data as any).package_url || '').trim(),
		lastCheckedVersion: version,
		errorMessage: '',
	})
}

const maybeCheckOtaOnDashboard = async () => {
	if (activeTab.value !== 0) return
	if (!allowOta.value) return
	if (isMeterDevice.value) return
	const deviceId = String(battery.value?.device_id || '').trim()
	const modelName = String(status.value?.identity?.hardwareModel || battery.value?.battery_model_name || '').trim()
	const versionText = String(status.value?.meta?.softwareVersion || battery.value?.fw_version || '').trim()
	if (!modelName || !versionText) return

	const requestIdentity = deviceId || String(battery.value?.ble_mac || '').trim() || sessionMode.value
	const requestKey = `${sessionMode.value}::${requestIdentity}::${modelName}::${versionText}`
	if (otaCheckState.checking || otaAutoCheckedKeys.has(requestKey)) return

	otaAutoCheckedKeys.add(requestKey)
	patchOtaCheckState({
		checking: true,
		checked: false,
		errorMessage: '',
	})

	try {
		const rsp = await appBatteryOtaCheck({
			device_id: deviceId || undefined,
			model: modelName,
			version: versionText,
			battery_model_id: String(battery.value?.battery_model_id || '').trim() || undefined,
			batch_number: String(battery.value?.batch_number || '').trim() || undefined,
			item_uuid: String(battery.value?.item_uuid || '').trim() || undefined,
		})
		if (!rsp || rsp.code !== 200) throw new Error('ota check failed')
		applyOtaCheckResult(rsp.data || null, versionText)
	} catch (e) {
		patchOtaCheckState({
			checking: false,
			errorMessage: e instanceof Error ? e.message : String(e || ''),
		})
		console.warn('[device-detail] ota precheck failed', {
			device_id: deviceId,
			model: modelName,
			version: versionText,
			error: e instanceof Error ? e.message : String(e || ''),
		})
	}
}

const connText = computed(() => {
	if (connecting.value) return t('deviceDetail.conn.connecting') as string
	if (connType.value === 'bluetooth') return t('deviceDetail.conn.bluetooth') as string
	if (connType.value === 'mqtt') return t('deviceDetail.conn.connected') as string
	return t('deviceDetail.conn.offline') as string
})

const connIcon = computed(() => {
	if (connecting.value) return '/static/image/device/icon-bluetoolth@2x.png'
	if (connType.value === 'bluetooth') return '/static/image/device/icon-bluetoolth@2x.png'
	return '/static/image/home/icon-unlink@2x.png'
})

const showFourGConnIcon = computed(() => !connecting.value && connType.value === 'mqtt')

const connClass = computed(() => {
	if (connecting.value) return 'connecting'
	return connType.value
})

const showBleDisconnectBtn = computed(() => connType.value === 'bluetooth' && !connecting.value)
const showBmsDataLoading = computed(
	() =>
		activeTab.value === 0 &&
		!connecting.value &&
		bmsDataLoading.value &&
		!status.value &&
		(connType.value === 'bluetooth' || connType.value === 'mqtt')
)
const bmsDataLoadingDescText = computed(() => {
	if (bmsDataLoadPhase.value === 'retrying') return t('deviceDetail.dashboard.loadingRetryingDesc') as string
	if (bmsDataLoadPhase.value === 'failed') return t('deviceDetail.dashboard.loadingFailedDesc') as string
	if (bmsDataLoadPhase.value === 'slow') return t('deviceDetail.dashboard.loadingSlowDesc') as string
	return t('deviceDetail.dashboard.loadingDesc') as string
})
const showBmsDataActionButtons = computed(
	() =>
		showBmsDataLoading.value &&
		!connecting.value &&
		(bmsDataLoadPhase.value === 'slow' || bmsDataLoadPhase.value === 'failed')
)

const loadHistoryPermission = async () => {
	try {
		const resp = await fetchCurrentMobileUIPermissions()
		const data = (resp as any)?.data || {}
		const codes = Array.isArray(data?.ui_codes) ? data.ui_codes.map((item: unknown) => String(item || '').trim()) : []
		canShowHistoryTab.value = codes.includes(DEVICE_HISTORY_PERMISSION)
	} catch (e) {
		canShowHistoryTab.value = false
		console.warn('[device-detail] load mobile permissions failed', e)
	}
}

const goBack = () => uni.navigateBack()

const openMeterPanel = () => {
	meterPanelVisible.value = true
	if (activeTab.value !== 0) activeTab.value = 0
}

const closeMeterPanel = () => {
	meterPanelVisible.value = false
}

function safeDecodeURIComponent(input: string): string {
	try {
		return decodeURIComponent(String(input || ''))
	} catch (e) {
		return String(input || '')
	}
}

const reconnectInstrumentSession = async (options: { meterBleMac: string; meterName: string; reason: string }) => {
	const { meterBleMac, meterName, reason } = options
	if (!meterBleMac) return
	const disconnected = await disconnectBluetooth()
	console.log('[meter-session] reconnect instrument session', {
		meter_ble_mac: meterBleMac,
		disconnected,
		reason,
		reconnect_after_ms: 900,
	})
	setTimeout(() => {
		loadInstrumentSession({
			bleMac: meterBleMac,
			deviceId: '',
			deviceName: meterName || (t('deviceDetail.meter.deviceName') as string),
		})
	}, 450)
}

const onDisconnectBluetooth = async () => {
	if (!showBleDisconnectBtn.value) return
	const ok = await disconnectBluetooth()
	uni.showToast({
		title: ok ? (t('deviceDetail.conn.disconnected') as string) : (t('deviceDetail.conn.disconnectionFailed') as string),
		icon: 'none',
	})
}

watch(
	() => activeTab.value,
	(tab) => {
		if (tab === 2 || tab === 3) {
			pausePolling()
		} else {
			resumePolling()
		}
	},
	{ immediate: true }
)

watch(
	() => canShowHistoryTab.value,
	(visible) => {
		if (!visible && activeTab.value === 3) {
			activeTab.value = 0
		}
	}
)

watch(
	() => [
		activeTab.value,
		sessionMode.value,
		allowOta.value,
		battery.value?.device_id || '',
		battery.value?.battery_model_name || '',
		battery.value?.fw_version || '',
		status.value?.identity?.hardwareModel || '',
		status.value?.meta?.softwareVersion || '',
	],
	() => {
		void maybeCheckOtaOnDashboard()
	},
	{ immediate: true }
)

const scanAndBindBms = async () => {
	if (!ensureLoggedIn()) return
	const activeClient = client.value
	if (!activeClient || connType.value !== 'bluetooth') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	const meterBleMac = String(battery.value?.ble_mac || '').trim()
	const meterName = String(battery.value?.device_name || '').trim()
	uni.scanCode({
		onlyFromCamera: true,
		scanType: ['qrCode'],
		success: async (result) => {
			const parsed = parseAddDeviceScanCode((result as any)?.result)
			console.log('[meter-session] scan result', {
				raw: String((result as any)?.result || ''),
				parsed,
				meter_ble_mac: meterBleMac || null,
			})
			if (!parsed || parsed.type !== 'mac' || parsed.deviceType !== DEVICE_TYPE_BMS) {
				uni.showToast({ title: t('deviceDetail.meter.onlyBmsMacTip') as string, icon: 'none' })
				return
			}
			uni.showLoading({ title: t('common.loading') as string, mask: true })
			pausePolling()
			await new Promise((resolve) => setTimeout(resolve, 160))
			try {
				console.log('[meter-session] configure meter target start', {
					meter_ble_mac: meterBleMac || null,
					target_bms_mac: parsed.value,
				})
				await activeClient.configureMeterMac({ meterAddress: 0xfc, mac: mac12ToColon(parsed.value) })
				console.log('[meter-session] configure meter target ok', {
					meter_ble_mac: meterBleMac || null,
					target_bms_mac: parsed.value,
				})
				uni.showToast({ title: t('deviceDetail.meter.bindTargetSuccess') as string, icon: 'none' })
				await reconnectInstrumentSession({
					meterBleMac,
					meterName,
					reason: 'configure_ack',
				})
			} catch (e) {
				console.error('[meter-session] configure meter target failed', e)
				const errMessage = e instanceof Error ? e.message : String(e || '')
				const isTimeout = errMessage.includes('BLE request timeout')
				if (isTimeout) {
					console.log('[meter-session] configure meter target timeout, treat as ambiguous success and reconnect', {
						meter_ble_mac: meterBleMac || null,
						target_bms_mac: parsed.value,
					})
					uni.showToast({ title: t('deviceDetail.meter.bindTargetPending') as string, icon: 'none' })
					await reconnectInstrumentSession({
						meterBleMac,
						meterName,
						reason: 'configure_timeout',
					})
				} else {
					uni.showToast({ title: t('deviceDetail.meter.bindTargetFailed') as string, icon: 'none' })
					if (activeTab.value !== 2 && activeTab.value !== 3) {
						setTimeout(() => {
							resumePolling()
						}, 300)
					}
				}
			} finally {
				uni.hideLoading()
			}
		},
		fail: () => {},
	})
}

onLoad((query) => {
	const rawQuery = (query as any) || {}
	void loadHistoryPermission()
	if (String(rawQuery.session_mode || '').trim() === 'instrument') {
		const bleMac = normalizeMac(String(rawQuery.ble_mac || rawQuery.mac || ''))
		if (!bleMac) {
			uni.showToast({ title: t('pages.deviceProvision.invalidCode') as string, icon: 'none' })
			return
		}
		allowScanHandoff.value = String(rawQuery.allow_scan_handoff || '1') !== '0'
		meterPanelVisible.value = true
		const deviceName = safeDecodeURIComponent(String(rawQuery.device_name || ''))
		const bleDeviceId = safeDecodeURIComponent(String(rawQuery.ble_device_id || rawQuery.deviceId || ''))
		loadInstrumentSession({
			bleMac,
			deviceId: bleDeviceId,
			deviceName: deviceName || (t('deviceDetail.meter.deviceName') as string),
		})
		return
	}
	allowScanHandoff.value = false
	meterPanelVisible.value = false
	const id = String(rawQuery.device_id || rawQuery.id || '').trim()
	const handoff = consumeDeviceDetailHandoff(id)
	loadById(id, { handoff, preferWarmBle: true })
})

onReachBottom(() => {
	if (!canShowHistoryTab.value || activeTab.value !== 3) return
	void historyTabRef.value?.loadMoreStatusRecords?.()
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
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12rpx;
}

.nav__conn-row {
	padding: 0 24rpx 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
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

.conn-pill--connecting {
	background: rgba(11, 59, 255, 0.12);
	color: #0b3bff;
}

.conn-pill__icon {
	width: 24rpx;
	height: 24rpx;
}

.conn-pill__icon--4g {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30rpx;
	height: 22rpx;
	font-size: 16rpx;
	font-weight: 700;
	line-height: 1;
	color: currentColor;
}

.conn-pill__text {
	font-size: 22rpx;
}

.conn-disconnect {
	height: 44rpx;
	padding: 0 14rpx;
	border-radius: 22rpx;
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	border: 1rpx solid rgba(36, 111, 221, 0.35);
	background: #ffffff;
}

.conn-disconnect--hover {
	opacity: 0.85;
}

.conn-disconnect__text {
	font-size: 22rpx;
	color: #246fdd;
}

.meter-entry {
	width: 44rpx;
	height: 44rpx;
	border-radius: 22rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 1rpx solid rgba(36, 111, 221, 0.18);
	background: rgba(255, 255, 255, 0.92);
	box-shadow: 0 6rpx 16rpx rgba(36, 111, 221, 0.08);
	flex-shrink: 0;
}

.meter-entry--hover {
	opacity: 0.85;
}

.meter-entry__icon {
	width: 24rpx;
	height: 24rpx;
}

.content {
	position: relative;
	z-index: 1;
	box-sizing: border-box;
}

.data-loading {
	margin: 24rpx;
	min-height: 520rpx;
	border-radius: 28rpx;
	background: rgba(255, 255, 255, 0.92);
	box-shadow: 0 12rpx 34rpx rgba(36, 111, 221, 0.08);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48rpx 36rpx;
	box-sizing: border-box;
}

.data-loading__spinner {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	border: 5rpx solid rgba(11, 59, 255, 0.14);
	border-top-color: #0b3bff;
	animation: data-loading-spin 0.8s linear infinite;
}

.data-loading__title {
	margin-top: 24rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #1f2937;
	text-align: center;
}

.data-loading__desc {
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #6b7280;
	text-align: center;
}

.data-loading__actions {
	margin-top: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 18rpx;
	flex-wrap: wrap;
}

.data-loading__btn {
	min-width: 176rpx;
	height: 64rpx;
	padding: 0 24rpx;
	border-radius: 32rpx;
	border: 2rpx solid rgba(36, 111, 221, 0.18);
	background: #ffffff;
	color: #246fdd;
	font-size: 24rpx;
	font-weight: 600;
	line-height: 64rpx;
	text-align: center;
	box-sizing: border-box;
}

.data-loading__btn--primary {
	background: #246fdd;
	color: #ffffff;
	border-color: #246fdd;
}

.data-loading__btn--hover {
	opacity: 0.82;
}

@keyframes data-loading-spin {
	to {
		transform: rotate(360deg);
	}
}

.session-float {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	z-index: 12;
}

.session-float--mp {
	left: 24rpx;
	right: 24rpx;
}

.session-card {
	padding: 24rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.82);
	backdrop-filter: blur(18rpx);
	box-shadow: 0 12rpx 32rpx rgba(36, 111, 221, 0.12);
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 18rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.6);
}

.session-card--mp {
	padding: 24rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.88);
	box-shadow: 0 12rpx 32rpx rgba(36, 111, 221, 0.12);
	border: 1rpx solid rgba(255, 255, 255, 0.6);
}

.session-card__head {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
}

.session-card__head--mp {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
}

.session-card__main {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	flex: 1;
	min-width: 0;
}

.session-card__main--mp {
	width: 0;
	flex: 1;
}

.session-card__title {
	font-size: 28rpx;
	font-weight: 600;
	color: #1f2937;
	line-height: 1.35;
	word-break: break-word;
}

.session-card__title--mp {
	font-size: 28rpx;
	font-weight: 600;
	color: #1f2937;
	line-height: 40rpx;
}

.session-card__desc {
	font-size: 24rpx;
	line-height: 1.5;
	color: #5b6472;
	word-break: break-word;
}

.session-card__desc--mp {
	margin-top: 10rpx;
	font-size: 24rpx;
	line-height: 36rpx;
	color: #5b6472;
}

.session-card__action {
	width: 100%;
}

.session-card__action--mp {
	margin-top: 18rpx;
}

.session-card__collapse {
	width: 52rpx;
	height: 52rpx;
	border-radius: 26rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.78);
	border: 1rpx solid rgba(107, 114, 128, 0.12);
	flex-shrink: 0;
}

.session-card__collapse--mp {
	margin-left: 16rpx;
}

.session-card__collapse--hover {
	opacity: 0.85;
}

.session-card__collapse-text {
	font-size: 40rpx;
	line-height: 40rpx;
	color: #6b7280;
	text-align: center;
}

.session-card__cta {
	height: 76rpx;
	border-radius: 16rpx;
	background: #1d3db7;
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
	line-height: 76rpx;
	text-align: center;
}

.session-card__cta--hover {
	opacity: 0.88;
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

.connecting-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.12);
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
}

.connecting-mask__panel {
	padding: 20rpx 32rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 999px;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.12);
}

.connecting-mask__text {
	font-size: 24rpx;
	color: #333333;
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

.tab__text-wrap {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.tab__icon {
	width: 44rpx;
	height: 44rpx;
}

.tab__icon--muted {
	opacity: 0.48;
}

.tab__text {
	font-size: 22rpx;
	color: #8e95a2;
}

.tab__text--on {
	color: #0b3bff;
	font-weight: 600;
}

.tab__badge {
	position: absolute;
	top: -6rpx;
	right: -14rpx;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: #ff4d4f;
	box-shadow: 0 0 0 3rpx rgba(255, 255, 255, 0.92);
}
</style>
