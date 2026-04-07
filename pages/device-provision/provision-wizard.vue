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
				<u-button type="primary" :loading="running" @click="retry" v-if="!running && !done">
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
import { ensureLoggedIn } from '@/common/auth/ensure-login'
import { BmsClient, BMS_PARAM, createUniBleBmsTransport } from '@/common/lib/bms-protocol'
import { mac12ToColon, normalizeMac } from '@/common/device-provision/ble'
import { formatUniError } from '@/common/device-provision/error'
import { getDeviceProvisionConfig, getDeviceProvisionInfo, postDeviceProvisionBind } from '@/service/deviceProvision'

type StepStatus = 'pending' | 'doing' | 'done' | 'skipped' | 'error'
type Step = { key: string; title: string; status: StepStatus }

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

const deviceId = ref('')
const qrMac = ref<string | null>(null)
const rawDeviceIdParam = ref('')

const running = ref(false)
const done = ref(false)
const errorMsg = ref('')
let blockedByLoginGuard = false

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
		if (s.status === 'done' || s.status === 'skipped') lastDone = idx
	})
	return Math.max(0, lastDone)
})

const statusText = (s: StepStatus) => {
	if (s === 'pending') return t('pages.deviceProvision.statusPending')
	if (s === 'doing') return t('pages.deviceProvision.statusDoing')
	if (s === 'done') return t('pages.deviceProvision.statusDone')
	if (s === 'skipped') return t('pages.deviceProvision.statusSkipped')
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
	return formatUniError(e)
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

function goDeviceDetail(deviceId: string) {
	const nextId = String(deviceId || '').trim()
	if (!nextId) return
	setTimeout(() => {
		uni.redirectTo({
			url: `/pages/device-battery/detail?device_id=${encodeURIComponent(nextId)}`,
		})
	}, 180)
}

async function runProvision() {
	if (!deviceId.value) {
		errorMsg.value = t('pages.deviceProvision.deviceIdMissing')
		return
	}
	reset()
	running.value = true

	const transport = createUniBleBmsTransport({ logger: console as any, requestTimeoutMs: 12000 })
	// NOTE: 部分设备对单帧写入长度更敏感，这里把 maxWriteRegisters 降到 20（字符串写入会自动分包多次写入）。
	const client = new BmsClient({ transport, logger: console as any, maxWriteRegisters: 20 })
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
			throw new Error(format(t('pages.deviceProvision.qrMacMismatch') as string, { qr: mac12ToColon(qrMac.value), ble: mac12ToColon(bleMac) }))
		}

		// 先查云端是否存在该设备（设备未注册则不继续写入/绑定）
		const infoRsp = await getDeviceProvisionInfo(uuid)
		const infoCode = Number((infoRsp as any)?.code || 0)
		if (infoCode !== 200 && infoCode !== 100404) {
			throw new Error(String((infoRsp as any)?.message || t('pages.deviceProvision.unknownError')))
		}
		const provisionInfo = ((infoRsp as any)?.data || {}) as {
			exists?: boolean
			can_auto_register?: boolean
			bms_comm_type?: number
		}
		// 兼容旧后端：未升级 FEAT-0016 时，info 接口在查无设备时直接返回 100404。
		// 此时前端不要在这里终止，让 bind 接口去决定是否允许自动补建。
		const exists = infoCode === 100404 ? false : provisionInfo.exists !== false
		const canAutoRegister = infoCode === 100404 ? true : provisionInfo.can_auto_register === true
		if (!exists && !canAutoRegister) {
			throw new Error(t('pages.deviceProvision.deviceNotFound') as string)
		}
		if (!exists && canAutoRegister) {
			uni.showToast({ title: t('pages.deviceProvision.autoRegisteringHint'), icon: 'none', duration: 2200 })
		}

		// 根据 bms_comm_type 判断是否需要写 DTU；只有 2/3 代表带 4G 通讯。
		// TODO: 若后续规则变化（例如 null 也代表 4G），在这里调整默认值。
		const commType = Number(provisionInfo.bms_comm_type || 0)
		const needWriteDtu = commType === 2 || commType === 3
		setStep('readUuid', 'done')

		if (!needWriteDtu) {
			setStep('writeDtu', 'skipped')
		} else {
			setStep('writeDtu', 'doing')
			const cfg = await getDeviceProvisionConfig()
			const dtuDomainPort = String((cfg as any)?.data?.dtu_domain_port || '').trim()
			if (!dtuDomainPort) {
				throw new Error(t('pages.deviceProvision.dtuNotConfigured'))
			}
			await client.writeParam(BMS_PARAM.DTU_DOMAIN_PORT, dtuDomainPort)
			setStep('writeDtu', 'done')
		}

		setStep('bind', 'doing')
		const macForBind = bleMac || qrMac.value || undefined
		const bindRes = await postDeviceProvisionBind({ item_uuid: uuid, ble_mac: macForBind })
		if ((bindRes as any)?.code !== 200) {
			// NOTE: 后端 CodeDBError 会把 sql_error 放在 data 里；这里输出到控制台便于定位迁移/表缺失等问题。
			console.error('[provision] bind failed', bindRes)
			const sqlErr = String((bindRes as any)?.data?.sql_error || '').trim()
			const msg = String((bindRes as any)?.message || t('pages.deviceProvision.bindFailed'))
			throw new Error(sqlErr ? `${msg} (${sqlErr})` : msg)
		}
		setStep('bind', 'done')

		const boundDeviceId = String((bindRes as any)?.data?.device_id || '').trim()
		done.value = true
		uni.showToast({ title: t('pages.deviceProvision.bindSuccess'), icon: 'success' })
		goDeviceDetail(boundDeviceId)
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
	blockedByLoginGuard = !ensureLoggedIn({ navigateMode: 'redirectTo' })
	if (blockedByLoginGuard) return
	const opt = option as Record<string, string | undefined>
	rawDeviceIdParam.value = String(opt.deviceId || '')
	deviceId.value = safeDecodeURIComponent(rawDeviceIdParam.value)
	qrMac.value = opt.qrMac ? normalizeMac(opt.qrMac) : null
})

onShow(() => {
	if (blockedByLoginGuard) return
	marginTopHeight.value = uni.getStorageSync('contentPaddingTop')
	pageHeight.value = uni.getStorageSync('pageHeight')
	runProvision()
})

onUnload(() => {
	blockedByLoginGuard = false
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
