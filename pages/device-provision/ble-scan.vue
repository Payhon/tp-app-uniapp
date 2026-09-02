<template>
	<view class="page-shell" :style="{ height: pageHeight, background: '#f5f5f5' }">
		<customNav :pageTitle="$t('pages.deviceProvision.bleSearchTitle')" iconColor="#fff" background="#246FDD" fontColor="#fff" />

		<view class="wrap" :style="{ marginTop: marginTopHeight }">
			<view class="top-panel">
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
					<text class="hint-text">{{ format(t('pages.deviceProvision.matchingMac') as string, { mac: targetMacDisplay }) }}</text>
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
			</view>

			<view class="list-panel">
				<scroll-view
					scroll-y
					class="list"
					:show-scrollbar="false"
					@touchstart="handleListTouchStart"
					@touchend="handleListTouchEnd"
					@touchcancel="handleListTouchEnd"
				>
					<view v-for="d in visibleDevices" :key="d.deviceId" class="item" @click="selectDevice(d)">
						<view class="item-main">
							<view class="item-title">
								<text class="item-name">{{ d.displayName }}</text>
								<text v-if="isDeviceAlreadyAdded(d)" class="item-badge">{{ $t('pages.deviceProvision.deviceAlreadyAdded') }}</text>
							</view>
							<view class="item-signal" :class="`item-signal--${signalLevel(d.RSSI)}`">
								<view class="item-signal__bar item-signal__bar--1"></view>
								<view class="item-signal__bar item-signal__bar--2"></view>
								<view class="item-signal__bar item-signal__bar--3"></view>
								<view class="item-signal__bar item-signal__bar--4"></view>
							</view>
						</view>
					<view class="item-sub">
						<text class="item-sub-text">{{ d.deviceId }}</text>
					</view>
					<view class="item-sub" v-if="hasAdvMac(d.advMac)">
						<text class="item-sub-text">{{ format(t('pages.deviceProvision.advMac') as string, { mac: d.advMac }) }}</text>
						<text v-if="targetMac && d.advMac === targetMac" class="item-match">{{ $t('pages.deviceProvision.matched') }}</text>
					</view>
				</view>
				<view v-if="!visibleDevices.length" class="empty">
					<text class="empty-text">{{ $t('pages.deviceProvision.emptyDeviceList') }}</text>
				</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { ensureLoggedIn } from '@/common/auth/ensure-login'
import { mac12ToColon, normalizeMac, parseMacFromAdvertisement } from '@/common/device-provision/ble'
import { DEVICE_TYPE_METER, resolveDeviceTypeByMac, type SupportedDeviceType } from '@/common/device-provision/device-prefix-shared'
import { formatUniError } from '@/common/device-provision/error'
import { BMS_BLE_SERVICE_UUID } from '@/common/lib/bms-protocol/ble-uuids'
import { cancelHomeAutoConnectAttempts } from '@/common/ble/ble-client-cache'
import { acquireBleDiscoveryLease, type BleDiscoveryLease } from '@/common/ble/ble-discovery-coordinator'
import {
	BLE_SCAN_TOO_FREQUENT_RETRY_DELAY_MS,
	classifyBleScanError,
} from '@/common/ble/ble-scan-error-policy'
import { useBoundDevicesStore } from '@/store/bound-devices'
import type { DeviceDetailDiscoveryEntrySource } from '@/common/device-provision/detail-entry-source'
import {
	canRunScheduledBleScanAutoStart,
	isBleScanAutoStartRequested,
	resolveBleScanDurationMs,
	shouldScheduleBleScanAutoStart,
} from './ble-scan-entry-policy'
import {
	appendBleScanDeviceId,
	createBleScanListSortScheduler,
	sortBleScanDeviceIds,
} from './ble-scan-list-order-policy'

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const wx: any

type FoundDevice = {
	deviceId: string
	name?: string
	localName?: string
	iosMac?: string
	RSSI?: number
	advertisData?: ArrayBuffer
	advertisingData?: ArrayBuffer
	manufacturerData?: ArrayBuffer | Uint8Array | string
	manufacturerdata?: ArrayBuffer | Uint8Array | string
	advertisServiceUUIDs?: string[]
	serviceData?: Record<string, unknown>
}

