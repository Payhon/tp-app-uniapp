<template>
	<view class="tp-box tp-flex tp-flex-col">
		
		<view class="tp-panel tb-flex tp-box-sizing tp-pd-l-r-30">			
			<view class="tp-box-sizing tp-pd-t-b-25 pwd-row">
				<input
					type="text"
					value=""
					:password="!showNewPassword"
					v-model="upwd"
					:placeholder="$t('pages.changePassword.passwordPlaceholder')"
					placeholder-class="tp-plc"
				/>
				<view class="pwd-eye" @tap="showNewPassword = !showNewPassword">
					<u-icon :name="showNewPassword ? 'eye-fill' : 'eye-off'" size="18" color="#909399"></u-icon>
				</view>
			</view>
			<view class="tp-box-sizing tp-pd-t-b-25 pwd-row">
				<input
					type="text"
					value=""
					:password="!showConfirmPassword"
					v-model="rpwd"
					:placeholder="$t('pages.changePassword.confirmPlaceholder')"
					placeholder-class="tp-plc"
				/>
				<view class="pwd-eye" @tap="showConfirmPassword = !showConfirmPassword">
					<u-icon :name="showConfirmPassword ? 'eye-fill' : 'eye-off'" size="18" color="#909399"></u-icon>
				</view>
			</view>
		</view>
		<view class="tp-panel tp-tips tp-box-sizing tp-pd-l-r-30 tp-mg-t-10">
			{{ $t('pages.changePassword.passwordTip') }}
		</view>
		
		<view class="tp-box-sizing tp-pd-l-r-30">
			<u-button
				class="tp-mg-t-50"
				:text="$t('pages.changePassword.confirmBtn')"
				shape="circle"
				type="primary"
				color="#0B3BFF"
				:disabled="disabled"
				:loading="loading"
				@click="doUpdateSubmit"
			></u-button>
		</view>
		
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import { useUserStore } from '@/store/user'
import { useInjected } from '@/common/composables/useInjected'

const { t } = useI18n()
const userStore = useUserStore()
const { apiRequest, login } = useInjected()

const id = ref<string | number>('')
const loading = ref<boolean>(false)
const upwd = ref<string>('')
const rpwd = ref<string>('')
const showNewPassword = ref<boolean>(false)
const showConfirmPassword = ref<boolean>(false)

const disabled = computed<boolean>(() => {
	const p1 = String(upwd.value || '')
	const p2 = String(rpwd.value || '')
	if (!p1 || !p2) return true
	if (p1.length < 6) return true
	if (p1 !== p2) return true
	return false
})

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
})

const ensureUserId = async () => {
	if (id.value) return
	if (!apiRequest) return
	try {
		const res = await apiRequest<Record<string, unknown>>('/api/v1/user/detail', {}, 'get')
		if (res && (res as any).code === 200 && (res as any).data) {
			userStore.setUserInfo((res as any).data as any)
			id.value = (userStore.userInfo as any)?.id ?? ''
		}
	} catch {}
}

const validate = (): boolean => {
	const p1 = String(upwd.value || '').trim()
	const p2 = String(rpwd.value || '').trim()
	if (!p1) {
		uni.showToast({ title: t('pages.changePassword.passwordEmpty') as string, icon: 'none' })
		return false
	}
	if (p1.length < 6) {
		uni.showToast({ title: t('pages.changePassword.passwordTooShort') as string, icon: 'none' })
		return false
	}
	if (p1 !== p2) {
		uni.showToast({ title: t('pages.changePassword.passwordMismatch') as string, icon: 'none' })
		return false
	}
	if (!id.value) {
		uni.showToast({ title: t('pages.changePassword.failedMsg') as string, icon: 'none' })
		return false
	}
	return true
}

const doUpdateSubmit = async () => {
	if (loading.value || disabled.value) return
	if (!login?.isLoginType?.()?.isLogin) {
		uni.showToast({ title: t('pages.pleaseLogin') as string, icon: 'none' })
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	if (!apiRequest) return
	await ensureUserId()
	if (!validate()) return

	loading.value = true
	try {
		const res = await apiRequest<unknown>(
			'/api/v1/user/update',
			{ id: id.value, password: String(upwd.value || ''), salt: '' },
			'put'
		)
		if (res && (res as any).code === 200) {
			uni.showToast({
				title: t('pages.changePassword.successMsg') as string,
				icon: 'none',
				success: () => {
					uni.navigateBack({ delta: 1 })
				}
			})
		} else {
			uni.showToast({ title: (res as any)?.message || (t('pages.changePassword.failedMsg') as string), icon: 'none' })
		}
	} catch {
		uni.showToast({ title: t('pages.changePassword.failedMsg') as string, icon: 'none' })
	} finally {
		loading.value = false
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
	flex: 1;
}
.pwd-row{
	display: flex;
	align-items: center;
	gap: 16rpx;
}
.pwd-eye{
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
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
