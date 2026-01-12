<template>
	<view :style="{ height: pageHeight, background: '#f5f5f5' }">
		<customNav :pageTitle="$t('pages.deviceProvision.wizardTitle')" iconColor="#fff" background="#246FDD" fontColor="#fff" />

		<view class="wrap" :style="{ marginTop: marginTopHeight }">
			<view class="card">
				<view class="card-title">{{ $t('pages.deviceProvision.progressTitle') }}</view>
				<u-steps direction="column" :current="currentStepIndex" activeColor="#246FDD" inactiveColor="#C9CDD4">
					<u-steps-item v-for="s in steps" :key="s.key" :title="s.title" :desc="statusText(s.status)" :error="s.status === 'error'" />
				</u-steps>
			</view>

			<view class="card" v-if="summary.uuid || summary.boardCode || summary.hardwareModel || summary.batteryGroupId || summary.bleMac">
				<view class="card-title">{{ $t('pages.deviceProvision.deviceInfo') }}</view>
				<view class="kv" v-if="summary.uuid">
					<text class="k">{{ $t('pages.deviceProvision.uuidLabel') }}</text>
					<text class="v">{{ summary.uuid }}</text>
				</view>
				<view class="kv" v-if="summary.boardCode">
					<text class="k">{{ $t('pages.deviceProvision.boardCodeLabel') }}</text>
					<text class="v">{{ summary.boardCode }}</text>
				</view>
				<view class="kv" v-if="summary.hardwareModel">
					<text class="k">{{ $t('pages.deviceProvision.hardwareModelLabel') }}</text>
					<text class="v">{{ summary.hardwareModel }}</text>
				</view>
				<view class="kv" v-if="summary.batteryGroupId">
					<text class="k">{{ $t('pages.deviceProvision.batteryGroupIdLabel') }}</text>
					<text class="v">{{ summary.batteryGroupId }}</text>
				</view>
				<view class="kv" v-if="summary.bleMac">
					<text class="k">{{ $t('pages.deviceProvision.bleMacLabel') }}</text>
					<text class="v">{{ summary.bleMac }}</text>
				</view>
			</view>

			<view class="card" v-if="errorMsg">
				<text class="error">{{ errorMsg }}</text>
			</view>

			<view class="actions">
				<u-button type="primary" :loading="running" @click="retry" v-if="!running">
					{{ errorMsg ? $t('pages.deviceProvision.retry') : $t('pages.deviceProvision.reRun') }}
				</u-button>
				<u-button type="success" @click="goHome" v-if="done">
					{{ $t('pages.deviceProvision.goHome') }}
				</u-button>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BmsClient, BMS_PARAM, createUniBleBmsTransport } from '@/common/lib/bms-protocol'
import { mac12ToColon, normalizeMac } from '@/common/device-provision/ble'
import { getDeviceProvisionConfig, postDeviceProvisionBind } from '@/service/deviceProvision'

type StepStatus = 'pending' | 'doing' | 'done' | 'error'
type Step = { key: string; title: string; status: StepStatus }

const { t } = useI18n()

const pageHeight = ref<string | number>(0)
const marginTopHeight = ref<string | number>(0)

const deviceId = ref('')
const qrMac = ref<string | null>(null)
const rawDeviceIdParam = ref('')

const running = ref(false)
const done = ref(false)
const errorMsg = ref('')

const summary = reactive<{ uuid: string; bleMac: string; hardwareModel: string; batteryGroupId: string; boardCode: string }>({
	uuid: '',
	bleMac: '',
	hardwareModel: '',
	batteryGroupId: '',
	boardCode: '',
})

const steps = ref<Step[]>([
	{ key: 'connect', title: t('pages.deviceProvision.stepConnect'), status: 'pending' },
	{ key: 'readUuid', title: t('pages.deviceProvision.stepReadUuid'), status: 'pending' },
	{ key: 'writeDtu', title: t('pages.deviceProvision.stepWriteDtu'), status: 'pending' },
	{ key: 'bind', title: t('pages.deviceProvision.stepBind'), status: 'pending' },
])

