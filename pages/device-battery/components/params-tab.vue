<template>
	<view class="wrap">
		<view class="panel">
			<view class="section" @tap="toggle('single')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-mono@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.singleCell') }}</text>
				</view>
				<u-icon :name="opened.single ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="opened.single" class="list">
				<view v-for="item in singleItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
					<text class="item__label">{{ item.label }}</text>
					<view class="item__right">
						<text class="item__value">{{ item.valueText }}</text>
						<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>

			<view class="divider"></view>

			<view class="section" @tap="toggle('voltage')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-voltage@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.voltage') }}</text>
				</view>
				<u-icon :name="opened.voltage ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="opened.voltage" class="list">
				<view v-for="item in voltageItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
					<text class="item__label">{{ item.label }}</text>
					<view class="item__right">
						<text class="item__value">{{ item.valueText }}</text>
						<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>

			<view class="divider"></view>

			<view class="section" @tap="toggle('current')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-currency@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.current') }}</text>
				</view>
				<u-icon :name="opened.current ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="opened.current" class="list">
				<view v-for="item in currentItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
					<text class="item__label">{{ item.label }}</text>
					<view class="item__right">
						<text class="item__value">{{ item.valueText }}</text>
						<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>

			<view class="divider"></view>

			<view class="section" @tap="toggle('temperature')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-temperature@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.temperature') }}</text>
				</view>
				<u-icon :name="opened.temperature ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="opened.temperature" class="list">
				<view v-for="item in temperatureItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
					<text class="item__label">{{ item.label }}</text>
					<view class="item__right">
						<text class="item__value">{{ item.valueText }}</text>
						<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>
		</view>

		<view class="panel panel--actions">
			<view class="action" hover-class="action--hover" @tap="goAdvanced">
				<view class="action__left">
					<image class="action__icon" src="/static/image/device/icon-advance-setting@2x.png" mode="aspectFit" />
					<text class="action__title">{{ $t('deviceDetail.params.advanced') }}</text>
				</view>
				<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
			</view>

			<view class="divider"></view>

			<view class="action" hover-class="action--hover" @tap="openOta">
				<view class="action__left">
					<image class="action__icon" src="/static/image/device/icon-ota@2x.png" mode="aspectFit" />
					<text class="action__title">{{ $t('deviceDetail.params.otaUpgrade') }}</text>
				</view>
				<view class="action__right">
					<text class="action__value">{{ fwVersionText }}</text>
					<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
				</view>
			</view>
		</view>

		<u-popup :show="editPopup.show" mode="center" @close="editPopup.show = false">
			<view class="edit">
				<text class="edit__title">{{ editPopup.title }}</text>
				<view class="edit__input">
					<u-input v-model="editPopup.input" :placeholder="$t('deviceDetail.params.inputPlaceholder')" border="none"></u-input>
					<text class="edit__unit">{{ editPopup.unit }}</text>
				</view>
				<view class="edit__btns">
					<view class="btn btn--cancel" hover-class="btn--hover" @tap="editPopup.show = false">{{ $t('common.cancel') }}</view>
					<view class="btn btn--ok" hover-class="btn--hover" @tap="confirmEdit">{{ $t('common.confirm') }}</view>
				</view>
			</view>
		</u-popup>

		<u-popup :show="otaPopup" mode="center" @close="otaPopup = false">
			<view class="ota">
				<text class="ota__title">{{ $t('deviceDetail.params.otaUpgrade') }}</text>
				<view class="ota__bar">
					<u-line-progress :percentage="50" activeColor="#0B3BFF"></u-line-progress>
				</view>
				<text class="ota__text">{{ $t('deviceDetail.params.otaProgress', { p: 50 }) }}</text>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppBatteryDetail } from '@/service/app-battery'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'
import type { BmsClient } from '@/common/lib/bms-protocol'
import { PARAM_DEF_BY_KEY } from '@/common/lib/bms-protocol/param-registry'

type ParamItem = {
	key: string
	label: string
	valueText: string
	unit: string
}

const props = defineProps<{
	battery: AppBatteryDetail | null
	status: BmsStatus | null
	client: BmsClient | null
	connType: 'bluetooth' | 'mqtt' | 'offline'
}>()

