<template>
	<view class="page">
		<image class="bg" :src="$img('bg@2x.png')" mode="aspectFill" />

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

		<view class="content" :style="{ paddingTop: navHeight + 'px', paddingBottom: contentBottomPadPx + 'px' }">
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

import { appBatteryDetail, appBatteryMqttCredential, type AppBatteryDetail } from '@/service/app-battery'
import { BmsClient, createUniBleBmsTransport, createUniMqttWsBmsTransport, type UniBleBmsTransport, type UniMqttWsBmsTransport } from '@/common/lib/bms-protocol'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'
import { getWindowInfo } from '@/common/platform'
import { parseMacFromAdvertisement } from '@/common/device-provision/ble'

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
const rpx2px = Number(getWindowInfo().windowWidth || getWindowInfo().screenWidth || 375) / 750
const contentBottomPadPx = Math.round(160 * rpx2px + safeBottom)

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
let mqttTransport: UniMqttWsBmsTransport | null = null
let pollErrLogged = 0

const log = (event: string, data?: Record<string, unknown>) => {
	try {
		const ts = new Date().toISOString().slice(11, 23)
		console.log(`[device-detail ${ts}] ${event}`, data || {})
	} catch (e) {}
}

const normalizeMac = (s: unknown) =>
	String(s || '')
		.trim()
		.toUpperCase()
		.replace(/[^0-9A-F]/g, '')

const extractMacHex = (s: unknown) => {
	const hex = normalizeMac(s)
	if (hex.length === 12) return hex
	// 兜底：从字符串中抽取连续 12 位 HEX（部分设备会把 MAC 拼进 name/localName）
	const raw = String(s || '').toUpperCase()
	const m = raw.match(/[0-9A-F]{12}/g)
	if (m && m.length) return m[m.length - 1]
	return ''
}

const mac12ToColon = (mac12: string) => {
	const hex = normalizeMac(mac12)
	if (hex.length !== 12) return String(mac12 || '')
	const parts: string[] = []
	for (let i = 0; i < 12; i += 2) parts.push(hex.slice(i, i + 2))
	return parts.join(':')
}

const bytesToHexUpper = (ab: ArrayBuffer | Uint8Array | null | undefined): string => {
	if (!ab) return ''
	const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab)
	let out = ''
	for (let i = 0; i < u8.length; i += 1) out += (u8[i] & 0xff).toString(16).padStart(2, '0')
	return out.toUpperCase()
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
			pollErrLogged = 0
		} catch (e) {
			// ignore polling error; connection may recover
			if (pollErrLogged < 3) {
				pollErrLogged += 1
				log('poll failed', { err: e instanceof Error ? e.message : String(e || '') })
			}
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
	log('disconnectAll done')
}

type FoundBleDevice = {
	deviceId: string
	name?: string
	localName?: string
	RSSI?: number
	advertisData?: ArrayBuffer
	advertisingData?: ArrayBuffer
}

const discoverWithAdv = async ({ durationMs }: { durationMs: number }): Promise<FoundBleDevice[]> => {
	const found = new Map<string, FoundBleDevice>()

	const onFound = (res: { devices?: FoundBleDevice[] }) => {
		const list = (res && res.devices) || []
		for (const d of list) {
			if (!d?.deviceId) continue
			found.set(String(d.deviceId), d)
		}
	}

	const offFn = (uni as any).offBluetoothDeviceFound
	if (typeof offFn === 'function') offFn(onFound)
	uni.onBluetoothDeviceFound(onFound as any)

	try {
		await new Promise((resolve, reject) => {
			uni.startBluetoothDevicesDiscovery({
				allowDuplicatesKey: true,
				success: resolve,
				fail: reject,
			})
		})
		await new Promise((r) => setTimeout(r, durationMs))
	} finally {
		try {
			await new Promise((resolve) => uni.stopBluetoothDevicesDiscovery({ complete: resolve }))
		} catch (e) {}
	}
	return Array.from(found.values())
}

