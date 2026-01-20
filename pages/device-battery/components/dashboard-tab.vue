<template>
	<view class="wrap">
		<view class="top">
			<view class="top__inner">
				<dashboard-gauge
					class="gauge"
					:soc="socPct"
					:soh="sohPct"
					:footer-state-text="stateText"
					:footer-mac-text="macText"
				>
					<template #footer>
						<view class="gauge-footer">
							<text class="state-pill">{{ stateText }}</text>
							<text class="mac">{{ macText }}</text>
						</view>
					</template>
				</dashboard-gauge>
			</view>
		</view>

		<view class="remain">
			<text class="remain__label">{{ remainLabel }}</text>
			<text class="remain__value">{{ remainValue }}</text>
		</view>

		<view v-if="hasFlags" class="flags">
			<view v-if="faultCount > 0" class="flag flag--danger" hover-class="flag--hover" @tap="openFlag('fault')">
				<image class="flag__icon" src="/static/image/device/icon-danger@2x.png" mode="aspectFit" />
				<text class="flag__text">{{ $t('deviceDetail.flags.fault') }}</text>
			</view>
			<view v-if="alarmCount > 0" class="flag flag--warn" hover-class="flag--hover" @tap="openFlag('alarm')">
				<image class="flag__icon" src="/static/image/device/icon-warn@2x.png" mode="aspectFit" />
				<text class="flag__text">{{ $t('deviceDetail.flags.alarm') }}</text>
			</view>
			<view v-if="protectCount > 0" class="flag flag--guard" hover-class="flag--hover" @tap="openFlag('protect')">
				<image class="flag__icon" src="/static/image/device/icon-guard@2x.png" mode="aspectFit" />
				<text class="flag__text">{{ $t('deviceDetail.flags.protect') }}</text>
			</view>
		</view>

		<view class="cards">
			<view class="card">
				<view class="card__head">
					<image class="card__icon" src="/static/image/device/icon-loop@2x.png" mode="aspectFit" />
					<text class="card__label">{{ $t('deviceDetail.dashboard.cycleCount') }}</text>
				</view>
				<text class="card__value">{{ cycleCountText }}</text>
			</view>
			<view class="card">
				<view class="card__head">
					<image class="card__icon" src="/static/image/device/icon-charge-time@2x.png" mode="aspectFit" />
					<text class="card__label">{{ $t('deviceDetail.dashboard.chargeTime') }}</text>
				</view>
				<text class="card__value">{{ chargeTimeText }}</text>
			</view>
		</view>

		<view class="switch-grid">
			<view class="switch-item">
				<text class="switch-item__label">{{ $t('deviceDetail.dashboard.chargeSwitch') }}</text>
				<u-switch :modelValue="chargeOn" disabled :activeColor="'#0B3BFF'" :inactiveColor="'#E6E7EB'" :size="22"></u-switch>
			</view>
			<view class="switch-item">
				<text class="switch-item__label">{{ $t('deviceDetail.dashboard.dischargeSwitch') }}</text>
				<u-switch :modelValue="dischargeOn" disabled :activeColor="'#0B3BFF'" :inactiveColor="'#E6E7EB'" :size="22"></u-switch>
			</view>
			<view class="switch-item">
				<text class="switch-item__label">{{ $t('deviceDetail.dashboard.balanceState') }}</text>
				<u-switch :modelValue="balancingOn" disabled :activeColor="'#0B3BFF'" :inactiveColor="'#E6E7EB'" :size="22"></u-switch>
			</view>
			<view class="switch-item">
				<text class="switch-item__label">{{ $t('deviceDetail.dashboard.protectState') }}</text>
				<u-switch :modelValue="protectOn" disabled :activeColor="'#0B3BFF'" :inactiveColor="'#E6E7EB'" :size="22"></u-switch>
			</view>
		</view>

		<view class="metrics">
			<view class="metric">
				<text class="metric__label">{{ $t('deviceDetail.dashboard.avgVoltage') }}</text>
				<text class="metric__value">{{ avgVText }}</text>
			</view>
			<view class="metric">
				<text class="metric__label">{{ $t('deviceDetail.dashboard.maxVoltage') }}</text>
				<text class="metric__value">{{ maxVText }}</text>
			</view>
			<view class="metric">
				<text class="metric__label">{{ $t('deviceDetail.dashboard.minVoltage') }}</text>
				<text class="metric__value">{{ minVText }}</text>
			</view>
			<view class="metric">
				<text class="metric__label">{{ $t('deviceDetail.dashboard.voltageDiff') }}</text>
				<text class="metric__value">{{ diffVText }}</text>
			</view>
		</view>

		<view class="temp-card">
			<view class="temp-row">
				<text class="temp-row__name">MOS</text>
				<text class="temp-row__value">{{ mosText }}</text>
			</view>
			<view class="divider"></view>
			<view class="temp-row">
				<text class="temp-row__name">T1</text>
				<text class="temp-row__value">{{ t1Text }}</text>
			</view>
			<view class="divider"></view>
			<view class="temp-row">
				<text class="temp-row__name">T2</text>
				<text class="temp-row__value">{{ t2Text }}</text>
			</view>
		</view>

		<u-popup :show="flagPopup.show" mode="center" @close="closeFlagPopup">
			<view class="flag-popup">
				<text class="flag-popup__title">{{ flagPopup.title }}</text>
				<view class="flag-popup__list">
					<view v-for="(item, idx) in flagPopup.items" :key="`${flagPopup.title}-${idx}`" class="flag-popup__item">
						<text class="flag-popup__idx">{{ idx + 1 }}.</text>
						<text class="flag-popup__text">{{ item }}</text>
					</view>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import DashboardGauge from '@/components/dashboard-gauge/dashboard-gauge.vue'