type DeviceRow = {
	deviceId: string
	displayName: string
	RSSI: number | null
	advMac: string | null
	deviceType: SupportedDeviceType | null
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
const entrySource = ref<DeviceDetailDiscoveryEntrySource>('ble_search')
const targetMac = ref<string | null>(null)
const targetMacDisplay = computed(() => (targetMac.value ? mac12ToColon(targetMac.value) : ''))

const boundDevicesStore = useBoundDevicesStore()

const rows = ref<Map<string, DeviceRow>>(new Map())
const orderedDeviceIds = ref<string[]>([])
const navigated = ref(false)
const debugLogFoundCount = ref(0)
const debugLogFilteredCount = ref(0)
const debugSeenDeviceIds = new Set<string>()
let fallbackTimer: ReturnType<typeof setTimeout> | null = null
let scanTimeoutTimer: ReturnType<typeof setTimeout> | null = null
let scanQueue: Promise<void> = Promise.resolve()
let scanSessionId = 0
let pageVisible = false
let visibilityGeneration = 0
let blockedByLoginGuard = false
let autoStartRequested = false
let autoStartConsumed = false
let autoStartPending = false
let scanLease: BleDiscoveryLease | null = null
let stopScanPromise: Promise<void> | null = null

const SCAN_STOP_SETTLE_MS = 180
const ADAPTER_READY_WAIT_MS = 1200
const BLE_API_TIMEOUT_MS = 8000
const STOP_DISCOVERY_TIMEOUT_MS = 1200
const sysInfo = (() => {
	try {
		return uni.getSystemInfoSync?.() || ({} as Record<string, unknown>)
	} catch (e) {
		return {} as Record<string, unknown>
	}
})()
const defaultPageHeight = `${Number((sysInfo as any).windowHeight || (sysInfo as any).screenHeight || 667)}px`
const defaultMarginTop = (() => {
	const statusBarHeight = Number((sysInfo as any).statusBarHeight || 0)
	return `${statusBarHeight + 44}px`
})()

const visibleDevices = computed(() => {
	return orderedDeviceIds.value
		.map((deviceId) => rows.value.get(deviceId))
		.filter((item): item is DeviceRow => !!item)
})

function flushDeviceOrder() {
	const nextOrder = sortBleScanDeviceIds({
		items: Array.from(rows.value.values()),
		previousOrder: orderedDeviceIds.value,
		targetMac: targetMac.value,
	})
	if (
		nextOrder.length === orderedDeviceIds.value.length &&
		nextOrder.every((deviceId, index) => deviceId === orderedDeviceIds.value[index])
	) {
		return
	}
	orderedDeviceIds.value = nextOrder
}

const listSortScheduler = createBleScanListSortScheduler({ onFlush: flushDeviceOrder })

const hasResolvedAdvMacRows = computed(() =>
	Array.from(rows.value.values()).some((item) => !!normalizeMac(String(item?.advMac || '')))
)

const signalLevel = (rssi: number | null) => {
	if (typeof rssi !== 'number' || !Number.isFinite(rssi)) return 0
	if (rssi >= -80) return 4
	if (rssi >= -85) return 3
	if (rssi >= -90) return 2
	if (rssi >= -95) return 1
	return 0
}

const hasAdvMac = (advMac: string | null) => Boolean(String(advMac || '').trim())

function isDeviceAlreadyAdded(device: DeviceRow): boolean {
	const mac = normalizeMac(String(device?.advMac || ''))
	return !!mac && boundDevicesStore.boundBleMacSet.has(mac)
}

function getBoundDeviceByRow(device: DeviceRow) {
	const mac = normalizeMac(String(device?.advMac || ''))
	return mac ? boundDevicesStore.findByBleMac(mac) : null
}

function detailEntrySourceQuery() {
	return `&entry_source=${entrySource.value}`
}

function openBoundDeviceDetail(deviceId: string) {
	const id = String(deviceId || '').trim()
	if (!id) return false
	uni.navigateTo({
		url: `/pages/device-battery/detail?device_id=${encodeURIComponent(id)}${detailEntrySourceQuery()}`,
	})
	return true
}

function clearList() {
	listSortScheduler.cancel()
	rows.value = new Map()
	orderedDeviceIds.value = []
}

function handleListTouchStart() {
	listSortScheduler.lockForTouch()
}

function handleListTouchEnd() {
	listSortScheduler.releaseTouch()
}

function normalizeUuid(u: unknown): string {
	return String(u || '').trim().toLowerCase()
}

function parseMacFromServiceData(d: FoundDevice | null | undefined): string | null {
	if (!d?.serviceData || typeof d.serviceData !== 'object') return null
	for (const value of Object.values(d.serviceData)) {
		const mac = parseMacFromAdvertisement(value as any)
		if (mac) return mac
	}
	return null
}

function resolveAdvMacFromFoundDevice(d: FoundDevice | null | undefined): string | null {
	if (!d) return null
	return (
		normalizeMac(d.iosMac || '') ||
		parseMacFromServiceData(d) ||
		parseMacFromAdvertisement(d.advertisData || null) ||
		parseMacFromAdvertisement(d.advertisingData || null) ||
		parseMacFromAdvertisement(d.manufacturerData || null) ||
		parseMacFromAdvertisement(d.manufacturerdata || null) ||
		parseMacFromAdvertisement(d) ||
		normalizeMac(d.deviceId || '') ||
		normalizeMac(d.name || '') ||
		normalizeMac(d.localName || '')
	)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function createBleTimeoutError(label: string, timeoutMs: number) {
	return new Error(`${label} timeout after ${timeoutMs}ms`)
}

function callBleApiWithTimeout<T>({
	label,
	timeoutMs,
	invoke,
	resolveOnFail = false,
	resolveOnTimeout = false,
}: {
	label: string
	timeoutMs: number
	invoke: (handlers: {
		success: (res?: T) => void
		fail: (err?: unknown) => void
		complete: (res?: unknown) => void
	}) => void
	resolveOnFail?: boolean
	resolveOnTimeout?: boolean
}): Promise<T | undefined> {
	return new Promise((resolve, reject) => {
		let settled = false
		const finish = (fn: (value?: any) => void, value?: unknown) => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			fn(value)
		}
		const timer = setTimeout(() => {
			const err = createBleTimeoutError(label, timeoutMs)
			console.warn(`[ble-scan] ${label} timeout`, { timeoutMs })
			if (resolveOnTimeout) {
				finish(resolve)
				return
			}
			finish(reject, err)
		}, timeoutMs)

		try {
			invoke({
				success: (res?: T) => finish(resolve, res),
				fail: (err?: unknown) => {
					if (resolveOnFail) {
						console.warn(`[ble-scan] ${label} fail ignored`, err)
						finish(resolve)
						return
					}
					finish(reject, err)
				},
				complete: () => {},
			})
		} catch (e) {
			finish(reject, e)
		}
	})
}

function clearFallbackTimer() {
	if (!fallbackTimer) return
	clearTimeout(fallbackTimer)
	fallbackTimer = null
}

function clearScanTimeoutTimer() {
	if (!scanTimeoutTimer) return
	clearTimeout(scanTimeoutTimer)
	scanTimeoutTimer = null
}

function armScanTimeout(sessionId: number) {
	clearScanTimeoutTimer()
	const timeoutMs = resolveBleScanDurationMs(mode.value)
	scanTimeoutTimer = setTimeout(() => {
		if (!isScanSessionActive(sessionId) || !isScanning.value) return
		console.warn('[ble-scan] scan duration timeout, stop discovery', { sessionId, timeoutMs })
		errorMsg.value = t('pages.deviceProvision.scanTimeout') as string
		void stopScan()
	}, timeoutMs)
}

function runScanSerial<T>(task: () => Promise<T>): Promise<T> {
	const run = scanQueue.then(task, task)
	scanQueue = run.then(
		() => undefined,
		() => undefined,
	)
	return run
}

function isScanSessionActive(sessionId: number): boolean {
	return pageVisible && scanSessionId === sessionId
}

function getBluetoothAdapterStateSafe(): Promise<{ available?: boolean; discovering?: boolean } | null> {
	const getter = (uni as any).getBluetoothAdapterState
	if (typeof getter !== 'function') return Promise.resolve(null)
	return new Promise((resolve) => {
		let settled = false
		const finish = (state: { available?: boolean; discovering?: boolean } | null) => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			resolve(state)
		}
		const timer = setTimeout(() => finish(null), STOP_DISCOVERY_TIMEOUT_MS)
		try {
			getter({
				success: (res: { available?: boolean; discovering?: boolean }) => finish(res),
				fail: () => finish(null),
			})
		} catch (e) {
			finish(null)
		}
	})
}