const connectBleFirst = async (): Promise<boolean> => {
	const targetMac = normalizeMac(battery.value?.ble_mac)
	if (!targetMac) return false

	try {
		const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : ({} as any)
		const platform = String((sys as any)?.platform || '').toLowerCase()
		const isAndroid = platform === 'android'
		log('ble target', { targetMac, targetMacColon: mac12ToColon(targetMac), platform })

		log('ble discover start', { targetMac })
		bleTransport = createUniBleBmsTransport({})

		// Android：部分机型允许直接用 MAC 作为 deviceId 连接（无需依赖扫描回传的 advertisData）
		// NOTE: 仍建议先 openBluetoothAdapter（transport.init 内会处理）
		if (isAndroid) {
			const directCandidates = [
				mac12ToColon(targetMac),
				mac12ToColon(targetMac).toLowerCase(),
				targetMac,
				targetMac.toLowerCase(),
			].filter(Boolean)
			for (const cand of directCandidates) {
				try {
					log('ble direct connect try', { deviceId: cand })
					await bleTransport.connect({ deviceId: cand })
					const c = new BmsClient({ transport: bleTransport })
					client.value = c
					connType.value = 'bluetooth'
					startPolling(c)
					log('ble direct connect ok', { deviceId: cand })
					return true
				} catch (e) {
					log('ble direct connect failed', { deviceId: cand, err: e instanceof Error ? e.message : String(e || '') })
					try {
						await bleTransport.disconnect()
					} catch (e2) {}
				}
			}
		}

		// 通用：扫描并打印广播厂家信息 + 解析到的 MAC（用于排查“找不到设备”）
		const list = await discoverWithAdv({ durationMs: 5000 })
		log('ble discover done', { found: Array.isArray(list) ? list.length : 0 })
		if (Array.isArray(list) && list.length) {
			const sample = list.slice(0, 30)
			for (const d of sample) {
				const adv = (d as any).advertisData || (d as any).advertisingData || null
				const advHex = bytesToHexUpper(adv)
				const parsedMac = parseMacFromAdvertisement(adv) || ''
				const idHex = extractMacHex(d?.deviceId)
				const nameHex = extractMacHex(d?.name || d?.localName)
				log('ble device', {
					deviceId: d.deviceId,
					name: d.name || d.localName || '',
					rssi: d.RSSI ?? null,
					advHexHead: advHex ? advHex.slice(0, 64) : '',
					advHexLen: advHex ? advHex.length / 2 : 0,
					parsedMac,
					idHex,
					nameHex,
					match: parsedMac === targetMac || idHex === targetMac || nameHex === targetMac,
				})
			}
			if (list.length > sample.length) {
				log('ble device list truncated', { shown: sample.length, total: list.length })
			}
		}

		const candidates = (list || [])
			.map((d: any) => {
				const adv = (d as any).advertisData || (d as any).advertisingData || null
				const advMac = parseMacFromAdvertisement(adv)
				const idHex = extractMacHex(d?.deviceId)
				const nameHex = extractMacHex(d?.name || d?.localName)
				const ok =
					(advMac && advMac === targetMac) ||
					(idHex && idHex === targetMac) ||
					(nameHex && nameHex === targetMac) ||
					(String(d?.name || d?.localName || '').toUpperCase().includes(targetMac))
				return { d, ok, rssi: Number(d?.RSSI ?? -9999), advMac }
			})
			.filter((x) => x.ok)
			.sort((a, b) => b.rssi - a.rssi)
		const hit = candidates[0]?.d
		if (!hit?.deviceId) return false

		log('ble connect start', { deviceId: hit.deviceId })
		await bleTransport.connect({ deviceId: hit.deviceId })
		const c = new BmsClient({ transport: bleTransport })
		client.value = c
		connType.value = 'bluetooth'
		startPolling(c)
		log('ble connect ok', { deviceId: hit.deviceId })
		return true
	} catch (e) {
		log('ble connect failed', { err: e instanceof Error ? e.message : String(e || '') })
		try {
			await bleTransport?.disconnect()
		} catch (e2) {}
		bleTransport = null
		return false
	}
}