import type { AppBatteryDetail } from '@/service/app-battery'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'

const props = defineProps<{
	battery: AppBatteryDetail | null
	status: BmsStatus | null
	connType: 'bluetooth' | 'mqtt' | 'offline'
}>()

const { t, te } = useI18n()

const formatWithParams = (key: string, params: Record<string, unknown>) => {
	const tpl = t(key, params) as string
	// 兼容：部分构建环境 message compiler 被 drop 时，t() 不会替换 `{n}` 这种占位符
	return tpl.replace(/\{(\w+)\}/g, (m, k) => {
		if (!Object.prototype.hasOwnProperty.call(params, k)) return m
		return String((params as any)[k])
	})
}

const isInvalidU16 = (v: unknown) => {
	const n = typeof v === 'number' ? v : Number(v)
	return !Number.isFinite(n) || n >= 0xffff
}

const formatMac = (raw: unknown) => {
	const s = String(raw || '')
	const hex = s.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
	if (hex.length === 12) {
		const parts: string[] = []
		for (let i = 0; i < 12; i += 2) parts.push(hex.slice(i, i + 2))
		return parts.join(':')
	}
	return s || '-'
}

const socPct = computed(() => {
	const v = props.status?.energy?.socPct
	if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.min(100, Math.round(v)))
	const b = props.battery?.soc
	if (typeof b === 'number' && Number.isFinite(b)) return Math.max(0, Math.min(100, Math.round(b)))
	return 0
})

const sohPct = computed(() => {
	const v = props.status?.energy?.sohPct
	if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.min(100, Math.round(v)))
	const b = props.battery?.soh
	if (typeof b === 'number' && Number.isFinite(b)) return Math.max(0, Math.min(100, Math.round(b)))
	return 0
})

const indicator = computed(() => props.status?.status?.indicatorStatus || {})
const alarm = computed(() => props.status?.status?.alarmStatus || {})
const protect = computed(() => props.status?.status?.protectionStatus || {})

const stateText = computed(() => {
	if ((indicator.value as any).charging) return t('deviceDetail.state.charging') as string
	if ((indicator.value as any).discharging) return t('deviceDetail.state.discharging') as string
	return t('deviceDetail.state.idle') as string
})

const macText = computed(() => {
	if (props.connType === 'bluetooth') return formatMac(props.battery?.ble_mac || props.status?.identity?.bluetoothMac || '-')
	return formatMac(props.status?.identity?.bluetoothMac || props.battery?.ble_mac || '-')
})

