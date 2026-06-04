<template>
	<view class="wrap">
		<view v-if="hasBasicSections" class="panel">
			<view v-if="hasSingleItems" class="section" @tap="toggle('single')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-mono@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.singleCell') }}</text>
				</view>
				<view v-if="loading.single" class="section-loading"></view>
				<u-icon v-else :name="opened.single ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="hasSingleItems && opened.single" class="list">
				<view v-for="item in singleItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
					<text class="item__label">{{ item.label }}</text>
					<view class="item__right">
						<text class="item__value">{{ item.valueText }}</text>
						<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>

			<view v-if="hasSingleItems && hasVoltageItems" class="divider"></view>

			<view v-if="hasVoltageItems" class="section" @tap="toggle('voltage')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-voltage@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.voltage') }}</text>
				</view>
				<view v-if="loading.voltage" class="section-loading"></view>
				<u-icon v-else :name="opened.voltage ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="hasVoltageItems && opened.voltage" class="list">
				<view v-for="item in voltageItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
					<text class="item__label">{{ item.label }}</text>
					<view class="item__right">
						<text class="item__value">{{ item.valueText }}</text>
						<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>

			<view v-if="hasCurrentItems && (hasSingleItems || hasVoltageItems)" class="divider"></view>

			<view v-if="hasCurrentItems" class="section" @tap="toggle('current')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-currency@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.current') }}</text>
				</view>
				<view v-if="loading.current" class="section-loading"></view>
				<u-icon v-else :name="opened.current ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="hasCurrentItems && opened.current" class="list">
				<view v-for="item in currentItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
					<text class="item__label">{{ item.label }}</text>
					<view class="item__right">
						<text class="item__value">{{ item.valueText }}</text>
						<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
					</view>
				</view>
			</view>

			<view v-if="hasTemperatureItems && (hasSingleItems || hasVoltageItems || hasCurrentItems)" class="divider"></view>

			<view v-if="hasTemperatureItems" class="section" @tap="toggle('temperature')">
				<view class="section__left">
					<image class="section__icon" src="/static/image/device/icon-temperature@2x.png" mode="aspectFit" />
					<text class="section__title">{{ $t('deviceDetail.params.temperature') }}</text>
				</view>
				<view v-if="loading.temperature" class="section-loading"></view>
				<u-icon v-else :name="opened.temperature ? 'arrow-up' : 'arrow-down'" size="16" color="#C0C4CC"></u-icon>
			</view>
			<view v-if="hasTemperatureItems && opened.temperature" class="list">
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
			<view v-if="hasAdvancedSections" class="action" hover-class="action--hover" @tap="openAdvanced">
				<view class="action__left">
					<image class="action__icon" src="/static/image/device/icon-advance-setting@2x.png" mode="aspectFit" />
					<text class="action__title">{{ $t('deviceDetail.params.advanced') }}</text>
				</view>
				<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
			</view>

			<view v-if="hasAdvancedSections && allowOtaEnabled" class="divider"></view>

			<view v-if="allowOtaEnabled" class="action" hover-class="action--hover" @tap="openOta">
				<view class="action__left">
					<image class="action__icon" src="/static/image/device/icon-ota@2x.png" mode="aspectFit" />
					<view class="action__title-wrap">
						<text class="action__title">{{ $t('deviceDetail.params.otaUpgrade') }}</text>
						<view v-if="showOtaBadge" class="ota-badge"></view>
					</view>
				</view>
				<view class="action__right">
					<view class="action__meta">
						<text class="action__value">{{ fwVersionText }}</text>
						<text v-if="otaTargetVersionText" class="action__subvalue">{{ otaTargetVersionText }}</text>
					</view>
					<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
				</view>
			</view>

			<view v-if="showMeterUpgradeCard" class="divider"></view>

			<view v-if="showMeterUpgradeCard" class="meter-upgrade">
				<view class="meter-upgrade__head">
					<view class="action__left">
						<image class="action__icon" src="/static/image/device/icon-ota@2x.png" mode="aspectFit" />
						<text class="action__title">{{ $t('deviceDetail.params.meterUpgradeTitle') }}</text>
					</view>
				</view>
				<view class="meter-upgrade__selector" hover-class="item--hover" @tap="openMeterPackagePopup">
					<view class="meter-upgrade__selector-main">
						<text class="meter-upgrade__selector-label">{{ $t('deviceDetail.params.meterUpgradePackage') }}</text>
						<text class="meter-upgrade__selector-value">{{ meterPackageSummary }}</text>
					</view>
					<u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
				</view>
				<text class="meter-upgrade__desc">{{ meterPackageDescription }}</text>
				<u-button type="primary" :customStyle="meterUpgradeButtonStyle" @click="startMeterOta">
					{{ $t('deviceDetail.params.meterUpgradeStart') }}
				</u-button>
			</view>

			<view v-if="showMeterOtaDebugLog" class="divider"></view>

			<view v-if="showMeterOtaDebugLog" class="meter-debug">
				<view class="meter-debug__head" @tap="toggleMeterOtaDebug">
					<view class="meter-debug__title-wrap">
						<text class="meter-debug__title">{{ $t('deviceDetail.params.meterOtaDebugTitle') }}</text>
						<text class="meter-debug__count">{{ meterOtaDebugCountText }}</text>
					</view>
					<u-icon :name="meterOtaDebugExpanded ? 'arrow-up' : 'arrow-down'" size="16" color="#8E95A2"></u-icon>
				</view>
				<view class="meter-debug__actions">
					<view class="meter-debug__btn" hover-class="meter-debug__btn--hover" @tap="copyMeterOtaDebugLog">
						{{ $t('deviceDetail.params.meterOtaDebugCopy') }}
					</view>
					<view class="meter-debug__btn meter-debug__btn--ghost" hover-class="meter-debug__btn--hover" @tap="clearMeterOtaDebugLog">
						{{ $t('deviceDetail.params.meterOtaDebugClear') }}
					</view>
				</view>
				<scroll-view v-if="meterOtaDebugExpanded" class="meter-debug__body" scroll-y>
					<view v-if="!meterOtaDebugLines.length" class="meter-debug__empty">
						{{ $t('deviceDetail.params.meterOtaDebugEmpty') }}
					</view>
					<text v-for="line in meterOtaDebugLines" :key="line.id" class="meter-debug__line">{{ line.text }}</text>
				</scroll-view>
			</view>
		</view>

		<u-popup :show="editPopup.show" mode="center" @close="closeEditPopup">
			<view class="edit">
				<text class="edit__title">{{ editPopup.title }}</text>
				<view class="edit__input">
					<u-input
						v-model="editPopup.input"
						:placeholder="$t('deviceDetail.params.inputPlaceholder')"
						:type="editPopup.inputType"
						border="none"
					></u-input>
					<text class="edit__unit">{{ editPopup.unit }}</text>
				</view>
				<view class="edit__btns">
					<view class="btn btn--cancel" hover-class="btn--hover" @tap="closeEditPopup">{{ $t('common.cancel') }}</view>
					<view class="btn btn--ok" hover-class="btn--hover" @tap="confirmEdit">{{ $t('common.confirm') }}</view>
				</view>
			</view>
		</u-popup>

		<u-picker
			:show="batteryTypePicker.show"
			:title="batteryTypePicker.title"
			:columns="[BATTERY_TYPE_OPTIONS]"
			keyName="text"
			valueName="value"
			:defaultIndex="[batteryTypePicker.index]"
			@confirm="confirmBatteryTypePicker"
			@cancel="closeBatteryTypePicker"
			@close="closeBatteryTypePicker"
		></u-picker>

		<u-popup :show="otaState.show" mode="center" @close="closeOtaPopup">
			<view class="ota">
				<text class="ota__title">{{ $t('deviceDetail.params.otaUpgrade') }}</text>
				<view class="ota__bar">
					<u-line-progress :percentage="otaState.progress" activeColor="#0B3BFF"></u-line-progress>
				</view>
				<text class="ota__text">{{ otaMessageText }}</text>
			</view>
		</u-popup>

		<u-popup :show="meterPackagePopup.show" mode="bottom" @close="closeMeterPackagePopup">
			<view class="meter-package-popup" :style="{ paddingBottom: safeBottom + 'px' }">
				<view class="meter-package-popup__header">
					<text class="meter-package-popup__title">{{ $t('deviceDetail.params.meterUpgradeSelectTitle') }}</text>
					<view class="advanced__close" hover-class="advanced__close--hover" @tap="closeMeterPackagePopup">
						<u-icon name="close" size="18" color="#8E95A2"></u-icon>
					</view>
				</view>
				<scroll-view class="meter-package-popup__body" scroll-y :style="{ height: meterPackageBodyHeightPx + 'px' }">
					<view v-if="meterPackageLoading" class="meter-package-popup__empty">
						{{ $t('deviceDetail.params.meterUpgradeLoading') }}
					</view>
					<view v-else-if="!meterPackageList.length" class="meter-package-popup__empty">
						{{ $t('deviceDetail.params.meterUpgradeEmpty') }}
					</view>
					<view
						v-for="pkg in meterPackageList"
						:key="pkg.id"
						class="meter-package-item"
						:class="{ 'meter-package-item--selected': selectedMeterPackageId === pkg.id }"
						hover-class="item--hover"
						@tap="selectMeterPackage(pkg)"
					>
						<view class="meter-package-item__main">
							<text class="meter-package-item__name">{{ pkg.name }}</text>
							<text class="meter-package-item__desc">{{ pkg.description || $t('deviceDetail.params.meterUpgradeDescEmpty') }}</text>
						</view>
						<u-icon
							:name="selectedMeterPackageId === pkg.id ? 'checkmark-circle-fill' : 'arrow-right'"
							size="18"
							:color="selectedMeterPackageId === pkg.id ? '#0B3BFF' : '#C0C4CC'"
						></u-icon>
					</view>
				</scroll-view>
			</view>
		</u-popup>

		<u-popup :show="advancedPopup.show" mode="bottom" @close="closeAdvanced">
			<view class="advanced" :style="{ paddingBottom: safeBottom + 'px' }">
				<view class="advanced__header">
					<text class="advanced__title">{{ $t('deviceDetail.params.advanced') }}</text>
					<view class="advanced__close" hover-class="advanced__close--hover" @tap="closeAdvanced">
						<u-icon name="close" size="18" color="#8E95A2"></u-icon>
					</view>
				</view>

				<scroll-view class="advanced__body" scroll-y>
					<view v-if="hasAdvancedConfigItems" class="advanced__section">
						<text class="advanced__section-title">{{ $t('deviceDetail.params.advancedConfig') }}</text>
						<view class="list list--popup">
							<view v-if="canAccessReadonlySoh" class="item item--readonly">
								<text class="item__label">{{ $t('deviceDetail.params.sohReadonly') }}</text>
								<view class="item__right">
									<text class="item__value">{{ sohReadonlyText }}</text>
								</view>
							</view>
							<view v-if="canAccessVirtualCapacity" class="item" hover-class="item--hover" @tap="openVirtualCapacityEdit">
								<text class="item__label">{{ $t('deviceDetail.params.virtualCapacityWrite') }}</text>
								<view class="item__right">
									<text class="item__value">{{ $t('deviceDetail.params.execute') }}</text>
									<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
								</view>
							</view>
							<view v-if="hasOtherItems" class="divider divider--inner"></view>
							<view v-for="item in otherItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
								<text class="item__label">{{ item.label }}</text>
								<view class="item__right">
									<text class="item__value">{{ item.valueText }}</text>
									<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
								</view>
							</view>
						</view>
					</view>

					<view v-if="hasNumberingItems" class="advanced__section">
						<text class="advanced__section-title">{{ $t('deviceDetail.params.numberingConfig') }}</text>
						<view class="list list--popup">
							<view v-for="item in numberingItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
								<text class="item__label">{{ item.label }}</text>
								<view class="item__right">
									<text class="item__value">{{ item.valueText }}</text>
									<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
								</view>
							</view>
						</view>
					</view>

					<view v-if="hasSystemSection" class="advanced__section">
						<text class="advanced__section-title">{{ $t('deviceDetail.params.systemConfig') }}</text>
						<view v-if="hasFunctionControlItems" class="function-list function-list--popup">
							<view v-for="item in functionControlItems" :key="item.key" class="function-item">
								<view class="function-item__main">
									<text class="item__label">{{ item.label }}</text>
									<text class="function-item__status">{{ item.statusText }}</text>
								</view>
								<view class="function-item__switch">
									<u-switch
										:modelValue="item.enabled"
										:size="22"
										:activeColor="'#0B3BFF'"
										:inactiveColor="'#E6E7EB'"
										@change="value => setFunctionControl(item.key, !!value)"
									></u-switch>
								</view>
							</view>
						</view>
						<view v-if="hasSystemItems" class="list list--popup">
							<view v-for="item in systemItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
								<text class="item__label">{{ item.label }}</text>
								<view class="item__right">
									<text class="item__value">{{ item.valueText }}</text>
									<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
								</view>
							</view>
						</view>
					</view>

					<view v-if="hasFactoryItems" class="advanced__section">
						<text class="advanced__section-title">{{ $t('deviceDetail.params.factoryConfig') }}</text>
						<view class="list list--popup">
							<view v-for="item in factoryItems" :key="item.key" class="item" hover-class="item--hover" @tap="runFactory(item)">
								<text class="item__label">{{ item.label }}</text>
								<view class="item__right">
									<text class="item__value">{{ $t('deviceDetail.params.execute') }}</text>
									<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
								</view>
							</view>
						</view>
					</view>
					<view class="advanced__body-spacer" :style="{ height: advancedBottomGap + 'px' }"></view>
				</scroll-view>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveBaseUrl } from '@/API/interface'
