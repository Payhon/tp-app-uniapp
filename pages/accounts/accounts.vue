<template>
	<view class="tp-box tp-box-sizing tp-flex tp-flex-col tp-pd-l-r-30">
		
		<view class="tp-panel tp-uinfo tp-flex tp-flex-col tp-flex-j-c tp-flex-a-c tp-mg-t-50">
			<image :src="uhead"></image>
		</view>
		
		<view class="tp-panel tp-flex tp-flex-col tp-box-sizing tp-pd-t-b-10 tp-pd-l-r-30 tp-mg-t-50">
			
			<view class="tp-uinfo-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-30" @tap="doChangeRealname">
				<view>{{ $t('pages.accounts.name') }}</view>
				<view class="tp-flex-1 tp-mg-l-r-10 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c">{{realname}}</view>
				<view class="iconfont iconjiantou1"></view>
			</view>
			
			<view class="tp-uinfo-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-30" @tap="doChangePhone">
				<view>{{ $t('pages.accounts.phone') }}</view>
				<view class="tp-flex-1 tp-mg-l-r-10 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c">{{phone}}</view>
				<view class="iconfont iconjiantou1"></view>
			</view>
			
			<view class="tp-uinfo-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-30" @tap="doChangeEmail">
				<view>{{ $t('pages.accounts.email') }}</view>
				<view class="tp-flex-1 tp-mg-l-r-10 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c">{{email}}</view>
				<view class="iconfont iconjiantou1"></view>
			</view>
			
		</view>
		
		<view class="tp-panel tp-change-pwd tp-flex tp-flex-col tp-box-sizing tp-pd-t-b-10 tp-pd-l-r-30 tp-mg-t-30">			
			<view class="tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-20" @tap="doOpenChangePwd">
				<view>{{ $t('pages.accounts.changePassword') }}</view>
				<view class="iconfont iconjiantou1"></view>
			</view>
		</view>
		
		<view class="tp-bnt tp-flex tp-flex-row tp-flex-j-c tp-flex-a-c tp-box-sizing tp-pd-t-b-10 tp-pd-l-r-30 tp-mg-t-50" @tap="doLogout">
			<text>{{ $t('pages.accounts.logout') }}</text>
		</view>
		
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import { useUserStore } from '@/store/user'

const { t } = useI18n()
const userStore = useUserStore()

const uhead = ref<string>('/static/image/uhead.png')
const realname = ref<string>('李萌')
const phone = ref<string>('18035274152')
const email = ref<string>('102451452@qq.com')

const getAccount = () => {
	const info = userStore.userInfo
	if (info) {
		realname.value = String(info.name ?? '')
		phone.value = String(info.mobile ?? '')
		email.value = String(info.email ?? '')
	}
}

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.basicInfo') as string
	})
	getAccount()
})

const doChangeRealname = () => {
	uni.navigateTo({
		url: './realname'
	})
}

const doChangePhone = () => {
	uni.navigateTo({
		url: './phone'
	})
}

const doChangeEmail = () => {
	uni.navigateTo({
		url: './email'
	})
}

const doOpenChangePwd = () => {
	uni.navigateTo({
		url: '../change-pwd/change-pwd'
	})
}

const doLogout = () => {
	uni.showModal({
		content: t('pages.accounts.logoutConfirm') as string,
		confirmText: t('pages.accounts.logoutBtn') as string,
		success: (res) => {
			if (res.confirm) {
				uni.removeStorageSync('currentYw')
				uni.removeStorageSync('isAuth')
				uni.removeStorageSync('access_token')
				uni.removeStorageSync('ywId')
				uni.removeStorageSync('currentGroup')
				userStore.logout()
				uni.navigateTo({
					url: '../login/login'
				})
				uni.showToast({
					title: t('pages.accounts.logoutSuccess') as string,
					icon: 'none'
				})
			}
		}
	})
}
</script>

<style>
.tp-box{
	width: 100%;
	min-height: 100vh;
	background: #F8F8F8;
}
.tp-panel{
	background: #FFFFFF;
	border-radius: 10px;
}
.tp-uinfo{
	background: none;
}
.tp-uinfo>image{
	width: 124rpx;
	height: 124rpx;
	background: #FFFFFF;
	border-radius: 100%;
}
.tp-uinfo-item{
	border-bottom: 1rpx solid #EDEDED;
}
.tp-uinfo-item>view:first-child{
	font-size: 30rpx;
	font-weight: bold;
	color: #1B1B1B;
}
.tp-uinfo-item>view:nth-child(2){
	font-size: 28rpx;
	color: #999999;
}
.tp-uinfo-item>view:last-child{
	color: #AAAAAA;
	font-size: 28rpx;
}
.tp-panel>view.tp-uinfo-item:last-child{
	border-bottom: none;
}

.tp-change-pwd{
	
}
.tp-change-pwd>view>view:first-child{
	font-size: 30rpx;
	font-weight: bold;
	color: #1B1B1B;
}
.tp-change-pwd>view>view:last-child{
	color: #AAAAAA;
	font-size: 28rpx;
}
.tp-bnt{
	height: 86rpx;
	background: #343436;
	border-radius: 10rpx;
}
.tp-bnt>text{
	font-size: 32rpx;
	font-weight: 500;
	color: #FFFFFF;
}
</style>