const connectMqttSocket = async (): Promise<boolean> => {
	try {
		const rsp = await appBatteryMqttCredential(deviceId.value)
		if (!rsp || (rsp as any).code !== 200) throw new Error('mqtt credential fetch failed')
		const cred = (rsp as any).data || {}
		const wsUrl = String(cred.ws_url || '').trim()
		const username = String(cred.username || '').trim()
		const password = cred.password == null ? '' : String(cred.password)
		const writeTopic = String(cred.write_topic || '').trim()
		const readTopic = String(cred.read_topic || '').trim()
		if (!wsUrl || !username || !writeTopic || !readTopic) throw new Error('mqtt credential invalid')
		const clientId = `app_${String(deviceId.value).slice(0, 8)}_${Date.now()}`
		log('mqtt(ws) connect start', { wsUrl, deviceId: deviceId.value })
		mqttTransport = createUniMqttWsBmsTransport({
			wsUrl,
			clientId,
			username,
			password,
			writeTopic,
			readTopic,
			logger: console as any,
		})
		await mqttTransport.connect()
		const c = new BmsClient({ transport: mqttTransport })
		// 仅 WebSocket 连接成功不代表设备能透传成功；这里做一次短探测再切换图标。
		try {
			await c.readUuid()
		} catch (e) {
			throw e
		}

		client.value = c
		connType.value = 'mqtt'
		startPolling(c)
		log('mqtt(ws) connect ok', { wsUrl })
		return true
	} catch (e) {
		log('mqtt(ws) connect failed', { err: e instanceof Error ? e.message : String(e || '') })
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
		const commType = Number(battery.value?.bms_comm_type || 0)
		const chipId = String(battery.value?.comm_chip_id || '').trim()
		const hasBleMac = Boolean(normalizeMac(battery.value?.ble_mac))
		const treatBleOnly = commType === 1 || ((commType === 0 || !Number.isFinite(commType)) && hasBleMac && !chipId)
		log('connectAuto', {
			deviceId: deviceId.value,
			bms_comm_type: battery.value?.bms_comm_type ?? null,
			ble_mac: battery.value?.ble_mac ?? null,
			comm_chip_id: battery.value?.comm_chip_id ?? null,
		})
		// 1 = 仅蓝牙（无 4G / MQTT 透传），只尝试 BLE
		// TODO: bms_comm_type 为空时的兜底策略：若有 ble_mac 且无 comm_chip_id，则按“仅蓝牙”处理
		if (treatBleOnly) {
			log('connectAuto choose BLE-only')
			if (await connectBleFirst()) return
			connType.value = 'offline'
			return
		}
		if (await connectBleFirst()) return
		log('connectAuto BLE not available, try MQTT socket')
		if (await connectMqttSocket()) return
		connType.value = 'offline'
	} finally {
		connecting.value = false
	}
}

const load = async () => {
	if (!deviceId.value) return
	log('load battery detail start', { deviceId: deviceId.value })
	const rsp = await appBatteryDetail(deviceId.value)
	if (rsp && (rsp as any).code === 200) {
		battery.value = (rsp as any).data as AppBatteryDetail
		log('load battery detail ok', {
			device_number: (battery.value as any)?.device_number,
			bms_comm_type: (battery.value as any)?.bms_comm_type,
			ble_mac: (battery.value as any)?.ble_mac,
			comm_chip_id: (battery.value as any)?.comm_chip_id,
			is_online: (battery.value as any)?.is_online,
		})
		connectAuto()
	} else {
		log('load battery detail failed', { rsp })
	}
}

onLoad((query) => {
	deviceId.value = String((query as any)?.device_id || (query as any)?.id || '').trim()
	log('onLoad', { deviceId: deviceId.value })
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