import {
	appBatteryOtaCheck,
	getAppBatteryMeterOtaPackages,
	type AppBatteryDetail,
	type AppBatteryMeterOtaPackage,
} from '@/service/app-battery'
import { fetchCurrentDeviceParamPermissions } from '@/service/permissions'
import { isMeterMac } from '@/common/device-provision/device-prefix-shared'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'
import type { BmsClient } from '@/common/lib/bms-protocol/client'
import {
	FUNCTION_CONFIG_ITEMS,
	parseFunctionConfigFlags,
	setFunctionConfigFlag,
	type FunctionConfigFlagKey,
} from '@/common/lib/bms-protocol/function-config'
import { bootOtaUpgrade } from '@/common/lib/bms-protocol/boot-ota'
import {
	BMS_PARAM,
	PARAM_CATEGORIES,
	PARAM_DEF_BY_KEY,
	getFactoryPermissionKey,
	getFunctionPermissionKey,
	getParamPermissionKey,
	listParamsByCategory,
} from '@/common/lib/bms-protocol/param-registry'
import { getWindowInfo } from '@/common/platform'
import { useDeveloperStore } from '@/store/developer'
import {
	appendOtaDebugLog,
	copyOtaDebugLogs,
	otaDebugLogs,
	resetOtaDebugLog,
	type OtaDebugLogLevel,
	type OtaDebugLogScope,
} from '../ota-debug-log'

type ParamItem = {
	key: string
	actualKey?: string
	label: string
	valueText: string
	unit: string
	valueType: string
	rawValue?: unknown
}

type FunctionControlItem = (typeof FUNCTION_CONFIG_ITEMS)[number] & {
	enabled: boolean
	statusText: string
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

type MeterOtaPackage = {
	id: string
	name: string
	description: string
	packageUrl: string
}

const TEMP_DISPLAY_LABEL_KEYS: Record<string, string> = {
	CELL_OVER_TEMP_PROTECT_C: 'deviceDetail.params.temperatureLabels.mosOverTempProtect',
	CELL_OVER_TEMP_RELEASE_C: 'deviceDetail.params.temperatureLabels.mosOverTempRelease',
	MOS_OVER_TEMP_PROTECT_DELAY_S: 'deviceDetail.params.temperatureLabels.mosOverTempProtectDelay',
	MOS_OVER_TEMP_RELEASE_DELAY_S: 'deviceDetail.params.temperatureLabels.mosOverTempReleaseDelay',
	CELL_UNDER_TEMP_PROTECT_C: 'deviceDetail.params.temperatureLabels.chargeUnderTempProtect',
	CELL_UNDER_TEMP_RELEASE_C: 'deviceDetail.params.temperatureLabels.chargeUnderTempRelease',
	CHARGE_OVER_TEMP_PROTECT_C: 'deviceDetail.params.temperatureLabels.chargeOverTempProtect',
	CHARGE_OVER_TEMP_RELEASE_C: 'deviceDetail.params.temperatureLabels.chargeOverTempRelease',
	CHARGE_OVER_TEMP_PROTECT_DELAY_S: 'deviceDetail.params.temperatureLabels.chargeOverTempProtectDelay',
	CHARGE_OVER_TEMP_RELEASE_DELAY_S: 'deviceDetail.params.temperatureLabels.chargeOverTempReleaseDelay',
	DISCHARGE_UNDER_TEMP_PROTECT_C: 'deviceDetail.params.temperatureLabels.dischargeUnderTempProtect',
	DISCHARGE_UNDER_TEMP_RELEASE_C: 'deviceDetail.params.temperatureLabels.dischargeUnderTempRelease',
	DISCHARGE_OVER_TEMP_PROTECT_C: 'deviceDetail.params.temperatureLabels.dischargeOverTempProtect',
	DISCHARGE_OVER_TEMP_RELEASE_C: 'deviceDetail.params.temperatureLabels.dischargeOverTempRelease',
	DISCHARGE_OVER_TEMP_PROTECT_DELAY_S: 'deviceDetail.params.temperatureLabels.dischargeOverTempProtectDelay',
	DISCHARGE_OVER_TEMP_RELEASE_DELAY_S: 'deviceDetail.params.temperatureLabels.dischargeOverTempReleaseDelay',
}

const BATTERY_TYPE_KEY_MAP: Record<number, string> = {
	0x00: 'deviceDetail.params.batteryTypes.reserved',
	0x01: 'deviceDetail.params.batteryTypes.lifepo4',
	0x02: 'deviceDetail.params.batteryTypes.lmo',
	0x03: 'deviceDetail.params.batteryTypes.ternaryLithium',
	0x04: 'deviceDetail.params.batteryTypes.lco',
	0x05: 'deviceDetail.params.batteryTypes.lipo',
	0x06: 'deviceDetail.params.batteryTypes.lto',
	0x07: 'deviceDetail.params.batteryTypes.leadAcid',
	0x08: 'deviceDetail.params.batteryTypes.nimh',
	0x09: 'deviceDetail.params.batteryTypes.sodiumIon',
}

const BATTERY_TYPE_OPTIONS = computed(() =>
	Object.entries(BATTERY_TYPE_KEY_MAP).map(([value, key]) => ({
		value: Number(value),
		text: t(key) as string,
	}))
)

const props = defineProps<{
	battery: AppBatteryDetail | null
	status: BmsStatus | null
	client: BmsClient | null
	connType: 'bluetooth' | 'mqtt' | 'offline'
	active?: boolean
	allowOta?: boolean
	otaInfo?: DeviceOtaCheckState | null
	otaChecking?: boolean
	otaNeedUpgrade?: boolean
	onPausePolling?: () => void
	onResumePolling?: () => void
}>()
const emit = defineEmits<{
	(e: 'ota-state-change', patch: Partial<DeviceOtaCheckState>): void
}>()

const { t, te } = useI18n()
const developerStore = useDeveloperStore()

const opened = reactive({
	single: false,
	voltage: false,
	current: false,
	temperature: false,
})

const loading = reactive({
	single: false,
	voltage: false,
	current: false,
	temperature: false,
})

const loaded = reactive({
	single: false,
	voltage: false,
	current: false,
	temperature: false,
	other: false,
	numbering: false,
	system: false,
})

const applyPollingState = () => {
	if (props.active) {
		props.onPausePolling && props.onPausePolling()
		return
	}
	props.onResumePolling && props.onResumePolling()
}

onMounted(() => {
	loadDeviceParamPermissions()
})

type BasicSectionKey = keyof typeof opened

const toggle = async (k: BasicSectionKey) => {
	if (loading[k]) return
	if (opened[k]) {
		opened[k] = false
		applyPollingState()
		return
	}
	if (!props.client || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	if (loaded[k]) {
		opened[k] = true
		applyPollingState()
		return
	}
	loading[k] = true
	applyPollingState()
	try {
		await loadSection(k)
		opened[k] = true
	} catch (e) {
		console.error('[params] load section failed', k, e)
		uni.showToast({ title: t('deviceDetail.toast.openFailed') as string, icon: 'none' })
	} finally {
		loading[k] = false
		applyPollingState()
	}
}

const fwVersionText = computed(() => String(props.battery?.fw_version || props.status?.meta?.softwareVersion || '-'))
const meterMac = computed(() => String(props.battery?.ble_mac || props.status?.identity?.bluetoothMac || '').trim())
const isMeterDevice = computed(() => isMeterMac(meterMac.value))
const allowOtaEnabled = computed(() => props.allowOta !== false && !isMeterDevice.value)
const showOtaBadge = computed(() => allowOtaEnabled.value && !!props.otaNeedUpgrade)
const showMeterUpgradeCard = computed(() => props.connType === 'bluetooth' && isMeterDevice.value)
const showMeterOtaDebugLog = computed(() => showMeterUpgradeCard.value && developerStore.enabled)
const otaTargetVersionText = computed(() => {
	const version = String(props.otaInfo?.targetVersion || '').trim()
	if (!showOtaBadge.value || !version) return ''
	let text = (t('deviceDetail.params.otaTargetVersion', { v: version }) as string) || ''
	if (text.includes('{v}')) {
		text = text.replace(/\{v\}/g, version)
	}
	return text
})

const meterPackageList = ref<MeterOtaPackage[]>([])
const meterPackageLoading = ref(false)
const meterPackagePopup = reactive({
	show: false,
})
const selectedMeterPackageId = ref('')
const selectedMeterPackage = computed(() => meterPackageList.value.find((item) => item.id === selectedMeterPackageId.value) || null)
const meterOtaDebugExpanded = ref(false)
const meterOtaDebugCountText = computed(() =>
	(t('deviceDetail.params.meterOtaDebugCount', { count: otaDebugLogs.value.length }) as string).replace(
		'{count}',
		String(otaDebugLogs.value.length)
	)
)
const meterOtaDebugLines = computed(() =>
	otaDebugLogs.value.slice(-120).map((item) => {
		const dataText = item.data == null ? '' : ` ${JSON.stringify(item.data)}`
		return {
			id: item.id,
			text: `[${item.ts}] [${item.level.toUpperCase()}] [${item.scope}] ${item.message}${dataText}`,
		}
	})
)

const paramValues = reactive<Record<string, unknown>>({})

const deviceParamPerm = reactive({
	allowAll: true,
	keys: [] as string[],
})
const deviceParamPermSet = computed(() => new Set(deviceParamPerm.keys))

const canAccessParamKey = (actualKey: string) => {
	if (deviceParamPerm.allowAll) return true
	const permKey = getParamPermissionKey(actualKey)
	if (!permKey) return true
	return deviceParamPermSet.value.has(permKey)
}

const canAccessPermissionKey = (permissionKey: string) => {
	if (deviceParamPerm.allowAll) return true
	return deviceParamPermSet.value.has(permissionKey)
}

const canAccessFunctionControl = (flagKey: FunctionConfigFlagKey) => canAccessPermissionKey(getFunctionPermissionKey(flagKey))

const canAccessFactoryAction = (actionKey: string) => canAccessPermissionKey(getFactoryPermissionKey(actionKey))

const filterParamEntries = <T extends string | { displayKey: string; actualKey: string }>(entries: T[]) =>
	entries.filter((entry) => {
		const actualKey = typeof entry === 'string' ? entry : entry.actualKey
		return canAccessParamKey(actualKey)
	})

const labelOf = (key: string) => {
	const i18nKey = `bmsParam.${key}`
	if (te(i18nKey)) return t(i18nKey) as string
	const tempLabelKey = TEMP_DISPLAY_LABEL_KEYS[key]
	if (tempLabelKey) return t(tempLabelKey) as string
	return PARAM_DEF_BY_KEY[key]?.label || key
}

const withSingleCellPrefix = (label: string) => {
	if (!label) return t('deviceDetail.params.singleCellDefault') as string
	if (label.includes('单体')) return label
	if (/single cell/i.test(label) || /\bcell\b/i.test(label)) return label
	let text = (t('deviceDetail.params.singleCellPrefix', { label }) as string) || ''
	if (!text) return label
	if (text.includes('{label}')) {
		text = text.replace(/\{label\}/g, label)
	}
	return text
}

const unitOf = (key: string) => String(PARAM_DEF_BY_KEY[key]?.unit || '')
const isBatteryTypeKey = (key: string) => key === BMS_PARAM.BATTERY_TYPE

const formatDisplayNumber = (value: number, decimals: number) => {
	if (!Number.isFinite(value)) return '-'
	if (decimals <= 0) return String(Math.round(value))
	const factor = 10 ** decimals
	const normalized = Math.round((value + Number.EPSILON) * factor) / factor
	return normalized
		.toFixed(decimals)
		.replace(/(\.\d*?[1-9])0+$/u, '$1')
		.replace(/\.0+$/u, '')
}

const getBatteryTypeLabel = (value: unknown) => {
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n)) return '-'
	return (
		BATTERY_TYPE_OPTIONS.value.find((item) => item.value === n)?.text ||
		(t('deviceDetail.params.unknownBatteryType', { value: Math.trunc(n) }) as string)
	)
}

