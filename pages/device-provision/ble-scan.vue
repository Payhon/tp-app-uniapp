<template>
	<view :style="{ height: pageHeight, background: '#f5f5f5' }">
		<customNav :pageTitle="$t('pages.deviceProvision.bleSearchTitle')" iconColor="#fff" background="#246FDD" fontColor="#fff" />

		<view class="wrap" :style="{ marginTop: marginTopHeight }">
				<view class="radar-card">
					<view class="radar" :class="{ running: isScanning }">
						<view class="radar-pulse p1"></view>
						<view class="radar-pulse p2"></view>
						<view class="radar-pulse p3"></view>
						<view class="radar-sweep" :class="{ running: isScanning }"></view>
						<view class="radar-dot" v-if="isScanning && visibleDevices.length"></view>
					</view>
					<view class="radar-text">
						<text class="radar-title">{{ isScanning ? $t('pages.deviceProvision.scanning') : $t('pages.deviceProvision.scanStopped') }}</text>
						<text v-if="visibleDevices.length" class="radar-sub">{{ format(t('pages.deviceProvision.discoveredCount') as string, { count: visibleDevices.length }) }}</text>
					</view>
				</view>

			<view class="hint" v-if="targetMac">
				<text class="hint-text">{{ $t('pages.deviceProvision.matchingMac', { mac: targetMacDisplay }) }}</text>
			</view>

				<view class="actions">
					<u-button
						:type="isScanning ? 'error' : 'primary'"
						size="small"
						:loading="starting"
						:color="isScanning ? '#E54D42' : '#246FDD'"
						@click="toggleScan"
					>
						{{ isScanning ? $t('pages.deviceProvision.stopScan') : $t('pages.deviceProvision.startScan') }}
					</u-button>
					<u-button type="info" size="small" color="#F2F3F5" :customStyle="{ backgroundColor: '#F2F3F5', borderColor: '#E5E6EB', color: '#4E5969' }" @click="clearList">
						{{ $t('pages.deviceProvision.clearList') }}
					</u-button>
				</view>

			<view class="status" v-if="errorMsg">
				<text class="status-error">{{ errorMsg }}</text>
			</view>

			<scroll-view scroll-y class="list">
					<view v-for="d in visibleDevices" :key="d.deviceId" class="item" @click="selectDevice(d)">
						<view class="item-main">
							<text class="item-name">{{ d.displayName }}</text>
							<text class="item-rssi">{{ d.RSSI == null ? '' : format(t('pages.deviceProvision.rssi') as string, { rssi: d.RSSI }) }}</text>
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
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { mac12ToColon, normalizeMac, parseMacFromAdvertisement } from '@/common/device-provision/ble'
import { formatUniError } from '@/common/device-provision/error'
import { BMS_BLE_SERVICE_UUID } from '@/common/lib/bms-protocol'

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const wx: any

type FoundDevice = {
	deviceId: string
	name?: string
	localName?: string
	RSSI?: number
	advertisData?: ArrayBuffer
	advertisingData?: ArrayBuffer
	advertisServiceUUIDs?: string[]
	serviceData?: Record<string, unknown>
}

type DeviceRow = {
	deviceId: string
	displayName: string
	RSSI: number | null
	advMac: string | null
	lastSeenAt: number
}

const { t } = useI18n()

function format(template: string, params: Record<string, string | number | null | undefined>): string {
	let out = String(template || '')
	for (const [k, v] of Object.entries(params)) {
		const val = v == null ? '' : String(v)
		out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), val)
	}
	return out
}

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
const debugLogFoundCount = ref(0)
const debugLogFilteredCount = ref(0)
const debugSeenDeviceIds = new Set<string>()
let fallbackTimer: ReturnType<typeof setTimeout> | null = null

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

function normalizeUuid(u: unknown): string {
	return String(u || '').trim().toLowerCase()
}