const { t, te } = useI18n()

const opened = reactive({
	single: false,
	voltage: false,
	current: false,
	temperature: false,
})

const toggle = (k: keyof typeof opened) => {
	opened[k] = !opened[k]
	if (opened[k]) loadSection(k)
}

const fwVersionText = computed(() => String(props.battery?.fw_version || props.status?.meta?.softwareVersion || '-'))

const paramValues = reactive<Record<string, unknown>>({})

const labelOf = (key: string) => {
	const i18nKey = `bmsParam.${key}`
	if (te(i18nKey)) return t(i18nKey) as string
	return PARAM_DEF_BY_KEY[key]?.label || key
}

const unitOf = (key: string) => String(PARAM_DEF_BY_KEY[key]?.unit || '')

const formatValue = (v: unknown, unit: string) => {
	if (v == null || v === '') return '-'
	if (typeof v === 'string') return v
	const n = typeof v === 'number' ? v : Number(v)
	if (!Number.isFinite(n)) return '-'
	if (unit === 'V') return `${n.toFixed(2)}V`
	if (unit === 'A') return `${n.toFixed(1)}A`
	if (unit === '°C') return `${n.toFixed(0)}°C`
	if (unit.toLowerCase() === 's') return `${n.toFixed(0)}S`
	if (unit.toLowerCase() === 'min') return `${n.toFixed(0)}MIN`
	return `${n}${unit}`
}

const mkItems = (keys: string[]) =>
	keys.map((key) => ({
		key,
		label: labelOf(key),
		unit: unitOf(key),
		valueText: formatValue(paramValues[key], unitOf(key)),
	}))

const SINGLE_KEYS = [
	'CELL_OV_ALARM_V',
	'CELL_OC_PROTECT_V',
	'CELL_OC_ALARM_DELAY_S',
	'CELL_OC_PROTECT_DELAY_S',
	'CELL_OV_PROTECT_RELEASE_V',
	'CELL_OC_ALARM_RELEASE_DELTA_V',
	'CELL_OV_ALARM_RELEASE_DELAY_S',
	'CELL_OV_PROTECT_RELEASE_DELAY_S',
	'NORMAL_CELL_UV_ALARM_V',
	'NORMAL_CELL_UV_PROTECT_V',
	'CELL_UV_ALARM_DELAY_S',
	'CELL_UV_PROTECT_DELAY_S',
]

const VOLTAGE_KEYS = ['PACK_OV_ALARM_V', 'PACK_OV_PROTECT_V', 'PACK_OV_ALARM_DELAY_S', 'PACK_OV_PROTECT_DELAY_S', 'PACK_UV_ALARM_DELAY_S', 'PACK_UV_PROTECT_DELAY_S']
const CURRENT_KEYS = ['CHARGE_OC_PROTECT_SMALL_A', 'CHARGE_OC_PROTECT_LARGE_A', 'CHARGE_OC_ALARM_DELAY_S', 'DISCHARGE_OC_ALARM_A', 'DISCHARGE_OC_PROTECT_SMALL_A', 'DISCHARGE_OC_PROTECT_LARGE_A']
const TEMP_KEYS = ['CELL_OVER_TEMP_PROTECT_C', 'CELL_OVER_TEMP_RELEASE_C', 'CELL_UNDER_TEMP_PROTECT_C', 'CELL_UNDER_TEMP_RELEASE_C']

const singleItems = computed(() => mkItems(SINGLE_KEYS))
const voltageItems = computed(() => mkItems(VOLTAGE_KEYS))
const currentItems = computed(() => mkItems(CURRENT_KEYS))
const temperatureItems = computed(() => mkItems(TEMP_KEYS))

const editPopup = reactive({
	show: false,
	title: '',
	key: '',
	unit: '',
	input: '',
})

const otaPopup = ref(false)