const getScaleDecimals = (scale?: number) => {
	if (typeof scale !== 'number' || !Number.isFinite(scale) || scale <= 0) return 0
	const s = scale.toString()
	if (!s.includes('.')) return 0
	return s.split('.')[1]?.length || 0
}

const normalizeEditableNumber = (value: number, decimals: number) => {
	if (!Number.isFinite(value)) return ''
	if (decimals <= 0) return String(Math.round(value))
	return value
		.toFixed(decimals)
		.replace(/(\.\d*?[1-9])0+$/u, '$1')
		.replace(/\.0+$/u, '')
}

const formatEditableValue = (key: string, value: unknown) => {
	if (value == null || value === '') return ''
	if (typeof value === 'string') return value
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n)) return ''
	const def = PARAM_DEF_BY_KEY[key]
	return normalizeEditableNumber(n, getScaleDecimals((def as any)?.scale))
}

const formatParamValue = (key: string, value: unknown) => {
	if (isBatteryTypeKey(key)) return getBatteryTypeLabel(value)
	const def = PARAM_DEF_BY_KEY[key]
	const unit = String(def?.unit || '')
	if (value == null || value === '') return '-'
	if (typeof value === 'string') return value
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n)) return '-'
	if (unit) {
		return `${formatDisplayNumber(n, getScaleDecimals((def as any)?.scale))}${unit}`
	}
	return formatDisplayNumber(n, getScaleDecimals((def as any)?.scale))
}

const loadDeviceParamPermissions = async () => {
	try {
		const resp = await fetchCurrentDeviceParamPermissions()
		const data = (resp as any)?.data || {}
		deviceParamPerm.allowAll = data?.allow_all ?? true
		deviceParamPerm.keys = Array.isArray(data?.device_param_permissions) ? data.device_param_permissions : []
	} catch (e) {
		deviceParamPerm.allowAll = true
		deviceParamPerm.keys = []
	}
}

const mkItems = (keys: Array<string | { displayKey: string; actualKey: string }>) =>
	keys.map((entry) => {
		const key = typeof entry === 'string' ? entry : entry.displayKey
		const actualKey = typeof entry === 'string' ? entry : entry.actualKey
		const unit = unitOf(actualKey)
		const value = paramValues[actualKey]
		const label = labelOf(key)
		return {
			key,
			actualKey,
			label: SINGLE_KEY_SET.has(actualKey) ? withSingleCellPrefix(label) : label,
			unit,
			valueText: formatParamValue(actualKey, value),
			valueType: PARAM_DEF_BY_KEY[actualKey]?.valueType || 'u16',
			rawValue: value,
		}
	})

const SINGLE_KEYS = [
	'CELL_OV_ALARM_V',
	'CELL_OC_PROTECT_V',
	'CELL_OC_ALARM_DELAY_S',
	'CELL_OC_PROTECT_DELAY_S',
	'FEEDBACK_OC_PROTECT_DELAY_S',
	'CELL_OV_PROTECT_RELEASE_V',
	'CELL_OC_ALARM_RELEASE_DELTA_V',
	'CELL_OV_ALARM_RELEASE_DELAY_S',
	'CELL_OV_PROTECT_RELEASE_DELAY_S',
	'NORMAL_CELL_UV_ALARM_V',
	'NORMAL_CELL_UV_PROTECT_V',
	'CELL_UV_ALARM_DELAY_S',
	'CELL_UV_PROTECT_DELAY_S',
	'CELL_UV_ALARM_RELEASE_V',
	'CELL_UV_PROTECT_RELEASE_V',
	'CELL_UV_ALARM_RELEASE_DELAY_S',
	'CELL_UV_PROTECT_RELEASE_DELAY_S',
]
const SINGLE_KEY_SET = new Set(SINGLE_KEYS)

const VOLTAGE_KEYS = [
	'PACK_OV_ALARM_V',
	'PACK_OV_PROTECT_V',
	'PACK_OV_ALARM_DELAY_S',
	'PACK_OV_PROTECT_DELAY_S',
	'PACK_OV_ALARM_RELEASE_V',
	'PACK_OV_PROTECT_RELEASE_V',
	'PACK_OV_ALARM_RELEASE_DELAY_S',
	'PACK_OV_PROTECT_RELEASE_DELAY_S',
	'NORMAL_PACK_UV_ALARM_V',
	'NORMAL_PACK_UV_PROTECT_V',
	'LOW_TEMP_PACK_UV_ALARM_V',
	'LOW_TEMP_PACK_UV_PROTECT_V',
	'PACK_UV_ALARM_DELAY_S',
	'PACK_UV_PROTECT_DELAY_S',
	'PACK_UV_ALARM_RELEASE_V',
	'PACK_UV_PROTECT_RELEASE_V',
	'PACK_UV_ALARM_RELEASE_DELAY_S',
	'PACK_UV_PROTECT_RELEASE_DELAY_S',
]
const CURRENT_KEYS = [
	'CHARGE_OC_ALARM_A',
	'CHARGE_OC_PROTECT_SMALL_A',
	'CHARGE_OC_PROTECT_LARGE_A',
	'CHARGE_OC_ALARM_DELAY_S',
	'CHARGE_OC_PROTECT_SMALL_DELAY_S',
	'CHARGE_OC_PROTECT_LARGE_DELAY_S',
	'DISCHARGE_OC_ALARM_A',
	'DISCHARGE_OC_PROTECT_SMALL_A',
	'DISCHARGE_OC_PROTECT_LARGE_A',
	'DISCHARGE_OC_ALARM_DELAY_S',
	'DISCHARGE_OC_PROTECT_SMALL_DELAY_S',
	'DISCHARGE_OC_PROTECT_LARGE_DELAY_S',
]
const TEMP_KEYS = [
	{ displayKey: 'CELL_OVER_TEMP_PROTECT_C', actualKey: 'MOS_OT_PROTECT_C' },
	{ displayKey: 'CELL_OVER_TEMP_RELEASE_C', actualKey: 'MOS_OT_PROTECT_RELEASE_C' },
	{ displayKey: 'MOS_OVER_TEMP_PROTECT_DELAY_S', actualKey: 'MOS_OT_PROTECT_DELAY_S' },
	{ displayKey: 'MOS_OVER_TEMP_RELEASE_DELAY_S', actualKey: 'MOS_OT_PROTECT_RELEASE_DELAY_S' },
	{ displayKey: 'CELL_UNDER_TEMP_PROTECT_C', actualKey: 'CHARGE_UT_PROTECT_C' },
	{ displayKey: 'CELL_UNDER_TEMP_RELEASE_C', actualKey: 'CHARGE_UT_PROTECT_RELEASE_C' },
	{ displayKey: 'CHARGE_OVER_TEMP_PROTECT_C', actualKey: 'CHARGE_OT_PROTECT_C' },
	{ displayKey: 'CHARGE_OVER_TEMP_RELEASE_C', actualKey: 'CHARGE_OT_PROTECT_RELEASE_C' },
	{ displayKey: 'CHARGE_OVER_TEMP_PROTECT_DELAY_S', actualKey: 'CHARGE_OT_PROTECT_DELAY_S' },
	{ displayKey: 'CHARGE_OVER_TEMP_RELEASE_DELAY_S', actualKey: 'CHARGE_OT_PROTECT_RELEASE_DELAY_S' },
	{ displayKey: 'DISCHARGE_UNDER_TEMP_PROTECT_C', actualKey: 'DISCHARGE_UT_PROTECT_C' },
	{ displayKey: 'DISCHARGE_UNDER_TEMP_RELEASE_C', actualKey: 'DISCHARGE_UT_PROTECT_RELEASE_C' },
	{ displayKey: 'DISCHARGE_OVER_TEMP_PROTECT_C', actualKey: 'DISCHARGE_OT_PROTECT_C' },
	{ displayKey: 'DISCHARGE_OVER_TEMP_RELEASE_C', actualKey: 'DISCHARGE_OT_PROTECT_RELEASE_C' },
	{ displayKey: 'DISCHARGE_OVER_TEMP_PROTECT_DELAY_S', actualKey: 'DISCHARGE_OT_PROTECT_DELAY_S' },
	{ displayKey: 'DISCHARGE_OVER_TEMP_RELEASE_DELAY_S', actualKey: 'DISCHARGE_OT_PROTECT_RELEASE_DELAY_S' },
	'CELL_OT_ALARM_C',
	'CELL_OT_ALARM_RELEASE_C',
	'CELL_OT_ALARM_DELAY_S',
	'CELL_OT_ALARM_RELEASE_DELAY_S',
	'HEAT_CELL_ON_C',
	'HEAT_CELL_OFF_C',
	'HEAT_FILM_PROTECT_C',
	'HEAT_FILM_PROTECT_RELEASE_C',
	'HEAT_ON_DELAY_S',
	'HEAT_OFF_DELAY_S',
	'POLE_TEMP_PROTECT_C',
	'POLE_TEMP_PROTECT_RELEASE_C',
]

