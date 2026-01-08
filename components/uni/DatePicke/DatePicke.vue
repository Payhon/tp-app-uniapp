<!--
  * DatePicke 时间组
  * ============================================================================
  * 版权所有 2019-2024 www.pfuni.cn，并保留所有权利。
  * 网站地址: http://www.pfuni.cn；
  * ----------------------------------------------------------------------------
  * 这不是一个自由软件！您只能在不用于商业目的的前提下对程序代码进行修改和
  * 使用；不允许对程序代码以任何形式任何目的的再发布。
  * ============================================================================
  *time 2019-10-17 14:39
  *version 1.0.0
-->
<template>
	<view class="pf-picker">
		<div class="mask" :class="{'show':showPicker}" @tap="maskTap" catchtouchmove="true"></div>
		<view class="pf-picker-cnt" :class="{'show':showPicker}">
			<view class="pf-picker-hd" catchtouchmove="true">
				<view class="pf-picker-btn" @tap="pickerCancel">{{ $t('common.cancel') }}</view>
				<view class="pf-picker-tit">{{ $t('components.datePicker.title') }}</view>
				<view class="pf-picker-btn" :style="{'color':themeColor}" @tap="pickerConfirm">{{ $t('common.ok') }}</view>
			</view>
			<view class="pf-picker-view">
				<picker-view indicator-style="height:80rpx;" :value="value" @change="bindChange">
					<picker-view-column v-if="yearStr">
						<view class="item" v-for="(item,index) in datas.years" :key="index">{{item}}{{ $t('components.datePicker.suffix.year') }}</view>
					</picker-view-column>
					<picker-view-column v-if="monthStr">
						<view class="item" v-for="(item,index) in datas.months" :key="index">{{item}}{{ $t('components.datePicker.suffix.month') }}</view>
					</picker-view-column>
					<picker-view-column v-if="dayStr">
						<view class="item"  v-for="(item,index) in datas.days" :key="index">{{item}}{{ $t('components.datePicker.suffix.day') }}</view>
					</picker-view-column>
					<picker-view-column v-if="hours">
						<view class="item" v-for="(item,index) in datas.hours" :key="index">{{item}}{{ $t('components.datePicker.suffix.hour') }}</view>
					</picker-view-column>
					<picker-view-column v-if="minutes">
						<view class="item" v-for="(item,index) in datas.minutes" :key="index">{{item}}{{ $t('components.datePicker.suffix.minute') }}</view>
					</picker-view-column>
					<picker-view-column v-if="seconds">
						<view class="item" v-for="(item,index) in datas.seconds" :key="index">{{item}}{{ $t('components.datePicker.suffix.second') }}</view>
					</picker-view-column>
				</picker-view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'

const props = withDefaults(
	defineProps<{
		themeColor?: string
		startYear?: string
		endYear?: string | number
		// 设置选中时间格式（默认空格，保持历史行为）
		val?: string
	}>(),
	{
		themeColor: '#f00',
		startYear: '1970',
		endYear: () => new Date().getFullYear() + '',
		val: ' '
	}
)

const emit = defineEmits<{
	(e: 'confirm', value: string): void
}>()

const value = ref<number[]>([])

const datas = reactive<{
	years: string[]
	months: Array<string | number>
	days: Array<string | number>
	hours: Array<string | number>
	minutes: Array<string | number>
	seconds: Array<string | number>
}>({
	years: [],
	months: [],
	days: [],
	hours: [],
	minutes: [],
	seconds: []
})

const checkArr = ref<Array<string | number>>([]) // 返回选中数据
const showPicker = ref<boolean>(false)

const yearStr = ref<boolean>(true) // 年
const monthStr = ref<boolean>(true) // 月
const dayStr = ref<boolean>(true) // 日
const hours = ref<boolean>(true) // 时
const minutes = ref<boolean>(true) // 分
const seconds = ref<boolean>(true) // 秒

watch(
	() => props.val,
	() => {
		initData()
	}
)

const maskTap = () => {
	showPicker.value = false
}

const show = () => {
	initData() // 初始化时间
	showPicker.value = true
}

const hide = () => {
	showPicker.value = false
}

const pickerCancel = () => {
	showPicker.value = false
}

const pickerConfirm = () => {
	const date = returnData()
	emit('confirm', date)
	showPicker.value = false
}

const initData = () => {
	const next = initPicker(props.startYear, props.endYear)
	Object.assign(datas, next)
	selectedTimeInit() // 处理选择
}

