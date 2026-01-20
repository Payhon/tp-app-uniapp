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
			<view class="action" hover-class="action--hover" @tap="openAdvanced">
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

		<u-popup :show="editPopup.show" mode="center" @close="closeEditPopup">
			<view class="edit">
				<text class="edit__title">{{ editPopup.title }}</text>
				<view class="edit__input">
					<u-input
						v-model="editPopup.input"
						:placeholder="$t('deviceDetail.params.inputPlaceholder')"
						:type="editPopup.valueType === 'str' ? 'text' : 'number'"
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

		<u-popup :show="otaState.show" mode="center" @close="closeOtaPopup">
			<view class="ota">
				<text class="ota__title">{{ $t('deviceDetail.params.otaUpgrade') }}</text>
				<view class="ota__bar">
					<u-line-progress :percentage="otaState.progress" activeColor="#0B3BFF"></u-line-progress>
				</view>
				<text class="ota__text">{{ otaMessageText }}</text>
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
					<view class="advanced__section">
						<text class="advanced__section-title">{{ $t('deviceDetail.params.advancedConfig') }}</text>
						<view class="list list--popup">
							<view v-for="item in otherItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
								<text class="item__label">{{ item.label }}</text>
								<view class="item__right">
									<text class="item__value">{{ item.valueText }}</text>
									<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
								</view>
							</view>
						</view>
					</view>

					<view class="advanced__section">
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

					<view class="advanced__section">
						<text class="advanced__section-title">{{ $t('deviceDetail.params.systemConfig') }}</text>
						<view class="list list--popup">
							<view v-for="item in systemItems" :key="item.key" class="item" hover-class="item--hover" @tap="openEdit(item)">
								<text class="item__label">{{ item.label }}</text>
								<view class="item__right">
									<text class="item__value">{{ item.valueText }}</text>
									<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
								</view>
							</view>
						</view>
					</view>

					<view class="advanced__section">
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
				</scroll-view>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { appBatteryOtaCheck, type AppBatteryDetail } from '@/service/app-battery'
import type { BmsStatus } from '@/common/lib/bms-protocol/types'
import type { BmsClient } from '@/common/lib/bms-protocol'
import { bootOtaUpgrade } from '@/common/lib/bms-protocol'
import { PARAM_CATEGORIES, PARAM_DEF_BY_KEY, listParamsByCategory } from '@/common/lib/bms-protocol/param-registry'

type ParamItem = {
	key: string
	actualKey?: string
	label: string
	valueText: string
	unit: string
	valueType: string
}

const props = defineProps<{
	battery: AppBatteryDetail | null
	status: BmsStatus | null
	client: BmsClient | null
	connType: 'bluetooth' | 'mqtt' | 'offline'
	active?: boolean
	onPausePolling?: () => void
	onResumePolling?: () => void
}>()

const { t, te } = useI18n()