const remainLabel = computed(() => {
	if ((indicator.value as any).charging) return t('deviceDetail.remain.charge') as string
	if ((indicator.value as any).discharging) return t('deviceDetail.remain.discharge') as string
	return t('deviceDetail.remain.unknown') as string
})

const remainValue = computed(() => {
	if ((indicator.value as any).charging) {
		const v = props.status?.timing?.chargeRemainingMin
		if (isInvalidU16(v)) return '-'
		return formatWithParams('deviceDetail.unit.minutes', { n: Number(v || 0) })
	}
	if ((indicator.value as any).discharging) {
		const v = props.status?.timing?.dischargeRemainingMin
		if (isInvalidU16(v)) return '-'
		return formatWithParams('deviceDetail.unit.minutes', { n: Number(v || 0) })
	}
	return '-'
})

const faultCount = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => k.toLowerCase().includes('fault') && obj[k]).length
})

const alarmCount = computed(() => {
	const obj = alarm.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => obj[k]).length
})

const protectCount = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => !k.toLowerCase().includes('fault') && obj[k]).length
})

const hasFlags = computed(() => faultCount.value > 0 || alarmCount.value > 0 || protectCount.value > 0)

const labelForStatus = (key: string) => {
	const i18nKey = `deviceDetail.statusMap.${key}`
	if (te(i18nKey)) return t(i18nKey) as string
	return key
}

const faultItems = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj)
		.filter((k) => k.toLowerCase().includes('fault') && obj[k])
		.map(labelForStatus)
})

const alarmItems = computed(() => {
	const obj = alarm.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => obj[k]).map(labelForStatus)
})

const protectItems = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj)
		.filter((k) => !k.toLowerCase().includes('fault') && obj[k])
		.map(labelForStatus)
})

const flagPopup = reactive({
	show: false,
	title: '',
	items: [] as string[],
})

const openFlag = (type: 'fault' | 'alarm' | 'protect') => {
	if (type === 'fault') {
		if (!faultItems.value.length) return
		flagPopup.title = t('deviceDetail.flags.fault') as string
		flagPopup.items = faultItems.value
	}
	if (type === 'alarm') {
		if (!alarmItems.value.length) return
		flagPopup.title = t('deviceDetail.flags.alarm') as string
		flagPopup.items = alarmItems.value
	}
	if (type === 'protect') {
		if (!protectItems.value.length) return
		flagPopup.title = t('deviceDetail.flags.protect') as string
		flagPopup.items = protectItems.value
	}
	flagPopup.show = true
}

const closeFlagPopup = () => {
	flagPopup.show = false
}

const cycleCountText = computed(() => {
	const v = props.status?.energy?.cycleCount
	if (isInvalidU16(v)) return '-'
	return formatWithParams('deviceDetail.unit.times', { n: Number(v || 0) })
})
const chargeTimeText = computed(() => {
	const v = props.status?.timing?.chargeRemainingMin
	if (isInvalidU16(v)) return '-'
	return formatWithParams('deviceDetail.unit.perMinute', { n: Number(v || 0) })
})

const chargeOn = computed(() => Boolean((indicator.value as any).chargeFetOn))
const dischargeOn = computed(() => Boolean((indicator.value as any).dischargeFetOn))
const balancingOn = computed(() => Boolean((props.status?.cell?.balancing || []).some((x) => x)))
const protectOn = computed(() => Boolean(Object.values(protect.value as Record<string, boolean>).some((x) => x)))

const toV = (mv: unknown) => {
	const n = typeof mv === 'number' ? mv : Number(mv)
	if (!Number.isFinite(n) || n >= 0xffff) return '-'
	return `${(n / 1000).toFixed(2)}V`
}

const avgVText = computed(() => toV(props.status?.electrical?.avgCellVoltageMv))
const maxVText = computed(() => toV(props.status?.electrical?.highestCellVoltageMv))
const minVText = computed(() => toV(props.status?.electrical?.lowestCellVoltageMv))
const diffVText = computed(() => `${Number(props.status?.electrical?.maxCellVoltageDiffMv || 0).toFixed(0)}mV`)

const cToFText = (c: number | null | undefined) => {
	if (typeof c !== 'number' || !Number.isFinite(c)) return '-'
	const f = c * (9 / 5) + 32
	return `${c.toFixed(0)}℃/${f.toFixed(0)}°F`
}