function hasServiceDataKey(d: FoundDevice, targetKey: string): boolean {
	const obj = (d as any)?.serviceData
	if (!obj || typeof obj !== 'object') return false
	const keys = Object.keys(obj)
	const target = normalizeUuid(targetKey)
	return keys.some((k) => normalizeUuid(k) === target)
}

function isTargetDevice(d: FoundDevice): { ok: boolean; reason?: string } {
	const name = String(d?.name || d?.localName || '').trim()
	if (!name) return { ok: false, reason: 'empty-name' }
	if (!name.toUpperCase().startsWith('FJ')) return { ok: false, reason: 'name-not-fj' }

	// 你的过滤条件：
	// 1) name 不为空且以 FJ 开头
	// 2) serviceData 包含 0000180A-0000-1000-8000-00805F9B34FB 这个 key
	const has180a = hasServiceDataKey(d, '0000180A-0000-1000-8000-00805F9B34FB')
	if (!has180a) return { ok: false, reason: 'no-180a' }
	return { ok: true }

}

function logFoundDeviceOnce(d: FoundDevice) {
	if (!d?.deviceId) return
	if (debugSeenDeviceIds.has(d.deviceId)) return
	debugSeenDeviceIds.add(d.deviceId)
	if (debugLogFoundCount.value >= 80) return

	debugLogFoundCount.value += 1
	const name = String(d?.name || d?.localName || '')
	const advSvcs = Array.isArray((d as any).advertisServiceUUIDs) ? (d as any).advertisServiceUUIDs : []
	const serviceDataKeys = (d as any)?.serviceData && typeof (d as any).serviceData === 'object' ? Object.keys((d as any).serviceData) : []
	console.log('[ble-scan] found device', {
		deviceId: d.deviceId,
		name,
		RSSI: d.RSSI,
		advertisServiceUUIDs: advSvcs,
		serviceDataKeys,
		targetService: BMS_BLE_SERVICE_UUID,
	})
}

function upsertDevice(d: FoundDevice) {
	if (!d?.deviceId) return

	logFoundDeviceOnce(d)

	const match = isTargetDevice(d)
	if (!match.ok) {
		// 过滤调试日志（避免刷屏）
		if (debugLogFilteredCount.value < 80) {
			debugLogFilteredCount.value += 1
			const name = String(d?.name || d?.localName || '')
			const advSvcs = Array.isArray((d as any).advertisServiceUUIDs) ? (d as any).advertisServiceUUIDs : []
			const serviceDataKeys = (d as any)?.serviceData && typeof (d as any).serviceData === 'object' ? Object.keys((d as any).serviceData) : []
			console.log('[ble-scan] filtered device', {
				reason: match.reason,
				deviceId: d.deviceId,
				name,
				RSSI: d.RSSI,
				advertisServiceUUIDs: advSvcs,
				serviceDataKeys,
				targetService: BMS_BLE_SERVICE_UUID,
			})
		}
		return
	}

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
	// 用于确认回调有触发（避免“完全无打印”时无法判断是否在扫描）
	if (list.length && debugSeenDeviceIds.size === 0) {
		try {
			const d0 = list[0] as any
			console.log('[ble-scan] onDeviceFound', { count: list.length, first: { deviceId: d0?.deviceId, name: d0?.name || d0?.localName, RSSI: d0?.RSSI } })
		} catch (e) {}
	}
	list.forEach((d) => upsertDevice(d))
}

