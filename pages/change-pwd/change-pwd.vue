<template>
	<view class="tp-box tp-flex tp-flex-col">
		
		<view class="tp-panel tb-flex tp-box-sizing tp-pd-l-r-30">			
			<view class="tp-box-sizing tp-pd-t-b-25"><input type="text" value="" password="true" v-model="upwd" :placeholder="$t('pages.changePassword.passwordPlaceholder')" placeholder-class="tp-plc" /></view>
			<view class="tp-box-sizing tp-pd-t-b-25"><input type="text" value="" password="true" v-model="rpwd" :placeholder="$t('pages.changePassword.confirmPlaceholder')" placeholder-class="tp-plc" /></view>
		</view>
		<view class="tp-panel tp-tips tp-box-sizing tp-pd-l-r-30 tp-mg-t-10">
			{{ $t('pages.changePassword.passwordTip') }}
		</view>
		
		<view class="tp-box-sizing tp-pd-l-r-30">
			<button class="tp-btn tp-mg-t-50" :loading="loading":class="{'vc-btn-disabled':disabled}" @tap="doUpdateSubmit">{{ $t('pages.changePassword.confirmBtn') }}</button>
		</view>
		
	</view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import http from '@/common/request'
import { useUserStore } from '@/store/user'

const { t } = useI18n()
const userStore = useUserStore()

const id = ref<string | number>('')
const loading = ref<boolean>(false)
const disabled = ref<boolean>(true)
const upwd = ref<string>('')
const rpwd = ref<string>('')

const onBtnChange = () => {
	if (upwd.value && rpwd.value && upwd.value === rpwd.value) {
		disabled.value = false
		return
	}
	disabled.value = true
}

watch([upwd, rpwd], onBtnChange)

const getAccount = () => {
	const info = userStore.userInfo
	if (info) {
		id.value = info.id ?? ''
	}
}

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.modifyPassword') as string
	})
	getAccount()
	onBtnChange()
})

const handleUpdate = () => {
	loading.value = true
	http
		.post('/user/update', { id: id.value, password: upwd.value, password_confirmation: rpwd.value }, { toke: true })
		.then(() => {
			loading.value = false
			disabled.value = false
			uni.showToast({
				title: t('pages.changePassword.successMsg') as string,
				success: () => {
					uni.navigateBack({ delta: 1 })
				}
			})
		})
		.catch(() => {
			loading.value = false
			disabled.value = false
		})
}

const doUpdateSubmit = () => {
	handleUpdate()
}
</script>

<style>
.tp-box{
	width: 100%;
	min-height: 100vh;
	background: #FFFFFF;
}
.tp-panel{

}
.tp-panel>view{
	border-bottom: 1rpx solid #E1E1E1;
}
.tp-panel>view>input{
	color: #666666;
	font-size: 30rpx;
}
.tp-tips{
	font-size: 26rpx;
	line-height: 44rpx;
	color: #999999;
}
.tp-btn{
	width: 100%;
	height: 86rpx;
	line-height: 86rpx;
	background: #343436;
	box-shadow: 0rpx 8rpx 31rpx 1rpx rgba(147, 147, 147, 0.35);
	border-radius: 20rpx;
	font-size: 30rpx;
	font-weight: bold;
	color: #FFFFFF;
}
.vc-btn-disabled{
	background: #888888;
}
.tp-plc{
	font-size: 30rpx;
	font-weight: 500;
	color: #999999;
}
</style>
