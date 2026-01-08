<template>
	<view class="tp-box tp-flex tp-flex-col tp-box-sizing tp-pd-l-r-30">
		<view class="tp-panel tb-flex tp-box-sizing">
			<view class="tp-box-sizing tp-pd-t-b-25">
				<input 
					type="text" 
					v-model="email" 
					:placeholder="$t('pages.email.inputPlaceholder')" 
					placeholder-class="tp-plc" 
				/>
			</view>
		</view>
		<view class="tp-panel tp-tips tp-box-sizing tp-mg-t-15">
			{{ $t('pages.email.tips') }}
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onNavigationBarButtonTap, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import http from '@/common/request'
import { useUserStore } from '@/store/user'

const { t } = useI18n()
const userStore = useUserStore()

const id = ref<string | number>('')
const email = ref<string>('')
const is_admin = ref<number>(0)
const business_id = ref<string | number>('')

const loading = ref<boolean>(false)
const disabled = ref<boolean>(false)

const getAccount = () => {
	const info = userStore.userInfo
	if (info) {
		id.value = info.id ?? ''
		email.value = String(info.email ?? '')
		is_admin.value = Number(info.is_admin ?? 0)
		business_id.value = info.business_id ?? ''
	}
}

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.modifyEmail') as string
	})
	getAccount()
})

onNavigationBarButtonTap((e) => {
	if (e.index === 0) handleUpdate()
})

const isEmail = () => {
	const mPattern = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/
	return mPattern.test(email.value)
}

const check = () => {
	if (!isEmail()) {
		uni.showToast({
			title: t('pages.email.invalidEmail') as string,
			icon: 'none'
		})
		return false
	}
	return true
}

const handleUpdate = async () => {
	if (!check()) return
	try {
		await http.post(
			'/user/edit',
			{ id: id.value, email: email.value, is_admin: is_admin.value, business_id: business_id.value },
			{ toke: true }
		)
		loading.value = false
		disabled.value = false
		userStore.editUserInfoField({
			key: 'email',
			value: email.value
		})
		uni.showToast({
			title: t('pages.email.updateSuccess') as string,
			success: () => {
				uni.navigateBack({ delta: 1 })
			}
		})
	} catch (err) {
		console.log(err)
	}
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
.tp-plc{
	font-size: 30rpx;
	font-weight: 500;
	color: #999999;
}
</style>