async function startScan() {
	starting.value = true
	errorMsg.value = ''
	try {
		console.log('[ble-scan] startScan')

		const getErrCode = (e: any) => e?.errCode ?? e?.code
		const getErrMsg = (e: any) => String(e?.errMsg ?? e?.message ?? '')

		const openBluetoothAdapterOnce = () =>
			new Promise((resolve, reject) => {
				// #ifdef MP-WEIXIN
				// 微信小程序：显式指定 central 模式，避免部分机型/基础库兼容问题
				;(wx as any).openBluetoothAdapter({ mode: 'central', success: resolve, fail: reject })
				// #endif
				// #ifndef MP-WEIXIN
				uni.openBluetoothAdapter({ success: resolve, fail: reject })
				// #endif
			})

		try {
			await openBluetoothAdapterOnce()
		} catch (e) {
			// 微信小程序：若提示隐私未授权，尝试触发隐私授权后重试
			//（部分基础库对蓝牙相关 API 也走隐私合规校验）
			// #ifdef MP-WEIXIN
			const msg = getErrMsg(e).toLowerCase()
			const requirePrivacyAuthorize = (wx as any).requirePrivacyAuthorize
			if (msg.includes('privacy') && typeof requirePrivacyAuthorize === 'function') {
				await new Promise((resolve) => {
					requirePrivacyAuthorize({ complete: resolve })
				})
				await openBluetoothAdapterOnce()
			} else {
				throw e
			}
			// #endif
			// #ifndef MP-WEIXIN
			throw e
			// #endif
		}

		// uni-app 部分平台支持 offBluetoothDeviceFound；这里优先卸载旧回调避免重复。
		// #ifdef MP-WEIXIN
		const wxOff = (wx as any).offBluetoothDeviceFound
		if (typeof wxOff === 'function') wxOff(onDeviceFound)
		;(wx as any).onBluetoothDeviceFound(onDeviceFound as any)
		// #endif
		// #ifndef MP-WEIXIN
		const offFn = (uni as any).offBluetoothDeviceFound
		if (typeof offFn === 'function') offFn(onDeviceFound)
		uni.onBluetoothDeviceFound(onDeviceFound as any)
		// #endif

		const startDiscovery = async ({ withServiceFilter }: { withServiceFilter: boolean }) => {
			await new Promise((resolve, reject) => {
				// #ifdef MP-WEIXIN
				;(wx as any).startBluetoothDevicesDiscovery({
					services: withServiceFilter ? [BMS_BLE_SERVICE_UUID] : undefined,
					allowDuplicatesKey: true,
					success: resolve,
					fail: reject,
				})
				// #endif
				// #ifndef MP-WEIXIN
				uni.startBluetoothDevicesDiscovery({
					services: withServiceFilter ? [BMS_BLE_SERVICE_UUID] : undefined,
					allowDuplicatesKey: true,
					success: resolve,
					fail: reject,
				})
				// #endif
			})
			console.log('[ble-scan] discovery started', { withServiceFilter, serviceUUID: BMS_BLE_SERVICE_UUID })
		}

		debugLogFoundCount.value = 0
		debugLogFilteredCount.value = 0
		debugSeenDeviceIds.clear()
		if (fallbackTimer) clearTimeout(fallbackTimer)
		isScanning.value = true
		try {
			await startDiscovery({ withServiceFilter: true })
		} catch (e) {
			// 微信小程序：部分 Android 机型扫描蓝牙需要开启定位服务/授权定位权限
			const code = getErrCode(e)
			const msg = getErrMsg(e).toLowerCase()
			const maybeLocation = msg.includes('location') || msg.includes('permission') || code === 10012
			if (maybeLocation) {
				// #ifdef MP-WEIXIN
				try {
					await new Promise((resolve, reject) => {
						;(wx as any).authorize({
							scope: 'scope.userLocation',
							success: resolve,
							fail: reject,
						})
					})
					await startDiscovery({ withServiceFilter: true })
				} catch (e2) {
					throw e2
				}
				// #endif
				// #ifndef MP-WEIXIN
				throw e
				// #endif
			} else {
				throw e
			}
		}

		// 重要：部分设备（或 uni 返回字段）不会暴露 advertisServiceUUIDs，导致使用 services 过滤时完全发现不了设备；
		// 这里做一次自动降级：若短时间内“一个设备都没发现”，则重启扫描并取消 services 过滤。
		fallbackTimer = setTimeout(async () => {
			if (!isScanning.value) return
			if (debugSeenDeviceIds.size > 0) return
			try {
				console.warn('[ble-scan] no devices found with service filter, fallback to discovery without services')
				await new Promise((resolve) => uni.stopBluetoothDevicesDiscovery({ complete: resolve }))
				await startDiscovery({ withServiceFilter: false })
			} catch (e) {
				console.warn('[ble-scan] fallback discovery failed', e)
			}
		}, 1200)
	} catch (e) {
		console.error('[ble-scan] startScan failed', e)
		const msg = formatUniError(e)
		// NOTE: 某些平台/运行时在 script 内对 i18n 插值支持不稳定，这里用本地 format 做兜底
		errorMsg.value = format(t('pages.deviceProvision.bleInitFailed') as string, { error: msg })

		// 微信小程序：引导用户开启系统蓝牙
		// errCode 10001 常见于 “Bluetooth not enabled/available”
		const anyErr = e as any
		const code = anyErr?.errCode ?? anyErr?.code
		const errMsg = String(anyErr?.errMsg ?? '')
		if (code === 10001 || errMsg.toLowerCase().includes('bluetooth')) {
			// 尽量不打断用户：仅在可用时提供跳转入口
			const openBtSetting = (uni as any).openSystemBluetoothSetting
			if (typeof openBtSetting === 'function') {
				uni.showModal({
					title: t('common.tip'),
					content: t('pages.deviceProvision.enableBluetoothTip'),
					confirmText: t('common.confirm'),
					cancelText: t('common.cancel'),
					success: (res: UniApp.ShowModalRes) => {
						if (res.confirm) openBtSetting()
					},
				})
			}
		}
	} finally {
		starting.value = false
	}
}

