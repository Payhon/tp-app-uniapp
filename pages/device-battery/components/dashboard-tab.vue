<template>
	<view class="wrap">
		<view class="top">
			<view class="top__inner">
				<dashboard-gauge
					class="gauge"
					:soc="socPct"
					:soh="sohPct"
					:total-voltage-text="totalVoltageText"
					:total-voltage-label="$t('deviceDetail.dashboard.totalVoltage')"
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
					<text class="card__label">{{ chargeDischargeTimeLabel }}</text>
				</view>
				<text class="card__value">{{ chargeDischargeTimeText }}</text>
			</view>
			<view class="card">
				<view class="card__head">
					<image class="card__icon" src="/static/image/device/icon-currency@2x.png" mode="aspectFit" />
					<text class="card__label">{{ $t('deviceDetail.dashboard.current') }}</text>
				</view>
				<text class="card__value">{{ currentText }}</text>
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
			<view class="temp-grid">
				<view v-for="item in temperatureRows" :key="item.key" class="temp-row">
					<text class="temp-row__name">{{ item.label }}</text>
					<text class="temp-row__value">{{ item.value }}</text>
				</view>
			</view>
		</view>

		<view class="protect-card">
			<view class="protect-card__head" @tap="toggleProtectCard">
				<text class="protect-card__title">{{ $t('deviceDetail.dashboard.protectDetail') }}</text>
				<view class="protect-card__meta">
					<text class="protect-card__desc">{{ protectSummaryText }}</text>
					<text class="protect-card__toggle">{{ protectExpanded ? $t('deviceDetail.dashboard.protectCollapse') : $t('deviceDetail.dashboard.protectExpand') }}</text>
				</view>
			</view>
			<view v-if="protectExpanded" class="protect-list">
				<view v-for="item in protectStatusList" :key="item.key" class="protect-row">
					<text class="protect-row__label">{{ item.label }}</text>
					<text class="protect-row__value" :class="{ 'protect-row__value--on': item.enabled }">
						{{ item.enabled ? $t('deviceDetail.dashboard.protectStatusOn') : $t('deviceDetail.dashboard.protectStatusOff') }}
					</text>
				</view>
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
import { computed, reactive, ref } from 'vue'
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
const failure = computed(() => props.status?.status?.failureStatus || {})

const stateText = computed(() => {
	if ((indicator.value as any).charging) return t('deviceDetail.state.charging') as string
	if ((indicator.value as any).discharging) return t('deviceDetail.state.discharging') as string
	return t('deviceDetail.state.idle') as string
})

const macText = computed(() => {
	if (props.connType === 'bluetooth') return formatMac(props.battery?.ble_mac || props.status?.identity?.bluetoothMac || '-')
	return formatMac(props.status?.identity?.bluetoothMac || props.battery?.ble_mac || '-')
})

const chargeDischargeTimeLabel = computed(() => {
	if ((indicator.value as any).charging) return t('deviceDetail.dashboard.chargeRemainingTime') as string
	if ((indicator.value as any).discharging) return t('deviceDetail.dashboard.dischargeRemainingTime') as string
	return t('deviceDetail.dashboard.chargeDischargeRemainingTime') as string
})

const faultCount = computed(() => {
	return faultItems.value.length
})

const alarmCount = computed(() => {
	const obj = alarm.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => obj[k]).length
})

const protectCount = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => obj[k]).length
})

const hasFlags = computed(() => faultCount.value > 0 || alarmCount.value > 0 || protectCount.value > 0)

const labelForStatus = (key: string) => {
	const i18nKey = `deviceDetail.statusMap.${key}`
	if (te(i18nKey)) return t(i18nKey) as string
	return key
}

const faultItems = computed(() => {
	const failureObj = failure.value as Record<string, boolean>
	return Object.keys(failureObj).filter((k) => failureObj[k]).map(labelForStatus)
})

const alarmItems = computed(() => {
	const obj = alarm.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => obj[k]).map(labelForStatus)
})

const protectItems = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj)
		.filter((k) => obj[k])
		.map(labelForStatus)
})

const flagPopup = reactive({
	show: false,
	title: '',
	items: [] as string[],
})

const protectExpanded = ref(false)

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