const returnData = () => {
	const date: Array<string | number> = []
	let result = ''

	if (yearStr.value) date.push(checkArr.value[0])
	if (monthStr.value) date.push(checkArr.value[1])
	if (dayStr.value) date.push(checkArr.value[2])
	if (hours.value) date.push(checkArr.value[3])
	if (minutes.value) date.push(checkArr.value[4])
	if (seconds.value) date.push(checkArr.value[5])

	switch (date.length - 1) {
		// 返回时间格式 2020 / 2020-01 / 2020-01-09 / 2020-01-09 22 / 2020-01-09 22:32 / 2020-01-09 22:32:34
		case 0:
			result = String(date[0] ?? '')
			break
		case 1:
			result = `${date[0]}-${date[1]}`
			break
		case 2:
			result = `${date[0]}-${date[1]}-${date[2]}`
			break
		case 3:
			result = `${date[0]}-${date[1]}-${date[2]} ${date[3]}`
			break
		case 4:
			result = `${date[0]}-${date[1]}-${date[2]} ${date[3]}:${date[4]}`
			break
		case 5:
			result = `${date[0]}-${date[1]}-${date[2]} ${date[3]}:${date[4]}:${date[5]}`
			break
	}

	return result
}

const selectedTimeInit = () => {
	const dateArray = checkValue(props.val)
	const crtDate = new Date()

	let yearS: string | number = dateArray[0] ? dateArray[0] : crtDate.getFullYear() // 年
	let monthS: string | number = dateArray[1] ? dateArray[1] : forMatNum(crtDate.getMonth() + 1) // 月
	let dayS: string | number = dateArray[2] ? dateArray[2] : forMatNum(new Date(Number(yearS), Number(monthS), 0).getDate()) // 日
	let hoursS: string | number = dateArray[3] ? dateArray[3] : forMatNum(crtDate.getHours()) // 时
	let minutesS: string | number = dateArray[4] ? dateArray[4] : forMatNum(crtDate.getMinutes()) // 分
	let secondsS: string | number = dateArray[5] ? dateArray[5] : forMatNum(crtDate.getSeconds()) // 秒

	if (Number(monthS) > 12) {
		// eslint-disable-next-line no-console
		console.log('时间格不正确,月不能大预12')
		monthS = 12
	}
	if (Number(dayS) > 31) {
		// eslint-disable-next-line no-console
		console.log('时间格不正确,日不能大预31')
		dayS = 31
	}
	if (Number(hoursS) > 24) {
		// eslint-disable-next-line no-console
		console.log('时间格不正确,日不能大预23')
		hoursS = '00'
	}
	if (Number(minutesS) > 59 || Number(secondsS) > 59) {
		// eslint-disable-next-line no-console
		console.log('时间格不正确,分、秒不能大预59')
		dayS = 59
	}

	const slctDate = [yearS, monthS, dayS, hoursS, minutesS, secondsS] // 年月日时分秒
	resetSelectDate(slctDate)
}

const resetSelectDate = (newValue: Array<string | number>) => {
	const pickVal: number[] = [0, 0, 0, 0, 0, 0] // 年月日时分秒
	for (let i = 0; i < newValue.length; i++) {
		switch (i) {
			case 0: // 年
				pickVal[i] = queryItemForArray(datas.years, newValue[i]) as any
				break
			case 1: // 月
				pickVal[i] = queryItemForArray(datas.months, newValue[i]) as any
				break
			case 2: // 日
				pickVal[i] = queryItemForArray(datas.days, newValue[i]) as any
				break
			case 3: // 时
				pickVal[i] = queryItemForArray(datas.hours, newValue[i]) as any
				break
			case 4: // 分
				pickVal[i] = queryItemForArray(datas.minutes, newValue[i]) as any
				break
			case 5: // 秒
				pickVal[i] = queryItemForArray(datas.seconds, newValue[i]) as any
				break
		}
		checkArr.value[i] = newValue[i] // 选中时间
	}

	nextTick(() => {
		value.value = pickVal
	})
}

const queryItemForArray = (array: Array<string | number>, v: string | number) => {
	for (let index = 0; index < array.length; index++) {
		if (array[index] == v) return index
	}
	return 0
}

const bindChange = (val: any) => {
	const arr: number[] = val?.detail?.value || []
	const year = datas.years[arr[0]]
	const month = datas.months[arr[1]]
	const day = datas.days[arr[2]]
	const hour = datas.hours[arr[3]]
	const minute = datas.minutes[arr[4]]
	const second = datas.seconds[arr[5]]
	checkArr.value = [year, month, day, hour, minute, second]
}

const initDays = (year: string | number, month: string | number) => {
	const totalDays = new Date(Number(year), Number(month), 0).getDate()
	const dates: string[] = []
	for (let d = 1; d <= totalDays; d++) {
		dates.push(forMatNum(d))
	}
	return dates
}