const currentStepIndex = computed(() => {
	const doingIdx = steps.value.findIndex((x) => x.status === 'doing')
	if (doingIdx >= 0) return doingIdx
	const errIdx = steps.value.findIndex((x) => x.status === 'error')
	if (errIdx >= 0) return errIdx
	let lastDone = -1
	steps.value.forEach((s, idx) => {
		if (s.status === 'done') lastDone = idx
	})
	return Math.max(0, lastDone)
})

const statusText = (s: StepStatus) => {
	if (s === 'pending') return t('pages.deviceProvision.statusPending')
	if (s === 'doing') return t('pages.deviceProvision.statusDoing')
	if (s === 'done') return t('pages.deviceProvision.statusDone')
	return t('pages.deviceProvision.statusError')
}

function safeDecodeURIComponent(input: string): string {
	try {
		return decodeURIComponent(String(input || ''))
	} catch (e) {
		return String(input || '')
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function stringifyError(e: unknown): string {
	if (!e) return ''
	if (e instanceof Error) {
		const anyErr = e as any
		const code = anyErr?.code
		const errMsg = anyErr?.errMsg
		const msg = e.message || String(e)
		if (code != null || errMsg) return `${msg}${code != null ? ` (code=${code})` : ''}${errMsg ? ` (${errMsg})` : ''}`
		return msg
	}
	if (typeof e === 'string') return e
	try {
		return JSON.stringify(e)
	} catch (err) {
		return String(e)
	}
}

function setStep(key: string, status: StepStatus) {
	const s = steps.value.find((x) => x.key === key)
	if (s) s.status = status
}

function reset() {
	steps.value.forEach((s) => (s.status = 'pending'))
	errorMsg.value = ''
	done.value = false
	summary.uuid = ''
	summary.bleMac = ''
	summary.hardwareModel = ''
	summary.batteryGroupId = ''
	summary.boardCode = ''
}

function goHome() {
	uni.switchTab({ url: '/pages/home/home' })
}

async function runProvision() {
	if (!deviceId.value) {
		errorMsg.value = t('pages.deviceProvision.deviceIdMissing')
		return
	}
	reset()
	running.value = true

	// TODO(4G判定): 当前默认所有设备都包含 4G，必写 DTU_DOMAIN_PORT；后续按实际硬件能力做分支。
	const transport = createUniBleBmsTransport({ logger: console as any, requestTimeoutMs: 8000 })
	const client = new BmsClient({ transport, logger: console as any })
	try {
		console.log('[provision] start', { rawDeviceIdParam: rawDeviceIdParam.value, deviceId: deviceId.value, qrMac: qrMac.value })
		// 部分平台要求连接前停止扫描，否则连接/发现服务可能失败
		try {
			await new Promise((resolve) => uni.stopBluetoothDevicesDiscovery({ complete: resolve }))
		} catch (e) {}
		await sleep(120)

		setStep('connect', 'doing')
		console.log('[provision] connect start', { deviceId: deviceId.value })
		await transport.connect({ deviceId: deviceId.value })
		setStep('connect', 'done')

		// 某些设备连接后需要一点准备时间才会响应首包
		await sleep(220)

		setStep('readUuid', 'doing')
		console.log('[provision] readUuid start')
		const uuid = await client.readUuid()
		summary.uuid = uuid
			console.log('[provision] readUuid done', { uuid })

			// 读取身份信息（按 S/N 动态地址）：硬件型号/电池组编号/BMS板编码/蓝牙MAC
			console.log('[provision] readIdentity start')
			const identity = await client.readIdentityInfo()
			if (identity.hardwareModel) summary.hardwareModel = identity.hardwareModel
			if (identity.batteryGroupId) summary.batteryGroupId = identity.batteryGroupId
			if (identity.boardCode) summary.boardCode = identity.boardCode
			const bleMac = identity.bluetoothMacHex ? normalizeMac(identity.bluetoothMacHex) : null
			if (bleMac) summary.bleMac = mac12ToColon(bleMac)
			console.log('[provision] readIdentity done', { ...identity, bluetoothMacHex: identity.bluetoothMacHex ? mac12ToColon(identity.bluetoothMacHex) : null })

			// 扫码模式：校验连接到的设备 MAC 是否一致（避免连错设备）
			if (qrMac.value && bleMac && qrMac.value !== bleMac) {
				throw new Error(t('pages.deviceProvision.qrMacMismatch', { qr: mac12ToColon(qrMac.value), ble: mac12ToColon(bleMac) }))
			}
		setStep('readUuid', 'done')

		setStep('writeDtu', 'doing')
		const cfg = await getDeviceProvisionConfig()
		const dtuDomainPort = String((cfg as any)?.data?.dtu_domain_port || '').trim()
		if (!dtuDomainPort) {
			throw new Error(t('pages.deviceProvision.dtuNotConfigured'))
		}
		await client.writeParam(BMS_PARAM.DTU_DOMAIN_PORT, dtuDomainPort)
		setStep('writeDtu', 'done')

		setStep('bind', 'doing')
		const macForBind = bleMac || qrMac.value || undefined
		const bindRes = await postDeviceProvisionBind({ item_uuid: uuid, ble_mac: macForBind })
		if ((bindRes as any)?.code !== 200) {
			throw new Error(String((bindRes as any)?.message || t('pages.deviceProvision.bindFailed')))
		}
		setStep('bind', 'done')

		done.value = true
		uni.showToast({ title: t('pages.deviceProvision.bindSuccess'), icon: 'success' })
	} catch (e) {
		console.error('[provision] failed', e)
		const msg = stringifyError(e)
		errorMsg.value = msg || t('pages.deviceProvision.unknownError')
		// 将第一个 doing 的步骤标记为 error
		const s = steps.value.find((x) => x.status === 'doing')
		if (s) s.status = 'error'
	} finally {
		running.value = false
		try {
			await transport.destroy()
		} catch (e) {}
	}
}

function retry() {
	if (running.value) return
	runProvision()
}

onLoad((option) => {
	const opt = option as Record<string, string | undefined>
	rawDeviceIdParam.value = String(opt.deviceId || '')
	deviceId.value = safeDecodeURIComponent(rawDeviceIdParam.value)
	qrMac.value = opt.qrMac ? normalizeMac(opt.qrMac) : null
})

onShow(() => {
	marginTopHeight.value = uni.getStorageSync('contentPaddingTop')
	pageHeight.value = uni.getStorageSync('pageHeight')
	runProvision()
})

onUnload(() => {
	// transport.destroy() 已在 runProvision finally 做过；这里不再重复处理
})
</script>

<style scoped>
.wrap {
	padding: 24rpx;
}

.card {
	background: #ffffff;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
}

.card-title {
	font-size: 30rpx;
	color: #111111;
	margin-bottom: 12rpx;
}

.step {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10rpx 0;
}

.step-name {
	font-size: 28rpx;
	color: #333333;
}

.step-status {
	font-size: 26rpx;
}

.st-pending {
	color: #999999;
}
.st-doing {
	color: #246fdd;
}
.st-done {
	color: #19be6b;
}
.st-error {
	color: #e54d42;
}

.kv {
	display: flex;
	justify-content: space-between;
	gap: 16rpx;
	padding: 8rpx 0;
}

.k {
	color: #666666;
	font-size: 26rpx;
}

.v {
	color: #111111;
	font-size: 26rpx;
	word-break: break-all;
	text-align: right;
	flex: 1;
}

.error {
	color: #e54d42;
	font-size: 26rpx;
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}
</style>