async function ensureBluetoothAdapterReady(sessionId: number) {
	const deadline = Date.now() + ADAPTER_READY_WAIT_MS
	let state = await getBluetoothAdapterStateSafe()
	while (isScanSessionActive(sessionId) && state && state.available === false && Date.now() < deadline) {
		await sleep(120)
		state = await getBluetoothAdapterStateSafe()
	}
	if (!isScanSessionActive(sessionId)) return
	if (state?.available === false) {
		const error = new Error(t('pages.deviceProvision.bluetoothAdapterUnavailable') as string)
		;(error as any).errCode = 10001
		throw error
	}
	if (state?.discovering) {
		await stopDiscovery({ settleMs: SCAN_STOP_SETTLE_MS })
	}
}

function offDeviceFoundListener() {
	// #ifdef MP-WEIXIN
	const wxOff = (wx as any).offBluetoothDeviceFound
	if (typeof wxOff === 'function') wxOff(onDeviceFound)
	// #endif
	// #ifndef MP-WEIXIN
	const offFn = (uni as any).offBluetoothDeviceFound
	if (typeof offFn === 'function') offFn(onDeviceFound)
	// #endif
}

function bindDeviceFoundListener() {
	offDeviceFoundListener()
	// #ifdef MP-WEIXIN
	;(wx as any).onBluetoothDeviceFound(onDeviceFound as any)
	// #endif
	// #ifndef MP-WEIXIN
	uni.onBluetoothDeviceFound(onDeviceFound as any)
	// #endif
}

