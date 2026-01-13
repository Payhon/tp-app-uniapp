<template>
	<view class="wrap">
		<view class="top">
			<image class="top-bg" src="/static/image/device/device-top@2x.png" mode="aspectFill" />
			<view class="top__inner">
				<dashboard-gauge class="gauge" :soc="socPct" :soh="sohPct">
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

		<view class="flags">
			<view class="flag" :class="{ 'flag--danger': faultCount > 0 }">
				<image class="flag__icon" src="/static/image/device/icon-danger@2x.png" mode="aspectFit" />
				<text class="flag__text">{{ $t('deviceDetail.flags.fault') }}</text>
			</view>
			<view class="flag" :class="{ 'flag--warn': alarmCount > 0 }">
				<image class="flag__icon" src="/static/image/device/icon-warn@2x.png" mode="aspectFit" />
				<text class="flag__text">{{ $t('deviceDetail.flags.alarm') }}</text>
			</view>
			<view class="flag" :class="{ 'flag--guard': protectCount > 0 }">
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
	</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DashboardGauge from '@/components/dashboard-gauge/dashboard-gauge.vue'
import type { AppBatteryDetail } from '@/service/app-battery'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'

const props = defineProps<{
	battery: AppBatteryDetail | null
	status: BmsStatus | null
	connType: 'bluetooth' | 'mqtt' | 'offline'
}>()

const { t } = useI18n()

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

const macText = computed(() => String(props.status?.identity?.bluetoothMac || props.battery?.ble_mac || '-'))

const remainLabel = computed(() => {
	if ((indicator.value as any).charging) return t('deviceDetail.remain.charge') as string
	if ((indicator.value as any).discharging) return t('deviceDetail.remain.discharge') as string
	return t('deviceDetail.remain.unknown') as string
})

const remainValue = computed(() => {
	if ((indicator.value as any).charging) return t('deviceDetail.unit.minutes', { n: Number(props.status?.timing?.chargeRemainingMin || 0) }) as string
	if ((indicator.value as any).discharging) return t('deviceDetail.unit.minutes', { n: Number(props.status?.timing?.dischargeRemainingMin || 0) }) as string
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

const cycleCountText = computed(() => t('deviceDetail.unit.times', { n: Number(props.status?.energy?.cycleCount || 0) }) as string)
const chargeTimeText = computed(() => t('deviceDetail.unit.perMinute', { n: Number(props.status?.timing?.chargeRemainingMin || 0) }) as string)

const chargeOn = computed(() => Boolean((indicator.value as any).chargeFetOn))
const dischargeOn = computed(() => Boolean((indicator.value as any).dischargeFetOn))
const balancingOn = computed(() => Boolean((props.status?.cell?.balancing || []).some((x) => x)))
const protectOn = computed(() => Boolean(Object.values(protect.value as Record<string, boolean>).some((x) => x)))

const toV = (mv: unknown) => {
	const n = typeof mv === 'number' ? mv : Number(mv)
	if (!Number.isFinite(n)) return '-'
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

const mosText = computed(() => {
	const c = props.status?.temperature?.chargeMosC
	return cToFText(c)
})
const t1Text = computed(() => cToFText(props.status?.temperature?.ambientC))
const t2Text = computed(() => cToFText(props.status?.temperature?.heatingFilmC))
</script>

<style lang="scss" scoped>
.wrap {
	padding: 24rpx;
	box-sizing: border-box;
}

.top {
	position: relative;
	height: 600rpx;
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
	font-size: 26rpx;
	color: #f6a545;
	padding: 10rpx 22rpx;
	background: rgba(246, 165, 69, 0.16);
	border-radius: 999px;
}

.mac {
	font-size: 28rpx;
	color: #333333;
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
</style>
