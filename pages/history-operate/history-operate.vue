<template>
	<view class="tp-box tp-flex tp-flex-col tp-box-sizing tp-flex tp-flex-col">
		
		<view class="tp-datetime-select tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c tp-fixed tp-box-sizing tp-pd-t-b-25 tp-pd-l-r-30">
			<view class="tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c" @tap="doOpenSelectDateTime">
				<text class="tp-mg-r-10">{{date}}{{$t('pages.history.year')}}{{month}}{{$t('pages.history.month')}}</text>
				<view class="iconfont iconjiantou"></view>
			</view>
		</view>
		
		<view class="tp-pd-t-b-40"></view>
		
		<block v-for="(item,index) in logData" :key="index">
			<view class="tp-log tp-flex tp-flex-col tp-mg-t-15 tp-mg-l-r-30">
				<view class="tp-log-title tp-mg-t-15 tp-mg-b-20">{{item.date}}<text>/{{item.month}}{{$t('pages.history.month')}}</text></view>
				<view class="tp-panel tp-flex tp-flex-col tp-box-sizing tp-pd-20">
					<block v-for="(items,indexs) in item.list" :key="indexs">
						<view class="tp-log-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c">
							<view class="tp-time">{{items.time}}</view>
							<view class="tp-circle tp-mg-l-r-20" :class=" items.status?'tp-active':'' "></view>
							<view class="tp-flex-1">{{items.log}}</view>
							<view><image :src="items.icon"></image></view>
						</view>
					</block>
				</view>
			</view>
		</block>
		
		<view class="tp-tmp"></view>		
		
		<DatePicke :startYear="startYear" :endYear="endYear" :val="selectedTime" @confirm="onConfirm" ref="datePickeRef"></DatePicke>
		
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import DatePicke from '@/components/uni/DatePicke/DatePicke.vue'

type LogItem = { id: number; time: string; log: string; icon: string; status: 0 | 1 }
type LogGroup = { month: number; date: number; list: LogItem[] }

const { t } = useI18n()

const datePickeRef = ref<any>(null)

const startYear = ref<string>('2016')
const endYear = ref<string>('2021')
const selectedTime = ref<string>('2021-04')
const date = ref<string>('2021')
const month = ref<string>('04')

const logText = computed(() => t('pages.history.pumpOnWhenPHHigh'))
const logData = computed<LogGroup[]>(() => {
	const mkList = (): LogItem[] => [
		{ id: 1000, time: '14:22', log: logText.value, icon: '/static/icon/icon-small-ph.png', status: 0 },
		{ id: 1001, time: '14:22', log: logText.value, icon: '/static/icon/icon-small-oxygen.png', status: 1 },
		{ id: 1002, time: '14:22', log: logText.value, icon: '/static/icon/icon-small-ph.png', status: 0 },
		{ id: 1002, time: '14:22', log: logText.value, icon: '/static/icon/icon-small-ph.png', status: 0 },
	]
	return [
		{ month: 4, date: 25, list: mkList() },
		{ month: 4, date: 24, list: mkList() },
		{ month: 4, date: 23, list: mkList() },
		{ month: 4, date: 22, list: mkList() },
	]
})

const doOpenSelectDateTime = () => {
	datePickeRef.value?.show?.()
}

const onConfirm = (e: string) => {
	const dateTime = e
	const dateArr = dateTime.split('-')
	date.value = dateArr[0] || ''
	month.value = dateArr[1] || ''
	selectedTime.value = `${date.value}-${month.value}`
}

onShow(() => {
	uni.setNavigationBarTitle({ title: t('pages.historyOperation') })
})
</script>

<style>
.tp-box{
	width: 100%;
	min-height: 100vh;
	background: #F8F8F8;
}
.tp-datetime-select{
	width: 100%;
	border-top: 1rpx solid #E2E2E2;
	background: #FFFFFF;
	top: 88rpx;
	left: 0;
	z-index: 9999;
	background: #FFFFFF;
}
.tp-datetime-select>view>text{
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
}
.tp-datetime-select>view>view.iconfont{
	color: #333333;
	font-size: 26rpx;
}

.tp-panel{
	width: 100%;
	background: #FFFFFF;
	border-radius: 20rpx;
}
.tp-log-title{
	color: #333333;
	font-size: 32rpx;
	font-weight: bold;
}
.tp-log-title>text{
	color: #999999;
	font-size: 22rpx;
	font-weight: normal;
}
.tp-log-item{
	height: 100rpx;
	position: relative;
	z-index: 1;
}
.tp-log-item::before{
	content: '';
	height: 140rpx;
	border-left: 1rpx solid #F2F2F3;
	position: absolute;
	top: -10rpx;
	left: 110rpx;
	z-index: -1;
}
.tp-log-item>view.tp-time{
	width: 80rpx;
	color: #434343;
	font-size: 28rpx;
}
.tp-log-item>view.tp-circle{
	width: 20rpx;
	height: 20rpx;
	background: #E2E2E2;
	border-radius: 50%;
}
.tp-log-item>view.tp-circle.tp-active{
	background: #32BAC0;
}
.tp-log-item>view:nth-child(3){
	font-size: 28rpx;
	font-weight: 400;
	color: #434343;
}
.tp-log-item>view:last-child{
	width: 50rpx;
	height: 50rpx;
}
.tp-log-item>view:last-child>image{
	width: 50rpx;
	height: 50rpx;
}
.tp-tmp{
	height: 35rpx;
}
</style>

