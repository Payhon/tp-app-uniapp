<template>
	<view :style="{ height: pageHeight, background: '#f5f5f5' }">
		<customNav :pageTitle="$t('pages.deviceProvision.uuidBindTitle')" iconColor="#fff" background="#246FDD" fontColor="#fff" />

		<view class="wrap" :style="{ marginTop: marginTopHeight }">
			<view class="card">
				<view class="row">
					<text class="k">{{ $t('pages.deviceProvision.uuidLabel') }}</text>
					<text class="v">{{ uuid }}</text>
				</view>
			</view>

			<view class="card">
				<view class="row">
					<text class="k">{{ $t('pages.deviceProvision.statusLabel') }}</text>
					<text class="v">{{ statusText }}</text>
				</view>
			</view>

			<view class="card" v-if="errorMsg">
				<text class="error">{{ errorMsg }}</text>
			</view>

			<view class="actions">
				<u-button type="primary" :loading="running" @click="run" v-if="!done">
					{{ $t('pages.deviceProvision.retry') }}
				</u-button>
				<u-button type="success" @click="goHome" v-if="done">
					{{ $t('pages.deviceProvision.goHome') }}
				</u-button>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { ensureLoggedIn } from '@/common/auth/ensure-login'
import { normalizeHex } from '@/common/device-provision/ble'
import { getDeviceProvisionInfo, postDeviceProvisionBind } from '@/service/deviceProvision'

const { t } = useI18n()

const pageHeight = ref<string | number>(0)
const marginTopHeight = ref<string | number>(0)

const uuid = ref('')
const running = ref(false)
const done = ref(false)
const status = ref<'idle' | 'checking' | 'binding' | 'success' | 'error'>('idle')
const errorMsg = ref('')
let blockedByLoginGuard = false

const statusText = computed(() => {
	if (status.value === 'idle') return t('pages.deviceProvision.statusPending')
	if (status.value === 'checking') return t('pages.deviceProvision.checking')
	if (status.value === 'binding') return t('pages.deviceProvision.binding')
	if (status.value === 'success') return t('pages.deviceProvision.bindSuccess')
	return t('pages.deviceProvision.statusError')
})

function goHome() {
	uni.switchTab({ url: '/pages/home/home' })
}

function goDeviceDetail(deviceId: string) {
	const nextId = String(deviceId || '').trim()
	if (!nextId) {
		console.warn('[uuid-bind] goDeviceDetail skipped: empty device_id')
		uni.showToast({ title: t('pages.deviceProvision.bindSuccess'), icon: 'success' })
		return
	}
	setTimeout(() => {
		uni.redirectTo({
			url: `/pages/device-battery/detail?device_id=${encodeURIComponent(nextId)}`,
		})
	}, 180)
}

async function run() {
	if (!uuid.value) {
		errorMsg.value = t('pages.deviceProvision.invalidCode')
		return
	}
	running.value = true
	errorMsg.value = ''
	done.value = false
	try {
		status.value = 'checking'
		const info = await getDeviceProvisionInfo(uuid.value)
		if ((info as any)?.code === 100404) {
			throw new Error(t('pages.deviceProvision.deviceNotFound') as string)
		}
		if ((info as any)?.code !== 200) {
			throw new Error(String((info as any)?.message || t('pages.deviceProvision.unknownError')))
		}

		// 按需求：UUID（item_uuid）查询到设备后，直接绑定到当前用户账号下（不走 BLE 写入流程）
		status.value = 'binding'
		const bindRes = await postDeviceProvisionBind({ item_uuid: uuid.value })
		if ((bindRes as any)?.code !== 200) {
			console.error('[uuid-bind] bind failed', bindRes)
			const sqlErr = String((bindRes as any)?.data?.sql_error || '').trim()
			const msg = String((bindRes as any)?.message || t('pages.deviceProvision.bindFailed'))
			throw new Error(sqlErr ? `${msg} (${sqlErr})` : msg)
		}

			let boundDeviceId = String((bindRes as any)?.data?.device_id || (info as any)?.data?.device_id || '').trim()
			if (!boundDeviceId) {
				try {
					const refreshRsp = await getDeviceProvisionInfo(uuid.value)
					if (Number((refreshRsp as any)?.code || 0) === 200) {
						boundDeviceId = String((refreshRsp as any)?.data?.device_id || '').trim()
					}
				} catch (e) {
					console.warn('[uuid-bind] refresh device info after bind failed', e)
				}
			}
			console.log('[uuid-bind] bind done', {
				bind_data: (bindRes as any)?.data || null,
				fallback_device_id: (info as any)?.data?.device_id || null,
				bound_device_id: boundDeviceId || null,
			})
			status.value = 'success'
			done.value = true
			uni.showToast({ title: t('pages.deviceProvision.bindSuccess'), icon: 'success' })
			goDeviceDetail(boundDeviceId)
	} catch (e) {
		status.value = 'error'
		const msg = e instanceof Error ? e.message : String(e)
		errorMsg.value = msg
	} finally {
		running.value = false
	}
}

onLoad((option) => {
	blockedByLoginGuard = !ensureLoggedIn({ navigateMode: 'redirectTo' })
	if (blockedByLoginGuard) return
	const opt = option as Record<string, string | undefined>
	uuid.value = normalizeHex(String(opt.uuid || ''))
	if (!/^[0-9A-F]{32}$/.test(uuid.value)) uuid.value = ''
})

onShow(() => {
	if (blockedByLoginGuard) return
	marginTopHeight.value = uni.getStorageSync('contentPaddingTop')
	pageHeight.value = uni.getStorageSync('pageHeight')
	run()
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

.row {
	display: flex;
	justify-content: space-between;
	gap: 16rpx;
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
