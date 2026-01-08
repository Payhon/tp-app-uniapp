<template>
	<view class="tp-box tp-flex tp-flex-col tp-box-sizing tp-pd-l-r-30">
		<view class="tp-panel tb-flex tp-box-sizing">
			<view class="tp-box-sizing tp-pd-t-b-25">
				<input type="text" value="" v-model="phone" :placeholder="$t('pages.phone.inputPlaceholder')" placeholder-class="tp-plc" />
			</view>
		</view>
		<view class="tp-panel tp-tips tp-box-sizing tp-mg-t-15">
			{{ $t('pages.phone.tips') }}
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
const phone = ref<string>('')
const is_admin = ref<number>(0)
const business_id = ref<string | number>('')

const loading = ref<boolean>(false)
const disabled = ref<boolean>(false)

const getAccount = () => {
	const info = userStore.userInfo
	if (info) {
		id.value = info.id ?? ''
		phone.value = String(info.mobile ?? '')
		is_admin.value = Number(info.is_admin ?? 0)
		business_id.value = info.business_id ?? ''
	}
}

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.modifyPhone') as string
	})
	getAccount()
})

onNavigationBarButtonTap((e) => {
	if (e.index === 0) {
		handleUpdate()
	}
})

const isPhone = () => {
	const mPattern = /^1[34578]\d{9}$/
	return mPattern.test(phone.value)
}

const check = () => {
	if (!isPhone()) {
		uni.showToast({
			title: t('pages.phone.invalidPhone') as string,
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
			{ id: id.value, mobile: phone.value, is_admin: is_admin.value, business_id: business_id.value },
			{ toke: true }
		)
		loading.value = false
		disabled.value = false
		userStore.editUserInfoField({
			key: 'mobile',
			value: phone.value
		})
		uni.showToast({
			title: t('pages.phone.updateSuccess') as string,
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