const singleItems = computed(() => mkItems(filterParamEntries(SINGLE_KEYS)))
const voltageItems = computed(() => mkItems(filterParamEntries(VOLTAGE_KEYS)))
const currentItems = computed(() => mkItems(filterParamEntries(CURRENT_KEYS)))
const temperatureItems = computed(() => mkItems(filterParamEntries(TEMP_KEYS)))
const hasSingleItems = computed(() => singleItems.value.length > 0)
const hasVoltageItems = computed(() => voltageItems.value.length > 0)
const hasCurrentItems = computed(() => currentItems.value.length > 0)
const hasTemperatureItems = computed(() => temperatureItems.value.length > 0)
const visibleBasicSectionCount = computed(
	() =>
		Number(hasSingleItems.value) +
		Number(hasVoltageItems.value) +
		Number(hasCurrentItems.value) +
		Number(hasTemperatureItems.value)
)
const hasBasicSections = computed(() => visibleBasicSectionCount.value > 0)

const OTHER_KEYS = listParamsByCategory(PARAM_CATEGORIES.OTHER)
const NUMBERING_KEYS = listParamsByCategory(PARAM_CATEGORIES.STRING)
const SYSTEM_KEYS = listParamsByCategory(PARAM_CATEGORIES.SYSTEM).filter((key) => key !== BMS_PARAM.FUNCTION_CONFIG)
const SYSTEM_LOAD_KEYS = [...SYSTEM_KEYS, BMS_PARAM.FUNCTION_CONFIG]
const SOH_READONLY_PERMISSION_KEY = '10d'
const VIRTUAL_CAPACITY_PERMISSION_KEY = '627'
const VIRTUAL_CAPACITY_ADDRESS = 0x0627
const VIRTUAL_CAPACITY_TARGET_ADDRESS = 0x00
const VIRTUAL_CAPACITY_SCALE_AH = 1000

const otherItems = computed(() => mkItems(filterParamEntries(OTHER_KEYS)))
const numberingItems = computed(() => mkItems(filterParamEntries(NUMBERING_KEYS)))
const systemItems = computed(() => mkItems(filterParamEntries(SYSTEM_KEYS)))
const canAccessReadonlySoh = computed(() => canAccessPermissionKey(SOH_READONLY_PERMISSION_KEY))
const canAccessVirtualCapacity = computed(() => canAccessPermissionKey(VIRTUAL_CAPACITY_PERMISSION_KEY))
const sohReadonlyText = computed(() => {
	const realtime = props.status?.energy?.sohPct
	const fallback = props.battery?.soh
	const raw = typeof realtime === 'number' && Number.isFinite(realtime) ? realtime : fallback
	const n = typeof raw === 'number' ? raw : Number(raw)
	if (!Number.isFinite(n)) return '-'
	return `${formatDisplayNumber(Math.max(0, Math.min(100, n)), 0)}%`
})
const hasOtherItems = computed(() => otherItems.value.length > 0)
const hasAdvancedConfigItems = computed(() => canAccessReadonlySoh.value || canAccessVirtualCapacity.value || hasOtherItems.value)
const hasNumberingItems = computed(() => numberingItems.value.length > 0)
const hasSystemItems = computed(() => systemItems.value.length > 0)
const functionConfigFlags = computed(() => parseFunctionConfigFlags(paramValues[BMS_PARAM.FUNCTION_CONFIG]))
const functionConfigLabelOf = (key: FunctionConfigFlagKey) =>
	(t(`deviceDetail.params.functionConfig.${key}`) as string) || key
const functionConfigStatusOf = (key: FunctionConfigFlagKey, enabled: boolean) => {
	const statusKey =
		key === 'chargeAllowed' || key === 'dischargeAllowed'
			? enabled
				? 'allowed'
				: 'forbidden'
			: enabled
				? 'enabled'
				: 'disabled'
	return t(`deviceDetail.params.functionConfig.${statusKey}`) as string
}
const functionControlItems = computed<FunctionControlItem[]>(() =>
	FUNCTION_CONFIG_ITEMS.filter((item) => canAccessFunctionControl(item.key)).map((item) => ({
		...item,
		label: functionConfigLabelOf(item.key),
		enabled: functionConfigFlags.value[item.key],
		statusText: functionConfigStatusOf(item.key, functionConfigFlags.value[item.key]),
	}))
)
const hasFunctionControlItems = computed(() => functionControlItems.value.length > 0)
const hasSystemSection = computed(() => hasSystemItems.value || hasFunctionControlItems.value)

const FACTORY_ACTIONS = [
	{ key: 'enterTestMode', raw: 0x00000400, confirm: true },
	{ key: 'exitTestMode', raw: 0x00000800, confirm: true },
	{ key: 'balanceAllOn', raw: 0x00001000, confirm: true },
	{ key: 'balanceAllOff', raw: 0x00002000, confirm: true },
	{ key: 'function1On', raw: 0x00400000, confirm: true },
	{ key: 'function1Off', raw: 0x00800000, confirm: true },
	{ key: 'function2On', raw: 0x01000000, confirm: true },
	{ key: 'function2Off', raw: 0x02000000, confirm: true },
	{ key: 'function3On', raw: 0x04000000, confirm: true },
	{ key: 'function3Off', raw: 0x08000000, confirm: true },
	{ key: 'function4On', raw: 0x10000000, confirm: true },
	{ key: 'function4Off', raw: 0x20000000, confirm: true },
	{ key: 'eraseCurrentParams', raw: 0x00010000, confirm: true },
	{ key: 'eraseHistoryRecords', raw: 0x00020000, confirm: true },
	{ key: 'eraseCycleCount', raw: 0x00040000, confirm: true },
	{ key: 'clearProtectionStatus', raw: 0x00080000, confirm: true },
	{ key: 'resetProtectionBoard', raw: 0x00200000, confirm: true },
	{ key: 'mcuProtectionOn', raw: 0x00004000, confirm: true },
	{ key: 'mcuProtectionOff', raw: 0x00008000, confirm: true },
	{ key: 'manualChargeDischargeOn', raw: 0x00000100, confirm: true },
	{ key: 'manualChargeDischargeOff', raw: 0x00000200, confirm: true },
	{ key: 'manualHeatingOn', raw: 0x00000040, confirm: true },
	{ key: 'manualHeatingOff', raw: 0x00000080, confirm: true },
	{ key: 'gpsPowerOn', raw: 0x00000010, confirm: true },
	{ key: 'gpsPowerOff', raw: 0x00000020, confirm: true },
	{ key: 'sleep', raw: 0x00000004, confirm: true },
	{ key: 'powerOff', raw: 0x00000001, confirm: true },
]

const factoryItems = computed(() =>
	FACTORY_ACTIONS.filter((item) => canAccessFactoryAction(item.key)).map((item) => ({
		...item,
		label: (t(`deviceDetail.params.factory.${item.key}`) as string) || item.key,
	}))
)
const hasFactoryItems = computed(() => factoryItems.value.length > 0)
const hasAdvancedSections = computed(
	() => hasAdvancedConfigItems.value || hasNumberingItems.value || hasSystemSection.value || hasFactoryItems.value
)

const editPopup = reactive({
	show: false,
	title: '',
	key: '',
	unit: '',
	input: '',
	valueType: 'u16',
	inputType: 'digit' as 'digit' | 'text',
})

const otaState = reactive({
	show: false,
	progress: 0,
	message: '',
	running: false,
})

const advancedPopup = reactive({
	show: false,
})

const batteryTypePicker = reactive({
	show: false,
	title: '',
	key: BMS_PARAM.BATTERY_TYPE,
	index: 0,
})

const meterPackageSummary = computed(() => selectedMeterPackage.value?.name || (t('deviceDetail.params.meterUpgradeNoSelection') as string))
const meterPackageDescription = computed(
	() => selectedMeterPackage.value?.description || (t('deviceDetail.params.meterUpgradeDescEmpty') as string)
)

const windowInfo = getWindowInfo()
const safeBottom = Number(windowInfo?.safeAreaInsets?.bottom || 0)
const rpx2px = Number(windowInfo?.windowWidth || windowInfo?.screenWidth || 375) / 750
const windowHeight = Number(windowInfo?.windowHeight || windowInfo?.screenHeight || 667)
const advancedBottomGap = Math.round(176 * rpx2px + safeBottom)
const meterPackageBodyHeightPx = Math.max(220, Math.floor(windowHeight * 0.5))
const meterUpgradeButtonStyle = {
	marginTop: '24rpx',
	width: '100%',
	height: '76rpx',
	borderRadius: '16rpx',
	fontSize: '28rpx',
	fontWeight: 600,
}

const otaMessageText = computed(
	() => otaState.message || (t('deviceDetail.params.otaProgress', { p: otaState.progress }) as string)
)

const closeOtaPopup = () => {
	if (otaState.running) {
		uni.showToast({ title: t('deviceDetail.toast.otaRunning') as string, icon: 'none' })
		otaState.show = true
		return
	}
	otaState.show = false
}

const closeEditPopup = () => {
	editPopup.show = false
	applyPollingState()
}

const closeAdvanced = () => {
	advancedPopup.show = false
	applyPollingState()
}

const normalizeMeterPackage = (item: AppBatteryMeterOtaPackage): MeterOtaPackage | null => {
	const id = String(item?.id || '').trim()
	const name = String(item?.name || '').trim()
	const packageUrl = String(item?.package_url || '').trim()
	if (!id || !name || !packageUrl) return null
	return {
		id,
		name,
		description: String(item?.description || '').trim(),
		packageUrl,
	}
}