async function stopDiscovery({ settleMs = 0 }: { settleMs?: number } = {}) {
	const state = await getBluetoothAdapterStateSafe()
	// 状态读取失败时仍尝试停止；不能因为 state=null 遗留原生 discovery。
	if (state?.discovering !== false) {
		await callBleApiWithTimeout<void>({
			label: 'stopBluetoothDevicesDiscovery',
			timeoutMs: STOP_DISCOVERY_TIMEOUT_MS,
			resolveOnFail: true,
			resolveOnTimeout: true,
			invoke: ({ success, fail, complete }) => {
				let finished = false
				const done = () => {
					if (finished) return
					finished = true
					success()
				}
				uni.stopBluetoothDevicesDiscovery({
					success: () => done(),
					fail: (err) => {
						fail(err)
					},
					complete: () => {
						complete()
						done()
					},
				})
			},
		})
	}
	if (settleMs > 0) {
		await sleep(settleMs)
	}
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

	// 你的过滤条件：
	// 1) name 不为空
	// 2) serviceData 包含 0000180A-0000-1000-8000-00805F9B34FB 这个 key
	// 3) 某些平台首次回调不稳定，不强依赖 serviceData；若广播里能解析出支持的设备 MAC 也认为是目标设备
	const has180a = hasServiceDataKey(d, '0000180A-0000-1000-8000-00805F9B34FB')
	const advMac = resolveAdvMacFromFoundDevice(d)
	const deviceType = advMac ? resolveDeviceTypeByMac(advMac) : null
	if (advMac && !deviceType) return { ok: false, reason: 'unsupported-mac-prefix' }
	if (!has180a && !deviceType) return { ok: false, reason: 'no-identity' }
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
	const serviceDataValuePreview = (d as any)?.serviceData && typeof (d as any).serviceData === 'object'
		? Object.fromEntries(
				Object.entries((d as any).serviceData).map(([key, value]) => [key, parseMacFromAdvertisement(value as any) || '[unparsed]'])
			)
		: undefined
	const advMac = resolveAdvMacFromFoundDevice(d)
	console.log('[ble-scan] found device', {
		deviceId: d.deviceId,
		name,
		RSSI: d.RSSI,
		advMac,
		hasManufacturerData: !!((d as any).manufacturerData || (d as any).manufacturerdata),
		advertisServiceUUIDs: advSvcs,
		serviceDataKeys,
		serviceDataValuePreview,
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
			const serviceDataValuePreview = (d as any)?.serviceData && typeof (d as any).serviceData === 'object'
				? Object.fromEntries(
						Object.entries((d as any).serviceData).map(([key, value]) => [key, parseMacFromAdvertisement(value as any) || '[unparsed]'])
					)
				: undefined
			const advMac = resolveAdvMacFromFoundDevice(d)
			console.log('[ble-scan] filtered device', {
				reason: match.reason,
				deviceId: d.deviceId,
				name,
				RSSI: d.RSSI,
				advMac,
				hasManufacturerData: !!((d as any).manufacturerData || (d as any).manufacturerdata),
				advertisServiceUUIDs: advSvcs,
				serviceDataKeys,
				serviceDataValuePreview,
				targetService: BMS_BLE_SERVICE_UUID,
			})
		}
		return
	}

	const advMac = resolveAdvMacFromFoundDevice(d)
	const existing = rows.value.get(d.deviceId)
	const deviceType = advMac ? resolveDeviceTypeByMac(advMac) : existing?.deviceType ?? null
	const displayName = String(d.name || d.localName || t('pages.deviceProvision.unknownDevice'))
	const nextRow: DeviceRow = {
		deviceId: d.deviceId,
		displayName,
		RSSI: typeof d.RSSI === 'number' ? d.RSSI : existing?.RSSI ?? null,
		advMac: advMac || existing?.advMac || null,
		deviceType,
		lastSeenAt: Date.now(),
	}
	rows.value.set(d.deviceId, nextRow)
	if (!existing) {
		// 新设备立即追加到末尾，不挤动用户正在查看或准备点击的已有设备。
		orderedDeviceIds.value = appendBleScanDeviceId(orderedDeviceIds.value, d.deviceId)
	}
	if (!existing || existing.RSSI !== nextRow.RSSI || existing.advMac !== nextRow.advMac) {
		listSortScheduler.markDirty()
	}

	// 扫码模式：发现匹配设备后自动进入向导页
	if (mode.value === 'qr' && targetMac.value && advMac === targetMac.value && !navigated.value) {
		navigated.value = true
		stopScan().finally(() => {
			uni.navigateTo({
				url: `/pages/device-provision/provision-wizard?deviceId=${encodeURIComponent(d.deviceId)}&qrMac=${targetMac.value}&advMac=${encodeURIComponent(advMac)}&entry_source=scan`,
			})
		})
	}
}