const openEdit = (item: ParamItem) => {
	if (!props.client || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	editPopup.title = item.label
	editPopup.key = item.key
	editPopup.unit = item.unit || ''
	const current = paramValues[item.key]
	editPopup.input = typeof current === 'number' ? String(current) : typeof current === 'string' ? current : ''
	editPopup.show = true
}

const confirmEdit = async () => {
	const c = props.client
	if (!c) return
	const raw = String(editPopup.input || '').trim()
	const num = Number(raw)
	if (!raw || !Number.isFinite(num)) {
		uni.showToast({ title: t('deviceDetail.toast.invalidInput') as string, icon: 'none' })
		return
	}
	try {
		await c.writeParam(editPopup.key, num)
		paramValues[editPopup.key] = await c.readParam(editPopup.key)
		editPopup.show = false
		uni.showToast({ title: t('deviceDetail.toast.saved') as string, icon: 'none' })
	} catch (e) {
		editPopup.show = false
		uni.showToast({ title: t('deviceDetail.toast.saveFailed') as string, icon: 'none' })
	}
}

const goAdvanced = () => {
	uni.showToast({ title: t('deviceDetail.todo') as string, icon: 'none' })
}

const openOta = () => {
	otaPopup.value = true
}

const loadKeys = async (keys: string[]) => {
	const c = props.client
	if (!c) return
	for (const k of keys) {
		try {
			// eslint-disable-next-line no-await-in-loop
			paramValues[k] = await c.readParam(k)
		} catch (e) {
			paramValues[k] = null
		}
	}
}

const loadSection = (k: keyof typeof opened) => {
	if (!props.client || props.connType === 'offline') return
	if (k === 'single') return loadKeys(SINGLE_KEYS)
	if (k === 'voltage') return loadKeys(VOLTAGE_KEYS)
	if (k === 'current') return loadKeys(CURRENT_KEYS)
	if (k === 'temperature') return loadKeys(TEMP_KEYS)
}
</script>

<style lang="scss" scoped>
.wrap {
	padding: 24rpx;
	box-sizing: border-box;
}

.panel {
	background: #ffffff;
	border-radius: 22rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
	overflow: hidden;
}

.panel--actions {
	margin-top: 18rpx;
}

.section,
.action {
	padding: 22rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.section__left,
.action__left {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.section__icon,
.action__icon {
	width: 38rpx;
	height: 38rpx;
}

.section__title,
.action__title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333333;
}

.action__right {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.action__value {
	font-size: 24rpx;
	color: #8e95a2;
}

.divider {
	height: 1px;
	background: #f2f3f5;
}

.list {
	padding-bottom: 10rpx;
}

.item {
	padding: 18rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.item--hover,
.action--hover {
	background: rgba(0, 0, 0, 0.03);
}

.item__label {
	font-size: 26rpx;
	color: #333333;
}

.item__right {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.item__value {
	font-size: 26rpx;
	color: #8e95a2;
}

.edit {
	width: 640rpx;
	background: #ffffff;
	border-radius: 22rpx;
	padding: 28rpx 26rpx;
	box-sizing: border-box;
}

.edit__title {
	display: block;
	text-align: center;
	font-size: 30rpx;
	font-weight: 700;
	color: #333333;
}

.edit__input {
	margin-top: 22rpx;
	height: 84rpx;
	border-radius: 14rpx;
	border: 1px solid #eef0f4;
	display: flex;
	align-items: center;
	padding: 0 18rpx;
	box-sizing: border-box;
	gap: 10rpx;
}

.edit__unit {
	font-size: 26rpx;
	color: #8e95a2;
}

.edit__btns {
	margin-top: 26rpx;
	display: flex;
	gap: 18rpx;
}

.btn {
	flex: 1;
	height: 82rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 600;
}

.btn--cancel {
	background: #eef0f4;
	color: #a0a0a0;
}

.btn--ok {
	background: #0b3bff;
	color: #ffffff;
}

.btn--hover {
	opacity: 0.9;
}

.ota {
	width: 640rpx;
	background: #ffffff;
	border-radius: 22rpx;
	padding: 30rpx 28rpx;
	box-sizing: border-box;
}

.ota__title {
	display: block;
	text-align: center;
	font-size: 30rpx;
	font-weight: 700;
	color: #333333;
}

.ota__bar {
	margin-top: 26rpx;
}

.ota__text {
	display: block;
	margin-top: 18rpx;
	text-align: center;
	font-size: 26rpx;
	color: #8e95a2;
}
</style>