const extractMeterPackagePayload = (rsp: any): AppBatteryMeterOtaPackage[] => {
	if (Array.isArray(rsp?.data)) return rsp.data
	if (Array.isArray(rsp?.data?.list)) return rsp.data.list
	if (Array.isArray(rsp?.list)) return rsp.list
	return []
}

const loadMeterPackages = async () => {
	if (meterPackageLoading.value) return
	meterPackageLoading.value = true
	appendMeterOtaDebug('info', 'meter-ota', 'fetch meter packages start', {
		baseUrl: resolveBaseUrl(),
		tenantId: String(uni.getStorageSync('tenant_id') || ''),
	})
	try {
		const rsp = await getAppBatteryMeterOtaPackages()
		const list = extractMeterPackagePayload(rsp)
		meterPackageList.value = list
			.map((item) => normalizeMeterPackage(item))
			.filter((item): item is MeterOtaPackage => !!item)
		console.log('[meter-ota] fetched packages', {
			baseUrl: resolveBaseUrl(),
			tenantId: String(uni.getStorageSync('tenant_id') || ''),
			code: rsp?.code,
			message: rsp?.message,
			rawDataType: Array.isArray(rsp?.data) ? 'array' : typeof rsp?.data,
			rawDataKeys: rsp?.data && typeof rsp.data === 'object' && !Array.isArray(rsp.data) ? Object.keys(rsp.data) : [],
			rawCount: list.length,
			usableCount: meterPackageList.value.length,
			items: meterPackageList.value.map((item) => ({ id: item.id, name: item.name })),
			rawResponse: rsp,
		})
		appendMeterOtaDebug('info', 'meter-ota', 'fetch meter packages done', {
			code: rsp?.code,
			message: rsp?.message,
			rawCount: list.length,
			usableCount: meterPackageList.value.length,
			items: meterPackageList.value.map((item) => ({ id: item.id, name: item.name })),
		})
		if (selectedMeterPackageId.value && !meterPackageList.value.some((item) => item.id === selectedMeterPackageId.value)) {
			selectedMeterPackageId.value = ''
		}
	} catch (e) {
		meterPackageList.value = []
		console.error('[meter-ota] fetch packages failed', e)
		appendMeterOtaDebug('error', 'meter-ota', 'fetch meter packages failed', formatDebugError(e))
		uni.showToast({ title: t('deviceDetail.toast.meterPackageLoadFailed') as string, icon: 'none' })
	} finally {
		meterPackageLoading.value = false
	}
}

const openMeterPackagePopup = async () => {
	meterPackagePopup.show = true
	await loadMeterPackages()
}

const closeMeterPackagePopup = () => {
	meterPackagePopup.show = false
}

const selectMeterPackage = (pkg: MeterOtaPackage) => {
	selectedMeterPackageId.value = pkg.id
	appendMeterOtaDebug('info', 'meter-ota', 'meter firmware selected', {
		id: pkg.id,
		name: pkg.name,
		packageUrl: summarizeUrl(pkg.packageUrl),
		description: pkg.description,
	})
	meterPackagePopup.show = false
}

watch(
	() => props.active,
	() => {
		applyPollingState()
	},
	{ immediate: true }
)