const chargeDischargeTimeText = computed(() => {
	if ((indicator.value as any).charging) {
		const v = props.status?.timing?.chargeRemainingMin
		if (isInvalidU16(v)) return '-'
		return formatWithParams('deviceDetail.unit.minutes', { n: Number(v || 0) })
	}
	if ((indicator.value as any).discharging) {
		const v = props.status?.timing?.dischargeRemainingMin
		if (isInvalidU16(v)) return '-'
		return formatWithParams('deviceDetail.unit.minutes', { n: -Number(v || 0) })
	}
	return '-'
})

const totalVoltageText = computed(() => {
	const v = props.status?.electrical?.packCellSumVoltageV
	if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
	if (v >= 1000 || v >= 0xffff) return '-'
	return `${v.toFixed(1)}V`
})

const formatSignedCurrent = (value: unknown) => {
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n)) return '-'
	const normalized = Math.abs(n) < 0.005 ? 0 : n
	const sign = normalized > 0 ? '+' : ''
	const text = normalized.toFixed(2).replace(/\.?0+$/, '')
	return `${sign}${text}A`
}

const currentText = computed(() => formatSignedCurrent(props.status?.electrical?.currentA))

const chargeOn = computed(() => Boolean((indicator.value as any).chargeFetOn))
const dischargeOn = computed(() => Boolean((indicator.value as any).dischargeFetOn))
const balancingOn = computed(() => Boolean((props.status?.cell?.balancing || []).some((x) => x)))
const protectStatusItems = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj).filter((k) => obj[k]).map(labelForStatus)
})

const protectStatusList = computed(() => {
	const obj = protect.value as Record<string, boolean>
	return Object.keys(obj).map((key) => ({
		key,
		label: labelForStatus(key),
		enabled: Boolean(obj[key]),
	}))
})

const protectSummaryText = computed(() => {
	if (!protectStatusItems.value.length) return t('common.none') as string
	return formatWithParams('deviceDetail.dashboard.protectCount', { n: protectStatusItems.value.length })
})

const toggleProtectCard = () => {
	protectExpanded.value = !protectExpanded.value
}

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
const t1Text = computed(() => cToFText(props.status?.temperature?.ambientC))
const temperatureRows = computed(() => {
	const rows = [
		{
			key: 'mos',
			label: t('deviceDetail.dashboard.mosTemp') as string,
			value: mosText.value,
		},
		{
			key: 'ambient',
			label: t('deviceDetail.dashboard.ambientTemp') as string,
			value: t1Text.value,
		},
	]
	const cellTemps = props.status?.temperature?.cellTempsC || []
	cellTemps.forEach((temp, index) => {
		rows.push({
			key: `cell-${index + 1}`,
			label: formatWithParams('deviceDetail.dashboard.tempIndexed', { n: index + 1 }),
			value: cToFText(temp),
		})
	})
	return rows
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

.flags {
	margin-top: 26rpx;
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
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 18rpx;
}

.card {
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
	padding: 24rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
}

.temp-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 18rpx;
}

.temp-row {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	padding: 18rpx 20rpx;
	border-radius: 18rpx;
	background: #f7f8fa;
	text-align: center;
}

.temp-row__name {
	font-size: 22rpx;
	color: #9aa0a6;
}

.temp-row__value {
	font-size: 30rpx;
	font-weight: 600;
	color: #333333;
	text-align: center;
}

.protect-card {
	margin-top: 18rpx;
	background: #ffffff;
	border-radius: 22rpx;
	padding: 22rpx 24rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
}

.protect-card__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.protect-card__meta {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.protect-card__title {
	font-size: 26rpx;
	font-weight: 600;
	color: #333333;
}

.protect-card__desc {
	font-size: 22rpx;
	color: #9aa0a6;
}

.protect-card__toggle {
	font-size: 22rpx;
	color: #0b3bff;
}

.protect-list {
	margin-top: 18rpx;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.protect-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	padding: 18rpx 20rpx;
	border-radius: 18rpx;
	background: #f7f8fa;
}

.protect-row__label {
	font-size: 24rpx;
	color: #333333;
	flex: 1;
}

.protect-row__value {
	font-size: 24rpx;
	color: #9aa0a6;
}

.protect-row__value--on {
	color: #d97706;
	font-weight: 600;
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
