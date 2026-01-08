<template>
	<view :style="{ height: pageHeight, background: '#f5f5f5' }">
		<customNav :pageTitle="$t('pages.addMonitor.pageTitle')" iconColor='#fff' background='#246FDD' fontColor="#fff"></customNav>
		<view class="addpage" :style="{ marginTop: marginTopHeight, display: 'inline-block', width: '100%' }">
			<image src="../../static/image/search_icon.png" class="image"></image>
			<view class="addform">
				<view class="add_name">
					<label for="">{{ $t('pages.addMonitor.deviceName') }}</label>
					<input type="text" :placeholder="$t('pages.addMonitor.deviceNamePlaceholder')" v-model="name">
				</view>
				<view class="add_btn" @click="onCommit">
					{{ $t('pages.addMonitor.completeButton') }}
				</view>
			</view>
		</view>
		<!-- 消息提示框 -->
		<cys-toast ref="toastRef" :msg="toast.msg" direction="row" location="top"></cys-toast>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { useInjected } from '@/common/composables/useInjected'

const { t } = useI18n()
const { apiRequest } = useInjected()

const toast = ref<{ msg: string }>({ msg: '' })
const toastRef = ref<any>(null)

const code = ref<string>('')
const pageHeight = ref<string | number>(0)
const marginTopHeight = ref<string | number>(0)
const groupId = ref<string>('') // NOTE: 原页面读取但未使用，保持兼容
const name = ref<string>('')

const onCommit = async () => {
	if (name.value) {
		uni.showLoading({ title: t('common.loading') })
		try {
			const req = apiRequest
			if (!req) return
			const res = await req<unknown>('/api/v1/device/active', { device_number: code.value, name: name.value }, 'put')
			if (res.code === 200) {
				uni.switchTab({ url: '../fishery-monitor/fishery-monitor' })
			} else {
				toast.value.msg = res.message || ''
				toastRef.value?.show?.()
			}
		} finally {
			uni.hideLoading()
		}
		return
	}
	toast.value.msg = t('pages.addMonitor.deviceNameRequired')
	toastRef.value?.show?.()
}

onLoad((option) => {
	const opt = option as Record<string, string | undefined>
	code.value = opt.code || ''
	groupId.value = opt.groupId || ''
})

onShow(() => {
	uni.setNavigationBarTitle({ title: t('pages.addDevice') })
	marginTopHeight.value = uni.getStorageSync('contentPaddingTop')
	pageHeight.value = uni.getStorageSync('pageHeight')
})
</script>

<style>
	.addpage {
		background-color: #246FDD;
		text-align: center;
	}

	.image {
		width: 548rpx;
		height: 548rpx;
		margin: 0 auto;
		margin-top: 156rpx;
		margin-bottom: 215rpx;
	}

	.addform {
		height: 558rpx;
		background: #F7F7F7;
		border-radius: 10rpx;
		padding-top: 46rpx;
	}

	.add_name {
		width: 690rpx;
		height: 65rpx;
		background: #FFFFFF;
		border-radius: 10rpx;
		margin: 0 auto;
		display: flex;
		padding-top: 36rpx;
	}

	.add_name label {
		font-size: 30rpx;
		font-family: Source Han Sans CN;
		font-weight: 400;
		color: #434343;
		padding-left: 32rpx;
	}

	.add_name input {
		flex: 1;
		text-align: left;
		padding-left: 10rpx;
	}

	.add_btn {
		width: 690rpx;
		height: 80rpx;
		line-height: 80rpx;
		text-align: center;
		background: #246FDD;
		border-radius: 4rpx;
		margin: 0 auto;
		margin-top: 53rpx;
		font-size: 32rpx;
		font-family: Source Han Sans CN;
		font-weight: 500;
		color: #FFFFFF;
	}
</style>