const initPicker = (start: string, end: string | number, step = 1) => {
	const initstartDate = new Date(start)
	const endDate = new Date(String(end))
	const startYear = initstartDate.getFullYear()
	const startMonth = initstartDate.getMonth()
	const endYear = endDate.getFullYear()

	const years: string[] = []
	const months: string[] = []
	const days: string[] = []
	const hoursArr: string[] = []
	const minutesArr: string[] = []
	const secondsArr: string[] = []

	const totalDays = new Date(startYear, startMonth, 0).getDate()
	for (let s = startYear; s <= endYear; s++) years.push(s + '')
	for (let m = 1; m <= 12; m++) months.push(forMatNum(m))
	for (let d = 1; d <= totalDays; d++) days.push(forMatNum(d))
	for (let h = 0; h < 24; h++) hoursArr.push(forMatNum(h))
	for (let m = 0; m < 60; m += step) minutesArr.push(forMatNum(m))
	for (let m = 0; m < 60; m += step) secondsArr.push(forMatNum(m))

	return { years, months, days, hours: hoursArr, minutes: minutesArr, seconds: secondsArr }
}

const forMatNum = (num: number) => {
	return num < 10 ? '0' + num : String(num)
}

const checkValue = (v: string) => {
	let example: string | undefined
	let strReg: string[] = []
	const yearstrReg = /^\\d{4}$/ // 年2019
	const monthstrReg = /^\\d{4}-\\d{2}$/ // 月
	const daystrReg = /^\\d{4}-\\d{2}-\\d{2}$/ // 日
	const hoursReg = /^\\d{4}-\\d{2}-\\d{2} \\d{2}(?!:)/ // 时
	const minutesReg = /^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}(:\\d{2}){0,1}?$/ // 分
	const secondstrReg = /^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$/ // 秒

	if (secondstrReg.test(v)) {
		example = '2019-02-01 18:06:01'
		const dVal = v.split(' ')
		const dVal0 = dVal[0].split('-')
		const dVal1 = dVal[1].split(':')
		strReg = dVal0.concat(dVal1)
	} else if (minutesReg.test(v)) {
		example = '2019-02-01 18:06:00或2019-02-01 18:06'
		const dVal = v.split(' ')
		const dVal0 = dVal[0].split('-')
		const dVal1 = dVal[1].split(':')
		strReg = dVal0.concat(dVal1)
		seconds.value = false // 秒
	} else if (hoursReg.test(v)) {
		example = '2019-02-01 18:00:00或2019-02-01 18'
		const dVal = v.split(' ')
		const dVal0 = dVal[0].split('-')
		dVal0.push(dVal[1])
		strReg = dVal0
		minutes.value = false // 分
		seconds.value = false // 秒
	} else if (daystrReg.test(v)) {
		example = '2019-02-01'
		strReg = v.split('-')
		hours.value = false // 时
		minutes.value = false // 分
		seconds.value = false // 秒
	} else if (monthstrReg.test(v)) {
		example = '2019-02'
		strReg = v.split('-')
		dayStr.value = false // 日
		hours.value = false // 时
		minutes.value = false // 分
		seconds.value = false // 秒
	} else if (yearstrReg.test(v)) {
		example = '2019'
		strReg.push(v)
		monthStr.value = false // 月
		dayStr.value = false // 日
		hours.value = false // 时
		minutes.value = false // 分
		seconds.value = false // 秒
	} else {
		// console.log("请传入正确的时间值，例value="+example+"");
		void example
	}

	return strReg
}

defineExpose({
	show,
	hide
})
</script>

<style lang="scss" scoped>
	.pf-picker {
		.mask {
			position: fixed;
			z-index: 1000000000;
			top: 0;
			right: 0;
			left: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.6);
			visibility: hidden;
			opacity: 0;
			transition: all 0.3s ease;
		}

		.mask.show {
			visibility: visible;
			opacity: 1;
		}

		.pf-picker-cnt {
			position: fixed;
			bottom: 0;
			left: 0;
			width: 100%;
			transition: all 0.3s ease;
			transform: translateY(100%);
			z-index: 3000000000;
		}

		.pf-picker-cnt.show {
			transform: translateY(0);
		}

		.pf-picker-hd {
			display: flex;
			padding: 22rpx 30rpx;
			background-color: #FFFFFF;
			position: relative;
			text-align: center;
			font-size: 32rpx;
			justify-content: space-between;
		}

		.pf-picker-hd:after {
			content: ' ';
			position: absolute;
			left: 0;
			bottom: 0;
			right: 0;
			height: 1rpx;
			border-bottom: 1rpx solid #e5e5e5;
			color: #e5e5e5;
			transform-origin: 0 100%;
			transform: scaleY(0.5);
		}

		.item {
			text-align: center;
			line-height: 80rpx;
			text-overflow: ellipsis;
			white-space: nowrap;
			font-size: 32rpx;
		}

		.pf-picker-view {
			width: 100%;
			height: 476rpx;
			overflow: hidden;
			background-color: rgba(255, 255, 255, 1);
			z-index: 666;
		}

		picker-view {
			height: 100%;
		}
	}
</style>