const mosText = computed(() => cToFText(props.status?.temperature?.chargeMosC))
const t1Text = computed(() => cToFText(props.status?.temperature?.dischargeMosC))
const t2Text = computed(() => {
	const cellTemps = props.status?.temperature?.cellTempsC || []
	const v =
		cellTemps.length > 0
			? cellTemps[0]
			: props.status?.temperature?.highestTemp?.valueC ?? props.status?.temperature?.poleC ?? null
	return cToFText(v)
})
</script>

<style lang="scss" scoped>
.wrap {
	padding: 24rpx;
	box-sizing: border-box;
}

.top {
	position: relative;
	height: 400rpx;
	border-radius: 40rpx;
	overflow: hidden;
}

.top-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 100%;
}

.top__inner {
	position: relative;
	z-index: 1;
	height: 100%;
	padding: 24rpx;
	box-sizing: border-box;
	display: flex;
	align-items: center;
}

.gauge {
	width: 100%;
}

.gauge-footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14rpx;
}

.state-pill {
	font-size: 24rpx;
	color: #f6a545;
	padding: 8rpx 28rpx;
	background: #fff3e6;
	border-radius: 999px;
	font-weight: 500;
}

.mac {
	font-size: 24rpx;
	color: #4b5563;
	font-family: 'Avenir Next', Helvetica, Arial, sans-serif;
}

.remain {
	margin-top: 8rpx;
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 0 18rpx;
	color: #9aa0a6;
}

.remain__label,
.remain__value {
	font-size: 22rpx;
}

.flags {
	margin-top: 18rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 18rpx;
}

.flag {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	color: #a0a0a0;
}

.flag--hover {
	opacity: 0.85;
}

.flag__icon {
	width: 26rpx;
	height: 26rpx;
}

.flag__text {
	font-size: 24rpx;
}

.flag--danger {
	color: #ff4d4f;
}

.flag--warn {
	color: #faad14;
}

.flag--guard {
	color: #f6a545;
}

.cards {
	margin-top: 22rpx;
	display: flex;
	gap: 18rpx;
}

.card {
	flex: 1;
	background: #ffffff;
	border-radius: 22rpx;
	padding: 18rpx 20rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
}

.card__head {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.card__icon {
	width: 42rpx;
	height: 42rpx;
}

.card__label {
	font-size: 24rpx;
	color: #9aa0a6;
}

.card__value {
	display: block;
	margin-top: 10rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #333333;
}

.switch-grid {
	margin-top: 18rpx;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18rpx;
}

.switch-item {
	background: #ffffff;
	border-radius: 22rpx;
	padding: 18rpx 20rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
}

.switch-item__label {
	font-size: 26rpx;
	color: #333333;
}

.metrics {
	margin-top: 18rpx;
	background: #ffffff;
	border-radius: 22rpx;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	padding: 18rpx 0;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
}

.metric {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.metric__label {
	font-size: 22rpx;
	color: #9aa0a6;
}

.metric__value {
	font-size: 26rpx;
	font-weight: 600;
	color: #333333;
}

.temp-card {
	margin-top: 18rpx;
	background: #ffffff;
	border-radius: 22rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
	overflow: hidden;
}

.temp-row {
	padding: 22rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.temp-row__name {
	font-size: 26rpx;
	color: #333333;
}

.temp-row__value {
	font-size: 26rpx;
	color: #333333;
}

.divider {
	height: 1px;
	background: #f2f3f5;
}

.flag-popup {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 24rpx 28rpx;
	min-width: 420rpx;
	max-width: 560rpx;
	box-sizing: border-box;
}

.flag-popup__title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333333;
	text-align: center;
}

.flag-popup__list {
	margin-top: 18rpx;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	max-height: 60vh;
	overflow: auto;
}

.flag-popup__item {
	display: flex;
	align-items: flex-start;
	gap: 10rpx;
}

.flag-popup__idx {
	font-size: 24rpx;
	color: #9aa0a6;
}

.flag-popup__text {
	font-size: 24rpx;
	color: #333333;
	flex: 1;
	word-break: break-all;
}
</style>