const opened = reactive({
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

const toggle = (k: keyof typeof opened) => {
	opened[k] = !opened[k]
	if (opened[k]) loadSection(k)
	applyPollingState()
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

const mkItems = (keys: Array<string | { displayKey: string; actualKey: string }>) =>
	keys.map((entry) => {
		const key = typeof entry === 'string' ? entry : entry.displayKey
		const actualKey = typeof entry === 'string' ? entry : entry.actualKey
		const unit = unitOf(actualKey)
		return {
			key,
			actualKey,
			label: labelOf(key),
			unit,
			valueText: formatValue(paramValues[actualKey], unit),
			valueType: PARAM_DEF_BY_KEY[actualKey]?.valueType || 'u16',
		}
	})

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
const TEMP_KEYS = [
	{ displayKey: 'CELL_OVER_TEMP_PROTECT_C', actualKey: 'MOS_OT_PROTECT_C' },
	{ displayKey: 'CELL_OVER_TEMP_RELEASE_C', actualKey: 'MOS_OT_PROTECT_RELEASE_C' },
	{ displayKey: 'CELL_UNDER_TEMP_PROTECT_C', actualKey: 'CHARGE_UT_PROTECT_C' },
	{ displayKey: 'CELL_UNDER_TEMP_RELEASE_C', actualKey: 'CHARGE_UT_PROTECT_RELEASE_C' },
]

const singleItems = computed(() => mkItems(SINGLE_KEYS))
const voltageItems = computed(() => mkItems(VOLTAGE_KEYS))
const currentItems = computed(() => mkItems(CURRENT_KEYS))
const temperatureItems = computed(() => mkItems(TEMP_KEYS))

const OTHER_KEYS = listParamsByCategory(PARAM_CATEGORIES.OTHER)
const NUMBERING_KEYS = listParamsByCategory(PARAM_CATEGORIES.STRING)
const SYSTEM_KEYS = listParamsByCategory(PARAM_CATEGORIES.SYSTEM)

const otherItems = computed(() => mkItems(OTHER_KEYS))
const numberingItems = computed(() => mkItems(NUMBERING_KEYS))
const systemItems = computed(() => mkItems(SYSTEM_KEYS))

const FACTORY_ACTIONS = [
	// 以下 raw 值按协议示例帧整理（0x57A~0x57B，共 32bit），确保与设备端一致
	{ key: 'enterTestMode', raw: 0x00000400, confirm: true },
	{ key: 'exitTestMode', raw: 0x00000800, confirm: true },
	{ key: 'balanceAllOn', raw: 0x00001000, confirm: true },
	{ key: 'balanceAllOff', raw: 0x00002000, confirm: true },
	{ key: 'sleep', raw: 0x00000004, confirm: true },
	{ key: 'powerOff', raw: 0x00000001, confirm: true },
	// 下面按文档 bit 位定义补充（如设备端不支持，可按需移除）
	{ key: 'restoreDefaults', raw: 0x00010000, confirm: true },
	{ key: 'clearHistory', raw: 0x00020000, confirm: true },
	{ key: 'clearCycles', raw: 0x00040000, confirm: true },
	{ key: 'clearProtection', raw: 0x00080000, confirm: true },
]

const factoryItems = computed(() =>
	FACTORY_ACTIONS.map((item) => ({
		...item,
		label: (t(`deviceDetail.params.factory.${item.key}`) as string) || item.key,
	}))
)

const editPopup = reactive({
	show: false,
	title: '',
	key: '',
	unit: '',
	input: '',
	valueType: 'u16',
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

const safeBottom = (() => {
	try {
		const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : ({} as any)
		return info?.safeAreaInsets?.bottom || 0
	} catch (e) {
		return 0
	}
})()

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
	editPopup.title = item.label
	editPopup.key = item.actualKey || item.key
	editPopup.unit = item.unit || ''
	editPopup.valueType = item.valueType || 'u16'
	const current = paramValues[item.actualKey || item.key]
	editPopup.input = current == null ? '' : String(current)
	editPopup.show = true
	applyPollingState()
}

const confirmEdit = async () => {
	const c = props.client
	if (!c) return
	const raw = String(editPopup.input || '').trim()
	try {
		if (editPopup.valueType === 'str') {
			await c.writeParam(editPopup.key, raw)
			paramValues[editPopup.key] = await c.readParam(editPopup.key)
		} else {
			const num = Number(raw)
			if (!raw || !Number.isFinite(num)) {
				uni.showToast({ title: t('deviceDetail.toast.invalidInput') as string, icon: 'none' })
				return
			}
			await c.writeParam(editPopup.key, num)
			paramValues[editPopup.key] = await c.readParam(editPopup.key)
		}
		editPopup.show = false
		uni.showToast({ title: t('deviceDetail.toast.saved') as string, icon: 'none' })
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

const otaLogger = {
	debug: (...args: unknown[]) => console.log('[ota]', ...args),
	info: (...args: unknown[]) => console.log('[ota]', ...args),
	warn: (...args: unknown[]) => console.warn('[ota]', ...args),
	error: (...args: unknown[]) => console.error('[ota]', ...args),
}

const startOta = async () => {
	if (!props.client || props.connType === 'offline') {
		uni.showToast({ title: t('deviceDetail.toast.noConnection') as string, icon: 'none' })
		return
	}
	const deviceId = String(props.battery?.device_id || '').trim()
	if (!deviceId) return

	otaState.show = true
	otaState.running = true
	updateOtaStage('checking', 0)

	try {
		props.onPausePolling && props.onPausePolling()
		await delay(120)
		const modelName = String(props.status?.identity?.hardwareModel || props.battery?.battery_model_name || '').trim()
		const versionText = String(props.status?.meta?.softwareVersion || props.battery?.fw_version || '').trim()
		const rsp = await appBatteryOtaCheck({ device_id: deviceId, model: modelName || undefined, version: versionText || undefined })
		if (!rsp || rsp.code !== 200) throw new Error('ota check failed')
		const data = rsp.data || {}
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

		const { sourceAddress, targetAddress: deviceTarget } = props.client.getAddresses()
		const rawTransport = props.client.getTransport()
		const otaTransport = {
			request: (frameBytes: Uint8Array) => {
				const t = rawTransport as any
				if (typeof t?.request !== 'function') throw new Error('transport not ready')
				const cmd = frameBytes[3] & 0xff
				const timeoutMs = cmd === 0x50 ? 3000 : 12000
				return t.request(frameBytes, { timeoutMs })
			},
		}
		const queryTargetAddress = 0x00
		const targets = [deviceTarget]
		let otaErr: unknown = null
		for (const targetAddress of targets) {
			try {
				await bootOtaUpgrade({
					transport: otaTransport,
					firmware,
					targetAddress,
					queryTargetAddress,
					sourceAddress,
					logger: otaLogger,
					onProgress: (p) => {
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
				otaErr = null
				break
			} catch (e) {
				otaErr = e
			}
		}
		if (otaErr) throw otaErr

		updateOtaStage('success', 100)
		uni.showToast({ title: t('deviceDetail.toast.otaSuccess') as string, icon: 'none' })
	} catch (e) {
		updateOtaStage('failed', otaState.progress || 0)
		const errMessage = (e as Error)?.message || String(e || '')
		if (errMessage === 'boot_packet0_no_ack') {
			const mismatchText = t('deviceDetail.toast.otaHardwareMismatch') as string
			otaState.message = mismatchText
			uni.showToast({ title: mismatchText, icon: 'none' })
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
	startOta()
}

const openAdvanced = () => {
	try {
		advancedPopup.show = true
		setTimeout(() => {
			loadKeysCached('other', OTHER_KEYS)
			loadKeysCached('numbering', NUMBERING_KEYS)
			loadKeysCached('system', SYSTEM_KEYS)
		}, 50)
		applyPollingState()
	} catch (e) {
		uni.showToast({ title: t('deviceDetail.toast.openFailed') as string, icon: 'none' })
	}
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