const onDeviceFound = (res: { devices?: FoundDevice[] }) => {
	if (!pageVisible || !isScanning.value) return
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
	return runScanSerial(async () => {
		const sessionId = ++scanSessionId
		let lease: BleDiscoveryLease | null = null
		let keepLeaseForActiveScan = false
		let nativeDiscoveryStarted = false
		starting.value = true
		errorMsg.value = ''
		clearScanTimeoutTimer()
		try {
			if (!isScanSessionActive(sessionId)) return
			// 新一轮搜索不复用上轮列表，避免旧 RSSI 排序及旧 MAC 干扰扫描降级。
			clearList()
			console.log('[ble-scan] startScan', { sessionId })
			// 搜索页交互扫描优先于首页遗留的自动连接任务，避免等待连接/扫描超时后才能取得 discovery 租约。
			cancelHomeAutoConnectAttempts('interactive BLE scan started')
			lease = await acquireBleDiscoveryLease(`ble-scan-page:${sessionId}`)
			if (!isScanSessionActive(sessionId)) {
				lease.release()
				return
			}
			scanLease = lease

			const getErrMsg = (e: any) => String(e?.errMsg ?? e?.message ?? '')

			const openBluetoothAdapterOnce = () =>
				callBleApiWithTimeout({
					label: 'openBluetoothAdapter',
					timeoutMs: BLE_API_TIMEOUT_MS,
					invoke: ({ success, fail }) => {
						// #ifdef MP-WEIXIN
						// 微信小程序：显式指定 central 模式，避免部分机型/基础库兼容问题
						;(wx as any).openBluetoothAdapter({ mode: 'central', success, fail })
						// #endif
						// #ifndef MP-WEIXIN
						uni.openBluetoothAdapter({ success, fail })
						// #endif
					},
				})

			const startDiscovery = async ({ withServiceFilter }: { withServiceFilter: boolean }) => {
				await callBleApiWithTimeout({
					label: 'startBluetoothDevicesDiscovery',
					timeoutMs: BLE_API_TIMEOUT_MS,
					invoke: ({ success, fail }) => {
						// #ifdef MP-WEIXIN
						;(wx as any).startBluetoothDevicesDiscovery({
							services: withServiceFilter ? [BMS_BLE_SERVICE_UUID] : undefined,
							allowDuplicatesKey: true,
							success,
							fail,
						})
						// #endif
						// #ifndef MP-WEIXIN
						uni.startBluetoothDevicesDiscovery({
							services: withServiceFilter ? [BMS_BLE_SERVICE_UUID] : undefined,
							allowDuplicatesKey: true,
							success,
							fail,
						})
						// #endif
					},
				})
				nativeDiscoveryStarted = true
				console.log('[ble-scan] discovery started', { sessionId, withServiceFilter, serviceUUID: BMS_BLE_SERVICE_UUID })
			}

			const startDiscoveryWithPermissionRecovery = async ({ withServiceFilter }: { withServiceFilter: boolean }) => {
				try {
					await startDiscovery({ withServiceFilter })
				} catch (e) {
					if (classifyBleScanError(e) !== 'location_or_permission') throw e
					// #ifdef MP-WEIXIN
					await new Promise((resolve, reject) => {
						;(wx as any).authorize({
							scope: 'scope.userLocation',
							success: resolve,
							fail: reject,
						})
					})
					if (!isScanSessionActive(sessionId)) return
					await startDiscovery({ withServiceFilter })
					// #endif
					// #ifndef MP-WEIXIN
					throw e
					// #endif
				}
			}

			const startDiscoveryWithRecovery = async ({ withServiceFilter }: { withServiceFilter: boolean }) => {
				try {
					await startDiscoveryWithPermissionRecovery({ withServiceFilter })
				} catch (e) {
					if (classifyBleScanError(e) !== 'scan_too_frequent') throw e
					console.warn('[ble-scan] discovery throttled, stop stale discovery and retry once', {
						sessionId,
						delayMs: BLE_SCAN_TOO_FREQUENT_RETRY_DELAY_MS,
					})
					await stopDiscovery({ settleMs: BLE_SCAN_TOO_FREQUENT_RETRY_DELAY_MS })
					nativeDiscoveryStarted = false
					if (!isScanSessionActive(sessionId)) return
					await startDiscoveryWithPermissionRecovery({ withServiceFilter })
				}
			}

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

			if (!isScanSessionActive(sessionId)) return
			await ensureBluetoothAdapterReady(sessionId)
			if (!isScanSessionActive(sessionId)) return

			bindDeviceFoundListener()
			await stopDiscovery({ settleMs: SCAN_STOP_SETTLE_MS })
			nativeDiscoveryStarted = false
			if (!isScanSessionActive(sessionId)) return

			debugLogFoundCount.value = 0
			debugLogFilteredCount.value = 0
			debugSeenDeviceIds.clear()
			clearFallbackTimer()
			await startDiscoveryWithRecovery({ withServiceFilter: true })
			if (!isScanSessionActive(sessionId)) return
			isScanning.value = true
			keepLeaseForActiveScan = true
			armScanTimeout(sessionId)

			// 部分设备首次扫描拿不到完整 serviceData，短时间内没有“可展示设备”时自动降级重启一次。
			fallbackTimer = setTimeout(() => {
				void runScanSerial(async () => {
					if (!isScanSessionActive(sessionId)) return
					if (hasResolvedAdvMacRows.value) return
					try {
						console.warn('[ble-scan] no adv mac resolved with service filter, fallback to discovery without services', {
							sessionId,
							rowCount: rows.value.size,
							visibleCount: visibleDevices.value.length,
						})
						await stopDiscovery({ settleMs: SCAN_STOP_SETTLE_MS })
						nativeDiscoveryStarted = false
						if (!isScanSessionActive(sessionId)) return
						await startDiscoveryWithRecovery({ withServiceFilter: false })
					} catch (e) {
						console.warn('[ble-scan] fallback discovery failed', e)
						if (!isScanSessionActive(sessionId)) return
						clearScanTimeoutTimer()
						offDeviceFoundListener()
						isScanning.value = false
						const errorKind = classifyBleScanError(e)
						const msg = errorKind === 'scan_too_frequent'
							? (t('pages.deviceProvision.scanTooFrequent') as string)
							: formatUniError(e)
						errorMsg.value = format(t('pages.deviceProvision.bleInitFailed') as string, { error: msg })
						if (scanLease?.id === lease?.id) scanLease = null
						lease?.release()
					}
				})
			}, 1500)
		} catch (e) {
			console.error('[ble-scan] startScan failed', e)
			if (scanSessionId !== sessionId) return
			clearScanTimeoutTimer()
			isScanning.value = false
			const errorKind = classifyBleScanError(e)
			const msg = errorKind === 'scan_too_frequent'
				? (t('pages.deviceProvision.scanTooFrequent') as string)
				: formatUniError(e)
			// NOTE: 某些平台/运行时在 script 内对 i18n 插值支持不稳定，这里用本地 format 做兜底
			errorMsg.value = format(t('pages.deviceProvision.bleInitFailed') as string, { error: msg })

			// 微信小程序：引导用户开启系统蓝牙
			// errCode 10001 常见于 “Bluetooth not enabled/available”
			if (errorKind === 'bluetooth_unavailable') {
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
			if (!keepLeaseForActiveScan && lease) {
				if (nativeDiscoveryStarted) {
					try {
						await stopDiscovery({ settleMs: SCAN_STOP_SETTLE_MS })
					} catch (stopError) {}
				}
				if (scanLease?.id === lease.id) scanLease = null
				lease.release()
			}
			if (scanSessionId === sessionId) {
				starting.value = false
			}
		}
	})
}

async function stopScan() {
	if (stopScanPromise) return stopScanPromise
	// 停止后数据不再变化；未触摸列表时立即应用最终顺序，否则丢弃跨 session 的迟到排序任务。
	if (!listSortScheduler.flushNow()) listSortScheduler.cancel()
	++scanSessionId
	clearFallbackTimer()
	clearScanTimeoutTimer()
	offDeviceFoundListener()
	starting.value = false
	isScanning.value = false
	const lease = scanLease
	stopScanPromise = runScanSerial(async () => {
		try {
			if (lease && scanLease?.id === lease.id) {
				await stopDiscovery({ settleMs: SCAN_STOP_SETTLE_MS })
			}
		} finally {
			if (lease && scanLease?.id === lease.id) scanLease = null
			lease?.release()
			starting.value = false
			isScanning.value = false
		}
	})
	try {
		await stopScanPromise
	} finally {
		stopScanPromise = null
	}
}

async function toggleScan() {
	if (starting.value) return
	// 用户已主动操作时，取消仍在等待绑定设备列表刷新的自动启动任务。
	autoStartPending = false
	if (isScanning.value) return stopScan()
	return startScan()
}

function selectDevice(d: DeviceRow) {
	stopScan().finally(() => {
		const boundDevice = getBoundDeviceByRow(d)
		if (boundDevice?.device_id && openBoundDeviceDetail(boundDevice.device_id)) {
			return
		}
		if (d.deviceType === DEVICE_TYPE_METER && d.advMac) {
			uni.navigateTo({
				url: `/pages/device-battery/detail?session_mode=instrument&ble_mac=${encodeURIComponent(d.advMac)}&ble_device_id=${encodeURIComponent(d.deviceId)}&allow_scan_handoff=1&device_name=${encodeURIComponent(d.displayName)}${detailEntrySourceQuery()}`,
			})
			return
		}
		uni.navigateTo({
			url: `/pages/device-provision/provision-wizard?deviceId=${encodeURIComponent(d.deviceId)}${
				targetMac.value ? `&qrMac=${targetMac.value}` : ''
			}${d.advMac ? `&advMac=${encodeURIComponent(d.advMac)}` : ''}${detailEntrySourceQuery()}`,
		})
	})
}

onLoad((option) => {
	blockedByLoginGuard = !ensureLoggedIn({ navigateMode: 'redirectTo' })
	if (blockedByLoginGuard) return
	const opt = option as Record<string, string | undefined>
	const m = opt.mode === 'qr' ? 'qr' : 'manual'
	mode.value = m
	entrySource.value = m === 'qr' ? 'scan' : 'ble_search'
	autoStartRequested = isBleScanAutoStartRequested(opt.auto_start)
	autoStartConsumed = false
	autoStartPending = false
	if (m === 'qr') {
		targetMac.value = normalizeMac(opt.mac || '') || null
	}
})

onShow(() => {
	if (blockedByLoginGuard) return
	pageVisible = true
	const scheduledVisibilityGeneration = ++visibilityGeneration
	const shouldAutoStart = shouldScheduleBleScanAutoStart({
		requested: autoStartRequested,
		consumed: autoStartConsumed,
		mode: mode.value,
		targetMac: targetMac.value,
	})
	// 标记在首次 onShow 即消费；即使刷新期间切后台，恢复后也不会再次自动搜索。
	if (shouldAutoStart) {
		autoStartConsumed = true
		autoStartPending = true
	}
	marginTopHeight.value = uni.getStorageSync('contentPaddingTop') || defaultMarginTop
	pageHeight.value = uni.getStorageSync('pageHeight') || defaultPageHeight
	;(async () => {
		// 确保“我的设备”列表已加载（用于过滤已绑定设备）
		try {
			await boundDevicesStore.refresh({ force: true })
		} catch (e) {}
		// 离开页面或可见代次变化后，旧刷新任务既不能启动扫描，也不能抢占导航。
		if (!pageVisible || blockedByLoginGuard || visibilityGeneration !== scheduledVisibilityGeneration) return

		// 扫码模式：若目标设备已绑定，则不再进入扫描页
		if (mode.value === 'qr' && targetMac.value && boundDevicesStore.hasBleMac(targetMac.value)) {
			autoStartPending = false
			const boundDevice = boundDevicesStore.findByBleMac(targetMac.value)
			if (boundDevice?.device_id) {
				uni.redirectTo({
					url: `/pages/device-battery/detail?device_id=${encodeURIComponent(boundDevice.device_id)}&entry_source=scan`,
				})
				return
			}
			try {
				uni.showToast({ title: t('pages.deviceProvision.deviceAlreadyAdded') as string, icon: 'none' })
			} catch (e) {}
			uni.switchTab({ url: '/pages/home/home' })
			return
		}

		if (
			shouldAutoStart &&
			autoStartPending &&
			canRunScheduledBleScanAutoStart({
				pageVisible,
				blockedByLoginGuard,
				starting: starting.value,
				isScanning: isScanning.value,
				visibilityGeneration,
				scheduledVisibilityGeneration,
			})
		) {
			autoStartPending = false
			void startScan()
		}

	})()
})

onHide(() => {
	pageVisible = false
	autoStartPending = false
	++visibilityGeneration
	listSortScheduler.cancel()
	// 页面离开（跳转/切后台）即停止扫描，避免占用系统资源
	void stopScan()
})

onUnload(() => {
	blockedByLoginGuard = false
	pageVisible = false
	autoStartPending = false
	++visibilityGeneration
	listSortScheduler.cancel()
	void stopScan()
})
</script>

<style scoped>
.page-shell {
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.wrap {
	padding: 24rpx;
	box-sizing: border-box;
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	overflow: hidden;
}

.top-panel {
	flex-shrink: 0;
	padding-bottom: 12rpx;
	margin-bottom: 12rpx;
	position: relative;
	z-index: 2;
}

.top-panel::after {
	content: '';
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 24rpx;
	pointer-events: none;
	background: linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, rgba(205, 214, 226, 0.32) 100%);
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

.list-panel {
	flex: 1;
	min-height: 0;
	overflow: hidden;
	background: #f5f5f5;
}

.list {
	height: 100%;
	box-sizing: border-box;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
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
	gap: 16rpx;
}

.item-title {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
}

.item-name {
	font-size: 30rpx;
	color: #111111;
	flex: 1;
	min-width: 0;
}

.item-badge {
	flex-shrink: 0;
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(36, 111, 221, 0.1);
	color: #246fdd;
	font-size: 20rpx;
	line-height: 1.4;
}

.item-signal {
	display: flex;
	align-items: flex-end;
	gap: 4rpx;
	height: 28rpx;
}

.item-signal__bar {
	width: 5rpx;
	border-radius: 999rpx;
	background: #d9dde6;
}

.item-signal__bar--1 {
	height: 10rpx;
}

.item-signal__bar--2 {
	height: 14rpx;
}

.item-signal__bar--3 {
	height: 19rpx;
}

.item-signal__bar--4 {
	height: 24rpx;
}

.item-signal--1 .item-signal__bar--1,
.item-signal--2 .item-signal__bar--1,
.item-signal--2 .item-signal__bar--2,
.item-signal--3 .item-signal__bar--1,
.item-signal--3 .item-signal__bar--2,
.item-signal--3 .item-signal__bar--3,
.item-signal--4 .item-signal__bar {
	background: #246fdd;
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