const openEdit = (item: ParamItem) => {
	if (!props.client || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	if (!canAccessParamKey(item.actualKey || item.key)) {
		return
	}
	if (isBatteryTypeKey(item.actualKey || item.key)) {
		applyPollingState()
		openBatteryTypeSelector(item.actualKey || item.key, item.label, item.rawValue)
		return
	}
	editPopup.title = item.label
	editPopup.key = item.actualKey || item.key
	editPopup.unit = item.unit || ''
	editPopup.valueType = item.valueType || 'u16'
	editPopup.inputType = isNegativeTemperatureInput(editPopup.key, editPopup.unit, editPopup.valueType) ? 'text' : 'digit'
	const current = paramValues[item.actualKey || item.key]
	editPopup.input = formatEditableValue(editPopup.key, current)
	editPopup.show = true
	applyPollingState()
}

const openVirtualCapacityEdit = () => {
	if (!canAccessVirtualCapacity.value) return
	if (!props.client || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	editPopup.title = t('deviceDetail.params.virtualCapacityWrite') as string
	editPopup.key = 'VIRTUAL_CAPACITY_AH'
	editPopup.unit = 'Ah'
	editPopup.valueType = 'virtualCapacity'
	editPopup.inputType = 'digit'
	editPopup.input = ''
	editPopup.show = true
	applyPollingState()
}

const writeParamValue = async (key: string, value: string | number) => {
	const c = props.client
	if (!c) return
	await c.writeParam(key, value)
	paramValues[key] = await c.readParam(key)
}

const writeVirtualCapacityAh = async (valueAh: number) => {
	const c = props.client
	if (!c) return
	const raw = Math.round(valueAh * VIRTUAL_CAPACITY_SCALE_AH) >>> 0
	const regs = new Uint16Array([(raw >>> 16) & 0xffff, raw & 0xffff])
	await c.writeRegisters(VIRTUAL_CAPACITY_ADDRESS, regs, { targetAddress: VIRTUAL_CAPACITY_TARGET_ADDRESS })
}

const openBatteryTypeSelector = (key: string, title: string, currentValue: unknown) => {
	const current = typeof currentValue === 'number' ? currentValue : Number(currentValue)
	batteryTypePicker.key = key
	batteryTypePicker.title = title
	batteryTypePicker.index = Math.max(
		0,
		BATTERY_TYPE_OPTIONS.value.findIndex((item) => item.value === current)
	)
	batteryTypePicker.show = true
}

const closeBatteryTypePicker = () => {
	batteryTypePicker.show = false
	applyPollingState()
}

const isNegativeTemperatureInput = (key: string, unit: string, valueType: string) => {
	if (valueType === 'str') return false
	return unit === '℃' || unit === '°C' || key.endsWith('_C')
}

const confirmBatteryTypePicker = async (payload: { value?: Array<{ value: number; text: string }> }) => {
	const selected = payload?.value?.[0]
	if (!selected) {
		closeBatteryTypePicker()
		return
	}
	try {
		await writeParamValue(batteryTypePicker.key, selected.value)
		uni.showToast({
			title: t('deviceDetail.params.batteryTypeUpdated', { title: batteryTypePicker.title }) as string,
			icon: 'none',
		})
	} catch (e) {
		uni.showToast({ title: t('deviceDetail.toast.saveFailed') as string, icon: 'none' })
	} finally {
		closeBatteryTypePicker()
	}
}

const setFunctionControl = async (key: FunctionConfigFlagKey, enabled: boolean) => {
	const c = props.client
	if (!c || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	if (functionConfigFlags.value[key] === enabled) return
	if (!canAccessFunctionControl(key)) {
		uni.showToast({
			title: t('deviceDetail.params.noPermissionFunctionConfig') as string,
			icon: 'none',
		})
		return
	}
	const nextWord = setFunctionConfigFlag(paramValues[BMS_PARAM.FUNCTION_CONFIG], key, enabled)
	try {
		await c.writeParam(BMS_PARAM.FUNCTION_CONFIG, nextWord)
		paramValues[BMS_PARAM.FUNCTION_CONFIG] = await c.readParam(BMS_PARAM.FUNCTION_CONFIG)
		uni.showToast({ title: t('deviceDetail.toast.saved') as string, icon: 'none' })
	} catch (e) {
		uni.showToast({ title: t('deviceDetail.toast.saveFailed') as string, icon: 'none' })
	}
}

const confirmEdit = async () => {
	const c = props.client
	if (!c) return
	const raw = String(editPopup.input || '').trim()
	try {
		if (editPopup.valueType === 'str') {
			await writeParamValue(editPopup.key, raw)
		} else if (editPopup.valueType === 'virtualCapacity') {
			const num = Number(raw)
			if (!raw || !Number.isFinite(num) || num < 0) {
				uni.showToast({ title: t('deviceDetail.toast.invalidInput') as string, icon: 'none' })
				return
			}
			await writeVirtualCapacityAh(num)
		} else {
			const num = Number(raw)
			if (!raw || !Number.isFinite(num)) {
				uni.showToast({ title: t('deviceDetail.toast.invalidInput') as string, icon: 'none' })
				return
			}
			await writeParamValue(editPopup.key, num)
		}
		editPopup.show = false
		uni.showToast({
			title: t(editPopup.valueType === 'virtualCapacity' ? 'deviceDetail.toast.virtualCapacityWritten' : 'deviceDetail.toast.saved') as string,
			icon: 'none',
		})
		applyPollingState()
	} catch (e) {
		editPopup.show = false
		uni.showToast({ title: t('deviceDetail.toast.saveFailed') as string, icon: 'none' })
		try {
			console.error('[params] save failed', e)
		} catch (err) {}
		applyPollingState()
	}
}

const confirmModal = (content: string) =>
	new Promise<boolean>((resolve) => {
		uni.showModal({
			title: (t('common.tip') as string) || '',
			content,
			confirmText: (t('common.confirm') as string) || '',
			cancelText: (t('common.cancel') as string) || '',
			success: (res) => resolve(!!res.confirm),
			fail: () => resolve(false),
		})
	})

const runFactory = async (item: { key: string; raw: number; confirm?: boolean }) => {
	if (!props.client || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	if (!canAccessFactoryAction(item.key)) {
		uni.showToast({
			title: t('deviceDetail.params.noPermissionFactoryCommand') as string,
			icon: 'none',
		})
		return
	}
	if (item.confirm) {
		const ok = await confirmModal((t('deviceDetail.params.factoryConfirm') as string) || '')
		if (!ok) return
	}
	try {
		const hi = (item.raw >>> 16) & 0xffff
		const lo = item.raw & 0xffff
		await props.client.writeRegisters(0x57a, new Uint16Array([hi, lo]))
		uni.showToast({ title: t('deviceDetail.toast.commandSent') as string, icon: 'none' })
	} catch (e) {
		uni.showToast({ title: t('deviceDetail.toast.commandFailed') as string, icon: 'none' })
	}
}

const downloadFirmware = (url: string): Promise<Uint8Array> =>
	new Promise((resolve, reject) => {
		uni.request({
			url,
			method: 'GET',
			responseType: 'arraybuffer',
			success: (res) => {
				const data = res?.data as ArrayBuffer | Uint8Array | string | undefined
				if (!data) return reject(new Error('empty firmware response'))
				if (data instanceof Uint8Array) return resolve(data)
				if (data instanceof ArrayBuffer) return resolve(new Uint8Array(data))
				const text = String(data || '')
				if (!text) return reject(new Error('empty firmware response'))
				const bytes = new Uint8Array(text.length)
				for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff
				return resolve(bytes)
			},
			fail: (err) => reject(err),
		})
	})

const updateOtaStage = (stage: string, progress: number) => {
	otaState.progress = Math.min(100, Math.max(0, Math.round(progress)))
	const msgKey = `deviceDetail.params.otaStage.${stage}`
	otaState.message = (te(msgKey) ? t(msgKey) : t('deviceDetail.params.otaProgress', { p: otaState.progress })) as string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const getRuntimePlatform = () => {
	try {
		const sys = uni.getSystemInfoSync ? uni.getSystemInfoSync() : ({} as any)
		return String((sys as any)?.platform || '').toLowerCase()
	} catch (e) {
		return ''
	}
}

const summarizeUrl = (url: string) => {
	const text = String(url || '').trim()
	if (!text) return ''
	if (text.length <= 96) return text
	return `${text.slice(0, 58)}...${text.slice(-30)}`
}

const formatDebugError = (e: unknown) => {
	const err = e as any
	return {
		name: err?.name,
		code: err?.code,
		errCode: err?.errCode,
		message: err?.message || err?.errMsg || String(e || ''),
		errMsg: err?.errMsg,
	}
}

const isMiniProgramDomainListError = (message: string) => message.toLowerCase().includes('url not in domain list')

const getBleDebugDeviceId = () => {
	try {
		const transport = props.client?.getTransport?.() as any
		return String(transport?.deviceId || '').trim()
	} catch (e) {
		return ''
	}
}

const getMeterOtaDebugHeader = () => ({
	platform: getRuntimePlatform(),
	connType: props.connType,
	meterMac: meterMac.value,
	bleDeviceId: getBleDebugDeviceId(),
	tenantId: String(uni.getStorageSync('tenant_id') || ''),
	baseUrl: resolveBaseUrl(),
	packageId: selectedMeterPackage.value?.id || '',
	packageName: selectedMeterPackage.value?.name || '',
	packageUrl: summarizeUrl(selectedMeterPackage.value?.packageUrl || ''),
	progress: otaState.progress,
	message: otaState.message,
})

const appendMeterOtaDebug = (
	level: OtaDebugLogLevel,
	scope: OtaDebugLogScope,
	message: string,
	data?: unknown
) => {
	if (!developerStore.enabled) return
	appendOtaDebugLog({ level, scope, message, data })
}

const normalizeOtaLoggerArgs = (args: unknown[]) => {
	const first = String(args[0] || '')
	const second = typeof args[1] === 'string' ? String(args[1]) : ''
	const message = second ? `${first} ${second}`.trim() : first || 'ota log'
	const data = args.length > 2 ? args.slice(2) : args[1]
	return { message, data }
}

const shouldAppendMeterBootLog = (message: string, data: unknown) => {
	const record = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {}
	if (message.includes('[boot] packet ack')) {
		const status = Number(record.status ?? 0)
		const requested = Number(record.requested ?? 0)
		const packetIndex = Number(record.packetIndex ?? 0)
		return status !== 0 || packetIndex < 3 || requested % 64 === 0
	}
	if (message.includes('[boot] tx') && String(record.cmd || '').toLowerCase() === '0x53') return false
	if (message.includes('[boot] rx')) {
		const hex = String(record.hex || '').toUpperCase()
		if (hex.length >= 8 && hex.slice(6, 8) === '53') return false
	}
	return true
}

const otaLogger = {
	debug: (...args: unknown[]) => console.log('[ota]', ...args),
	info: (...args: unknown[]) => console.log('[ota]', ...args),
	warn: (...args: unknown[]) => console.warn('[ota]', ...args),
	error: (...args: unknown[]) => console.error('[ota]', ...args),
}

const meterOtaLogger = {
	debug: (...args: unknown[]) => {
		console.log('[ota]', ...args)
		const { message, data } = normalizeOtaLoggerArgs(args)
		if (shouldAppendMeterBootLog(message, data)) appendMeterOtaDebug('debug', 'boot', message, data)
	},
	info: (...args: unknown[]) => {
		console.log('[ota]', ...args)
		const { message, data } = normalizeOtaLoggerArgs(args)
		if (shouldAppendMeterBootLog(message, data)) appendMeterOtaDebug('info', 'boot', message, data)
	},
	warn: (...args: unknown[]) => {
		console.warn('[ota]', ...args)
		const { message, data } = normalizeOtaLoggerArgs(args)
		if (shouldAppendMeterBootLog(message, data)) appendMeterOtaDebug('warn', 'boot', message, data)
	},
	error: (...args: unknown[]) => {
		console.error('[ota]', ...args)
		const { message, data } = normalizeOtaLoggerArgs(args)
		if (shouldAppendMeterBootLog(message, data)) appendMeterOtaDebug('error', 'boot', message, data)
	},
}

const toggleMeterOtaDebug = () => {
	meterOtaDebugExpanded.value = !meterOtaDebugExpanded.value
}

const copyMeterOtaDebugLog = async () => {
	try {
		await copyOtaDebugLogs(getMeterOtaDebugHeader())
		uni.showToast({ title: t('deviceDetail.toast.meterOtaDebugCopied') as string, icon: 'none' })
	} catch (e) {
		uni.showToast({ title: t('deviceDetail.toast.meterOtaDebugCopyFailed') as string, icon: 'none' })
	}
}

const clearMeterOtaDebugLog = () => {
	resetOtaDebugLog()
	uni.showToast({ title: t('deviceDetail.toast.meterOtaDebugCleared') as string, icon: 'none' })
}

const syncOtaState = (patch: Partial<DeviceOtaCheckState>) => {
	emit('ota-state-change', patch)
}

const applyOtaCheckResult = (data: Record<string, unknown> | null, version: string) => {
	const payload = data || {}
	syncOtaState({
		checking: false,
		checked: true,
		needUpgrade: !!payload.need_upgrade,
		targetVersion: String(payload.target_version || payload.version || '').trim(),
		firmwareUrl: String(payload.firmware_url || payload.package_url || '').trim(),
		lastCheckedVersion: version,
		errorMessage: '',
	})
}

type BootOtaRunOptions = {
	queryTargetAddress?: number
	skipEnterBoot?: boolean
	prepareBaudRate?: number
	bootPacketTimeoutMs?: number
	finalizeTimeoutMs?: number
	finalizeAssumeSuccessOnTimeout?: boolean
	terminalPacketWriteErrorAsComplete?: boolean
	finalizeDelayMs?: number
	requireFinalPacketAck?: boolean
	finalizeBurstIntervalsMs?: number[]
	forceWriteWithResponse?: boolean
	minFrameIntervalMs?: number
	packetDelayMs?: number
	pageBoundaryDelayMs?: number
	adaptiveSlowdownOnPacketTimeout?: boolean
	adaptivePacketDelayMs?: number
	adaptivePageBoundaryDelayMs?: number
	logger?: typeof otaLogger
}

const getBleBootOtaRuntimeOptions = ({
	isMeterUpgrade,
	logger,
}: {
	isMeterUpgrade: boolean
	logger?: typeof otaLogger
}): BootOtaRunOptions => {
	const runtimePlatform = getRuntimePlatform()
	const isBluetooth = props.connType === 'bluetooth'
	const isMqtt = props.connType === 'mqtt'
	const isAndroid = runtimePlatform === 'android'
	const isIos = runtimePlatform === 'ios'
	const shouldRelaxBleFinalize = isBluetooth && (isAndroid || isIos)
	if (isMeterUpgrade) {
		return {
			finalizeDelayMs: 2000,
			finalizeTimeoutMs: shouldRelaxBleFinalize ? 12000 : undefined,
			finalizeAssumeSuccessOnTimeout: false,
			terminalPacketWriteErrorAsComplete: false,
			requireFinalPacketAck: true,
			finalizeBurstIntervalsMs: [300, 600, 900],
			forceWriteWithResponse: isAndroid,
			minFrameIntervalMs: isAndroid ? 100 : undefined,
			packetDelayMs: 0,
			pageBoundaryDelayMs: isAndroid ? 300 : undefined,
			adaptiveSlowdownOnPacketTimeout: isAndroid,
			adaptivePacketDelayMs: 100,
			adaptivePageBoundaryDelayMs: 1500,
			logger,
		}
	}
	if (isMqtt) {
		return {
			finalizeDelayMs: 1500,
			finalizeTimeoutMs: 20000,
			finalizeAssumeSuccessOnTimeout: false,
			terminalPacketWriteErrorAsComplete: false,
			requireFinalPacketAck: true,
			minFrameIntervalMs: 120,
			packetDelayMs: 80,
			pageBoundaryDelayMs: 500,
			adaptiveSlowdownOnPacketTimeout: true,
			adaptivePacketDelayMs: 180,
			adaptivePageBoundaryDelayMs: 1200,
			logger,
		}
	}
	return {
		finalizeTimeoutMs: shouldRelaxBleFinalize ? 6000 : undefined,
		finalizeAssumeSuccessOnTimeout: false,
		terminalPacketWriteErrorAsComplete: false,
		requireFinalPacketAck: true,
		finalizeBurstIntervalsMs: shouldRelaxBleFinalize ? [300, 600, 900] : undefined,
		forceWriteWithResponse: isMeterUpgrade && isAndroid,
		minFrameIntervalMs: isMeterUpgrade && isAndroid ? 220 : undefined,
		packetDelayMs: isMeterUpgrade && isAndroid ? 100 : undefined,
		pageBoundaryDelayMs: isMeterUpgrade && isAndroid ? 1500 : undefined,
		logger,
	}
}

const runBootOtaUpgrade = async (firmware: Uint8Array, targetAddress: number, options?: BootOtaRunOptions) => {
	if (!props.client) throw new Error('client not ready')
	const { sourceAddress } = props.client.getAddresses()
	const rawTransport = props.client.getTransport()
	const transportAny = rawTransport as any
	const prevMinFrameIntervalMs =
		transportAny && typeof transportAny.minFrameIntervalMs === 'number' ? transportAny.minFrameIntervalMs : undefined
	if (options?.minFrameIntervalMs && transportAny && typeof transportAny.minFrameIntervalMs === 'number') {
		transportAny.minFrameIntervalMs = Math.max(transportAny.minFrameIntervalMs || 0, options.minFrameIntervalMs)
	}
	const otaTransport = {
		request: (frameBytes: Uint8Array, overrideOptions?: { timeoutMs?: number; suppressTimeoutLog?: boolean }) => {
			const t = transportAny
			if (typeof t?.request !== 'function') throw new Error('transport not ready')
			const cmd = frameBytes[3] & 0xff
			const timeoutMs =
				cmd === 0x50 ? 3000 : cmd === 0x53 ? options?.bootPacketTimeoutMs ?? 12000 : cmd === 0x54 ? options?.finalizeTimeoutMs ?? 12000 : 12000
			const requestOptions = {
				timeoutMs: overrideOptions?.timeoutMs ?? timeoutMs,
				suppressTimeoutLog:
					!!overrideOptions?.suppressTimeoutLog || (cmd === 0x54 && !!options?.finalizeAssumeSuccessOnTimeout),
			}
			if (options?.forceWriteWithResponse && cmd === 0x53 && typeof t?.requestWithResponse === 'function') {
				return t.requestWithResponse(frameBytes, requestOptions)
			}
			return t.request(frameBytes, requestOptions)
		},
		writeFrame: (frameBytes: Uint8Array, overrideOptions?: { writeWithResponse?: boolean }) => {
			const t = transportAny
			if (typeof t?.writeFrame !== 'function') throw new Error('transport raw write not ready')
			return t.writeFrame(frameBytes, overrideOptions)
		},
	}
	try {
		await bootOtaUpgrade({
			transport: otaTransport,
			firmware,
			targetAddress,
			queryTargetAddress: options?.queryTargetAddress ?? targetAddress,
			sourceAddress,
			skipEnterBoot: options?.skipEnterBoot,
			prepareBaudRate: options?.prepareBaudRate,
			packetDelayMs: options?.packetDelayMs,
			pageBoundaryDelayMs: options?.pageBoundaryDelayMs,
			adaptiveSlowdownOnPacketTimeout: options?.adaptiveSlowdownOnPacketTimeout,
			adaptivePacketDelayMs: options?.adaptivePacketDelayMs,
			adaptivePageBoundaryDelayMs: options?.adaptivePageBoundaryDelayMs,
			finalizeDelayMs: options?.finalizeDelayMs,
			finalizeTimeoutMs: options?.finalizeTimeoutMs,
			finalizeAssumeSuccessOnTimeout: options?.finalizeAssumeSuccessOnTimeout,
			terminalPacketWriteErrorAsComplete: options?.terminalPacketWriteErrorAsComplete,
			requireFinalPacketAck: options?.requireFinalPacketAck,
			finalizeBurstIntervalsMs: options?.finalizeBurstIntervalsMs,
			logger: options?.logger || otaLogger,
			onProgress: (p) => {
				if (options?.logger) {
					const packetIndex = Number(p.packetIndex ?? -1)
					if (p.stage !== 'transfer' || packetIndex < 3 || (packetIndex + 1) % 64 === 0) {
						appendMeterOtaDebug('info', 'meter-ota', 'ota progress', p)
					}
				}
				if (p.stage === 'transfer' && p.packetTotal) {
					const rate = Math.min(1, Math.max(0, ((p.packetIndex ?? 0) + 1) / p.packetTotal))
					updateOtaStage('transfer', 10 + Math.round(rate * 85))
					return
				}
				if (p.stage === 'finalize') {
					updateOtaStage('finalize', 100)
					return
				}
				if (p.stage === 'enter') updateOtaStage('enter', 6)
				if (p.stage === 'prepare') updateOtaStage('prepare', 10)
				if (p.stage === 'query') updateOtaStage('checking', 2)
			},
		})
	} finally {
		if (prevMinFrameIntervalMs != null && transportAny && typeof transportAny.minFrameIntervalMs === 'number') {
			transportAny.minFrameIntervalMs = prevMinFrameIntervalMs
		}
	}
}

const startBmsOta = async () => {
	const BOOT_TARGET_BMS = 0x01
	const BOOT_TARGET_METER = 0xfc
	if (props.allowOta === false) {
		uni.showToast({ title: t('deviceDetail.toast.openFailed') as string, icon: 'none' })
		return
	}
	if (!props.client || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}

	otaState.show = true
	otaState.running = true
	updateOtaStage('checking', 0)

	try {
		props.onPausePolling && props.onPausePolling()
		await delay(120)
		const modelName = String(props.status?.identity?.hardwareModel || props.battery?.battery_model_name || '').trim()
		const versionText = String(props.status?.meta?.softwareVersion || props.battery?.fw_version || '').trim()
		let data: Record<string, unknown> = {}
		const sharedOta = props.otaInfo || null
		const canUseSharedNoUpgrade = !!sharedOta?.checked && !props.otaNeedUpgrade
		const canUseSharedUpgrade = !!props.otaNeedUpgrade && !!sharedOta?.firmwareUrl

		if (canUseSharedNoUpgrade) {
			data = {
				need_upgrade: false,
			}
		} else if (canUseSharedUpgrade) {
			data = {
				need_upgrade: true,
				target_version: sharedOta?.targetVersion || '',
				version: sharedOta?.targetVersion || '',
				firmware_url: sharedOta?.firmwareUrl || '',
			}
		} else {
			syncOtaState({
				checking: true,
				errorMessage: '',
			})
			const deviceId = String(props.battery?.device_id || '').trim()
			const rsp = await appBatteryOtaCheck({
				device_id: deviceId || undefined,
				model: modelName || undefined,
				version: versionText || undefined,
				battery_model_id: String(props.battery?.battery_model_id || '').trim() || undefined,
				batch_number: String(props.battery?.batch_number || '').trim() || undefined,
				item_uuid: String(props.battery?.item_uuid || '').trim() || undefined,
			})
			if (!rsp || rsp.code !== 200) throw new Error('ota check failed')
			data = (rsp.data || {}) as Record<string, unknown>
			applyOtaCheckResult(data, versionText)
		}

		if (!data.need_upgrade) {
			otaState.show = false
			uni.showToast({ title: t('deviceDetail.toast.otaLatest') as string, icon: 'none' })
			return
		}

		const targetVersionText = String(data.target_version || data.version || '').trim()
		let confirmText = (t('deviceDetail.params.otaConfirm', { v: targetVersionText || '-' }) as string) || ''
		if (confirmText.includes('{v}')) {
			confirmText = confirmText.replace(/\{v\}/g, targetVersionText || '-')
		}
		const ok = await confirmModal(confirmText)
		if (!ok) {
			otaState.show = false
			return
		}

		const firmwareUrl = String(data.firmware_url || data.package_url || '').trim()
		if (!firmwareUrl) throw new Error('firmware url missing')

		updateOtaStage('downloading', 5)
		const firmware = await downloadFirmware(firmwareUrl)
		updateOtaStage('prepare', 10)

		const macRaw = String(props.battery?.ble_mac || props.status?.identity?.bluetoothMac || '').trim()
		const isGaugeDevice = isMeterMac(macRaw)
		const otaTargetAddress = isGaugeDevice ? BOOT_TARGET_METER : BOOT_TARGET_BMS
		await runBootOtaUpgrade(firmware, otaTargetAddress, getBleBootOtaRuntimeOptions({ isMeterUpgrade: isGaugeDevice }))

		updateOtaStage('success', 100)
		syncOtaState({
			checking: false,
			checked: false,
			needUpgrade: false,
			targetVersion: '',
			firmwareUrl: '',
			lastCheckedVersion: '',
			errorMessage: '',
		})
		uni.showToast({ title: t('deviceDetail.toast.otaSuccess') as string, icon: 'none' })
	} catch (e) {
		syncOtaState({
			checking: false,
			errorMessage: e instanceof Error ? e.message : String(e || ''),
		})
		updateOtaStage('failed', otaState.progress || 0)
		const errMessage = (e as Error)?.message || String(e || '')
		if (errMessage === 'boot_packet0_no_ack' || errMessage === 'boot_firmware_hardware_mismatch') {
			const mismatchText = t('deviceDetail.toast.otaHardwareMismatch') as string
			otaState.message = mismatchText
			uni.showToast({ title: mismatchText, icon: 'none' })
		} else if (errMessage === 'boot_firmware_size_mismatch') {
			const sizeMismatchText = t('deviceDetail.toast.otaFirmwareSizeMismatch') as string
			otaState.message = sizeMismatchText
			uni.showToast({ title: sizeMismatchText, icon: 'none' })
		} else if (errMessage.startsWith('boot_transfer_incomplete')) {
			const incompleteText = t('deviceDetail.toast.otaTransferIncomplete') as string
			otaState.message = incompleteText
			uni.showToast({ title: incompleteText, icon: 'none' })
		} else if (errMessage === 'Boot finalize timeout' || errMessage.startsWith('Boot finalize failed')) {
			const finalizeText = t('deviceDetail.toast.otaFinalizeNoAck') as string
			otaState.message = finalizeText
			uni.showToast({ title: finalizeText, icon: 'none' })
		} else if (isMiniProgramDomainListError(errMessage)) {
			const domainText = t('deviceDetail.toast.otaDomainNotConfigured') as string
			otaState.message = domainText
			uni.showToast({ title: domainText, icon: 'none' })
		} else {
			uni.showToast({ title: t('deviceDetail.toast.otaFailed') as string, icon: 'none' })
		}
	} finally {
		otaState.running = false
		applyPollingState()
	}
}

const startMeterOta = async () => {
	const BOOT_TARGET_METER = 0xfc
	if (developerStore.enabled) {
		resetOtaDebugLog(getMeterOtaDebugHeader())
	}
	if (!showMeterUpgradeCard.value) {
		appendMeterOtaDebug('warn', 'meter-ota', 'meter upgrade card unavailable', getMeterOtaDebugHeader())
		uni.showToast({ title: t('deviceDetail.toast.openFailed') as string, icon: 'none' })
		return
	}
	if (!props.client || props.connType === 'offline') {
		appendMeterOtaDebug('warn', 'ble', 'meter ota blocked: no ble connection', getMeterOtaDebugHeader())
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	if (!selectedMeterPackage.value) {
		appendMeterOtaDebug('warn', 'meter-ota', 'meter ota blocked: no firmware selected', getMeterOtaDebugHeader())
		uni.showToast({ title: t('deviceDetail.params.meterUpgradeSelectFirst') as string, icon: 'none' })
		return
	}

	try {
		appendMeterOtaDebug('info', 'meter-ota', 'meter ota confirm start', getMeterOtaDebugHeader())
		const confirmTemplate = (t('deviceDetail.params.meterUpgradeConfirm') as string) || ''
		const confirmText = confirmTemplate.replace('{name}', selectedMeterPackage.value.name)
		const ok = await confirmModal(confirmText)
		if (!ok) {
			appendMeterOtaDebug('info', 'meter-ota', 'meter ota canceled by user')
			return
		}

		otaState.show = true
		otaState.running = true
		updateOtaStage('downloading', 5)
		props.onPausePolling && props.onPausePolling()
		await delay(120)
		appendMeterOtaDebug('info', 'download', 'firmware download start', {
			packageId: selectedMeterPackage.value.id,
			name: selectedMeterPackage.value.name,
			url: summarizeUrl(selectedMeterPackage.value.packageUrl),
		})
		const firmware = await downloadFirmware(selectedMeterPackage.value.packageUrl)
		appendMeterOtaDebug('info', 'download', 'firmware download done', {
			size: firmware.length,
		})
		updateOtaStage('prepare', 10)
		const meterRuntimeOptions = getBleBootOtaRuntimeOptions({ isMeterUpgrade: true, logger: meterOtaLogger })
		appendMeterOtaDebug('info', 'boot', 'boot ota start', {
			targetAddress: '0xFC',
			queryTargetAddress: '0x00',
			skipEnterBoot: true,
			prepareBaudRate: 9600,
			bootPacketTimeoutMs: 45000,
			finalizeDelayMs: meterRuntimeOptions.finalizeDelayMs,
			finalizeTimeoutMs: meterRuntimeOptions.finalizeTimeoutMs,
			finalizeAssumeSuccessOnTimeout: !!meterRuntimeOptions.finalizeAssumeSuccessOnTimeout,
			forceWriteWithResponse: !!meterRuntimeOptions.forceWriteWithResponse,
			terminalPacketWriteErrorAsComplete: !!meterRuntimeOptions.terminalPacketWriteErrorAsComplete,
			requireFinalPacketAck: !!meterRuntimeOptions.requireFinalPacketAck,
			finalizeBurstIntervalsMs: meterRuntimeOptions.finalizeBurstIntervalsMs,
			minFrameIntervalMs: meterRuntimeOptions.minFrameIntervalMs,
			packetDelayMs: meterRuntimeOptions.packetDelayMs,
			pageBoundaryDelayMs: meterRuntimeOptions.pageBoundaryDelayMs,
			adaptiveSlowdownOnPacketTimeout: !!meterRuntimeOptions.adaptiveSlowdownOnPacketTimeout,
			adaptivePacketDelayMs: meterRuntimeOptions.adaptivePacketDelayMs,
			adaptivePageBoundaryDelayMs: meterRuntimeOptions.adaptivePageBoundaryDelayMs,
			firmwareSize: firmware.length,
		})
		await runBootOtaUpgrade(firmware, BOOT_TARGET_METER, {
			...meterRuntimeOptions,
			queryTargetAddress: 0x00,
			skipEnterBoot: true,
			prepareBaudRate: 9600,
			bootPacketTimeoutMs: 45000,
		})
		updateOtaStage('success', 100)
		appendMeterOtaDebug('info', 'meter-ota', 'meter ota success', {
			progress: otaState.progress,
			message: otaState.message,
		})
		uni.showToast({ title: t('deviceDetail.toast.otaSuccess') as string, icon: 'none' })
	} catch (e) {
		updateOtaStage('failed', otaState.progress || 0)
		const errMessage = (e as Error)?.message || String(e || '')
		appendMeterOtaDebug('error', 'meter-ota', 'meter ota failed', {
			error: formatDebugError(e),
			progress: otaState.progress,
			message: otaState.message,
		})
		if (errMessage === 'boot_packet0_no_ack' || errMessage === 'boot_firmware_hardware_mismatch') {
			const mismatchText = t('deviceDetail.toast.otaHardwareMismatch') as string
			otaState.message = mismatchText
			uni.showToast({ title: mismatchText, icon: 'none' })
		} else if (errMessage === 'boot_firmware_size_mismatch') {
			const sizeMismatchText = t('deviceDetail.toast.otaFirmwareSizeMismatch') as string
			otaState.message = sizeMismatchText
			uni.showToast({ title: sizeMismatchText, icon: 'none' })
		} else if (errMessage.startsWith('boot_transfer_incomplete')) {
			const incompleteText = t('deviceDetail.toast.otaTransferIncomplete') as string
			otaState.message = incompleteText
			uni.showToast({ title: incompleteText, icon: 'none' })
		} else if (errMessage === 'Boot finalize timeout' || errMessage.startsWith('Boot finalize failed')) {
			const finalizeText = t('deviceDetail.toast.otaFinalizeNoAck') as string
			otaState.message = finalizeText
			uni.showToast({ title: finalizeText, icon: 'none' })
		} else if (isMiniProgramDomainListError(errMessage)) {
			const domainText = t('deviceDetail.toast.otaDomainNotConfigured') as string
			otaState.message = domainText
			uni.showToast({ title: domainText, icon: 'none' })
		} else {
			uni.showToast({ title: t('deviceDetail.toast.otaFailed') as string, icon: 'none' })
		}
	} finally {
		otaState.running = false
		applyPollingState()
	}
}

const openOta = () => {
	if (otaState.running) {
		otaState.show = true
		return
	}
	startBmsOta()
}

const openAdvanced = () => {
	try {
		advancedPopup.show = true
		setTimeout(() => {
			loadKeysCached('other', OTHER_KEYS)
			loadKeysCached('numbering', NUMBERING_KEYS)
			loadKeysCached('system', SYSTEM_LOAD_KEYS)
		}, 50)
		applyPollingState()
	} catch (e) {
		uni.showToast({ title: t('deviceDetail.toast.openFailed') as string, icon: 'none' })
	}
}

const loadKeys = async (keys: string[]) => {
	const c = props.client
	if (!c) return
	const allowedKeys = keys.filter((k) => canAccessParamKey(k))
	if (!allowedKeys.length) return
	const values = await c.readParamsByKeys(allowedKeys)
	for (const k of allowedKeys) {
		paramValues[k] = Object.prototype.hasOwnProperty.call(values, k) ? values[k] : null
	}
}

watch(
	() => [props.client, props.connType, props.active],
	([clientRef, connTypeRef, activeRef]) => {
		if (clientRef && connTypeRef !== 'offline' && activeRef !== false) {
			void loadKeys([BMS_PARAM.FUNCTION_CONFIG])
		}
	},
	{ immediate: true }
)

const loadKeysCached = async (section: keyof typeof loaded, keys: string[]) => {
	if (loaded[section]) return
	await loadKeys(keys)
	loaded[section] = true
}

const loadSection = (k: keyof typeof opened) => {
	if (!props.client || props.connType === 'offline') return
	if (k === 'single') return loadKeysCached('single', SINGLE_KEYS)
	if (k === 'voltage') return loadKeysCached('voltage', VOLTAGE_KEYS)
	if (k === 'current') return loadKeysCached('current', CURRENT_KEYS)
	if (k === 'temperature') return loadKeysCached('temperature', TEMP_KEYS.map((x) => x.actualKey))
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

.meter-upgrade {
	padding: 24rpx;
	display: flex;
	flex-direction: column;
}

.meter-upgrade__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.meter-upgrade__selector {
	margin-top: 20rpx;
	padding: 20rpx;
	border-radius: 18rpx;
	background: #f7f8fa;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.meter-upgrade__selector-main {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	min-width: 0;
}

.meter-upgrade__selector-label {
	font-size: 24rpx;
	color: #8e95a2;
}

.meter-upgrade__selector-value {
	font-size: 26rpx;
	color: #333333;
	font-weight: 600;
}

.meter-upgrade__desc {
	margin-top: 16rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #8e95a2;
}

.meter-debug {
	padding: 22rpx 24rpx 24rpx;
	background: #fbfcff;
}

.meter-debug__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.meter-debug__title-wrap {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.meter-debug__title {
	font-size: 28rpx;
	font-weight: 700;
	color: #1f2937;
}

.meter-debug__count {
	font-size: 22rpx;
	color: #8e95a2;
}

.meter-debug__actions {
	margin-top: 18rpx;
	display: flex;
	gap: 14rpx;
}

.meter-debug__btn {
	padding: 10rpx 18rpx;
	border-radius: 999rpx;
	background: #0b3bff;
	color: #ffffff;
	font-size: 22rpx;
	font-weight: 600;
}

.meter-debug__btn--ghost {
	background: #eef2ff;
	color: #0b3bff;
}

.meter-debug__btn--hover {
	opacity: 0.82;
}

.meter-debug__body {
	margin-top: 18rpx;
	height: 360rpx;
	padding: 16rpx;
	box-sizing: border-box;
	border-radius: 16rpx;
	background: #111827;
}

.meter-debug__line {
	display: block;
	font-size: 20rpx;
	line-height: 1.55;
	color: #d1d5db;
	font-family: monospace;
	word-break: break-all;
	white-space: pre-wrap;
}

.meter-debug__empty {
	padding: 40rpx 0;
	text-align: center;
	color: #9ca3af;
	font-size: 24rpx;
}

.section--static {
	align-items: flex-start;
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

.action__title-wrap {
	position: relative;
	display: inline-flex;
	align-items: center;
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

.action__meta {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4rpx;
}

.action__value {
	font-size: 24rpx;
	color: #8e95a2;
}

.action__subvalue {
	font-size: 22rpx;
	color: #b0b6c2;
}

.ota-badge {
	position: absolute;
	top: -4rpx;
	right: -14rpx;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: #ff4d4f;
	box-shadow: 0 0 0 3rpx #ffffff;
}

.meter-package-popup {
	background: #ffffff;
	border-radius: 28rpx 28rpx 0 0;
	padding: 28rpx 24rpx 0;
}

.meter-package-popup__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.meter-package-popup__title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f2937;
}

.meter-package-popup__body {
	max-height: 60vh;
	margin-top: 24rpx;
}

.meter-package-popup__empty {
	padding: 40rpx 0 60rpx;
	font-size: 26rpx;
	color: #8e95a2;
	text-align: center;
}

.meter-package-item {
	padding: 22rpx 4rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18rpx;
	border-bottom: 1px solid #f2f3f5;
}

.meter-package-item--selected .meter-package-item__name {
	color: #0b3bff;
}

.meter-package-item__main {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.meter-package-item__name {
	font-size: 28rpx;
	font-weight: 600;
	color: #333333;
}

.meter-package-item__desc {
	font-size: 24rpx;
	line-height: 1.6;
	color: #8e95a2;
}

.section__tips {
	max-width: 340rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: #8e95a2;
	text-align: right;
}

.section-loading {
	width: 30rpx;
	height: 30rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(11, 59, 255, 0.12);
	border-top-color: #0b3bff;
	animation: section-loading-spin 0.8s linear infinite;
	flex-shrink: 0;
}

@keyframes section-loading-spin {
	to {
		transform: rotate(360deg);
	}
}

.divider {
	height: 1px;
	background: #f2f3f5;
}

.list {
	padding-bottom: 10rpx;
}

.list--popup {
	padding-bottom: 0;
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

.function-list--popup {
	padding-bottom: 8rpx;
}

.function-item {
	padding: 18rpx 24rpx;
}

.function-item__main {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.function-item__status {
	font-size: 24rpx;
	color: #8e95a2;
}

.function-item__switch {
	margin-top: 14rpx;
	display: flex;
	justify-content: flex-end;
	align-items: center;
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

.advanced {
	background: #ffffff;
	border-top-left-radius: 28rpx;
	border-top-right-radius: 28rpx;
	padding: 24rpx 24rpx 8rpx;
	box-sizing: border-box;
	max-height: 75vh;
}

.advanced__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.advanced__title {
	font-size: 30rpx;
	font-weight: 700;
	color: #333333;
}

.advanced__close {
	width: 56rpx;
	height: 56rpx;
	border-radius: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f2f3f5;
}

.advanced__close--hover {
	opacity: 0.85;
}

.advanced__body {
	margin-top: 12rpx;
	max-height: 62vh;
}

.advanced__body-spacer {
	flex-shrink: 0;
}

.advanced__section {
	margin-top: 18rpx;
	background: #f7f8fa;
	border-radius: 18rpx;
	padding: 6rpx 0;
}

.advanced__section-title {
	display: block;
	padding: 12rpx 24rpx 6rpx;
	font-size: 24rpx;
	color: #8e95a2;
}
</style>