async function stopScan() {
	try {
		if (fallbackTimer) clearTimeout(fallbackTimer)
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
	stopScan().finally(() => {
		uni.navigateTo({
			url: `/pages/device-provision/provision-wizard?deviceId=${encodeURIComponent(d.deviceId)}${
				targetMac.value ? `&qrMac=${targetMac.value}` : ''
			}`,
		})
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

onHide(() => {
	// 页面离开（跳转/切后台）即停止扫描，避免占用系统资源
	stopScan()
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

.radar-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
	display: flex;
	align-items: center;
	gap: 18rpx;
}

.radar {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	background: radial-gradient(circle at center, rgba(36, 111, 221, 0.18) 0%, rgba(36, 111, 221, 0.05) 60%, rgba(36, 111, 221, 0.02) 100%);
	position: relative;
	overflow: hidden;
}

.radar-pulse {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(36, 111, 221, 0.35);
	transform: translate(-50%, -50%);
	opacity: 0;
}

.radar-sweep {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 140rpx;
	height: 140rpx;
	transform: translate(-50%, -50%) rotate(0deg);
	transform-origin: center;
	background: conic-gradient(from 0deg, rgba(36, 111, 221, 0.0) 0deg, rgba(36, 111, 221, 0.0) 300deg, rgba(36, 111, 221, 0.28) 360deg);
	opacity: 0.9;
}
.radar-sweep.running {
	animation: radarRotate 1.4s linear infinite;
}

.radar.running .radar-pulse {
	animation: radarPulse 2.4s infinite;
}
.radar.running .radar-pulse.p2 {
	animation-delay: 0.8s;
}
.radar.running .radar-pulse.p3 {
	animation-delay: 1.6s;
}

.radar-dot {
	position: absolute;
	left: 62%;
	top: 34%;
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	background: #246fdd;
	box-shadow: 0 0 12rpx rgba(36, 111, 221, 0.55);
}

.radar-text {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}
.radar-title {
	font-size: 30rpx;
	color: #111111;
	font-weight: 600;
}
.radar-sub {
	font-size: 26rpx;
	color: #666666;
}

@keyframes radarRotate {
	0% {
		transform: translate(-50%, -50%) rotate(0deg);
	}
	100% {
		transform: translate(-50%, -50%) rotate(360deg);
	}
}

@keyframes radarPulse {
	0% {
		opacity: 0.6;
		transform: translate(-50%, -50%) scale(0.2);
	}
	100% {
		opacity: 0;
		transform: translate(-50%, -50%) scale(3.8);
	}
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
