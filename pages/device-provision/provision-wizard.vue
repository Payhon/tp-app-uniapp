<template>
	<view :style="{ height: pageHeight, background: '#f5f5f5' }">
		<customNav :pageTitle="$t('pages.deviceProvision.wizardTitle')" iconColor="#fff" background="#246FDD" fontColor="#fff" />

		<view class="wrap" :style="{ marginTop: marginTopHeight }">
			<view class="card">
				<view class="card-title">{{ $t('pages.deviceProvision.progressTitle') }}</view>
				<view class="step" v-for="s in steps" :key="s.key">
					<text class="step-name">{{ s.title }}</text>
					<text class="step-status" :class="`st-${s.status}`">{{ statusText(s.status) }}</text>
				</view>
			</view>

			<view class="card" v-if="summary.uuid || summary.bleMac">
				<view class="card-title">{{ $t('pages.deviceProvision.deviceInfo') }}</view>
				<view class="kv" v-if="summary.uuid">
					<text class="k">{{ $t('pages.deviceProvision.uuidLabel') }}</text>
					<text class="v">{{ summary.uuid }}</text>
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

const running = ref(false)
const done = ref(false)
const errorMsg = ref('')

const summary = reactive<{ uuid: string; bleMac: string }>({ uuid: '', bleMac: '' })

const steps = ref<Step[]>([
	{ key: 'connect', title: t('pages.deviceProvision.stepConnect'), status: 'pending' },
	{ key: 'readUuid', title: t('pages.deviceProvision.stepReadUuid'), status: 'pending' },
	{ key: 'writeDtu', title: t('pages.deviceProvision.stepWriteDtu'), status: 'pending' },
	{ key: 'bind', title: t('pages.deviceProvision.stepBind'), status: 'pending' },
])

const statusText = (s: StepStatus) => {
	if (s === 'pending') return t('pages.deviceProvision.statusPending')
	if (s === 'doing') return t('pages.deviceProvision.statusDoing')
	if (s === 'done') return t('pages.deviceProvision.statusDone')
	return t('pages.deviceProvision.statusError')
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
	const transport = createUniBleBmsTransport({ logger: console as any })
	const client = new BmsClient({ transport })
	try {
		setStep('connect', 'doing')
		await transport.connect({ deviceId: deviceId.value })
		setStep('connect', 'done')

		setStep('readUuid', 'doing')
		const uuid = await client.readUuid()
		summary.uuid = uuid

		// 读取状态用于 MAC 校验/回显
		const status = await client.readAllStatus()
		const bleMac = status.identity?.bluetoothMac ? normalizeMac(status.identity.bluetoothMac) : null
		if (bleMac) summary.bleMac = mac12ToColon(bleMac)

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
		const msg = e instanceof Error ? e.message : String(e)
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
	deviceId.value = String(opt.deviceId || '')
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
