<template>
  <view>
    <view class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
    	<CustomSelect 
        :placeholder="$t('components.selectTime.triggerType')"
        :options="time_condition_type_options"
        @change="timeConditionTypeChange"
        v-model="data.time_condition_type"
      ></CustomSelect>
      
      <view class="tp-flex-1">
        <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c">
          <!-- 单次 -->
          <template v-if="data.time_condition_type === '1'">
            <uni-datetime-picker :placeholder="$t('components.selectTime.triggerDateTime')" :clear-icon="false" :hide-second="true" v-model="data.v1" @change="singleDateTimeChange"/>
            <uni-tooltip class="tooltip" :content="$t('components.selectTime.singleTip')">
              <uni-icons type="help-filled" size="36rpx" color="#999"></uni-icons>
            </uni-tooltip>
          </template>
        	
          
          <!-- 重复 -->
          <CustomSelect
            v-if="data.time_condition_type === '2'"
            :placeholder="$t('components.selectTime.repeatCycle')"
            :options="intervalOptions"
            @change="intervalChange"
             v-model="data.v1"
          ></CustomSelect>
        </view>
      </view>
    </view>
    
    <!-- 范围 -->
    <template v-if="data.time_condition_type === '0'">
      <view class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      	<uni-datetime-picker :placeholder="$t('components.selectTime.startTime')" :clear-icon="false" :hide-second="true" :end="data.v2" v-model="data.v1" @change="v1DateTimeChange"/>
        <text class="zhi">-</text>
        <uni-datetime-picker :placeholder="$t('components.selectTime.endTime')" :clear-icon="false" :hide-second="true" :start="data.v1" v-model="data.v2" @change="v2DateTimeChange"/>
      </view>
    </template>
    
    <!-- 重复 -->
    <template v-if="data.time_condition_type === '2'">
      <!-- 1 每小时 -->
      <view v-if="data.v1 === '1'" class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
        <CustomSelect
          placeholder="mm:ss" 
          :options="minuteOptions"
          v-model="data.v3"
        ></CustomSelect>
        
        <view class="tp-flex-1 tp-flex">
          <view class="tp-flex-1"></view>
          <uni-tooltip class="tooltip" :content="$t('components.selectTime.hourTip')">
            <uni-icons type="help-filled" size="36rpx" color="#999"></uni-icons>
          </uni-tooltip>
        </view>
      </view>
      
      <!-- 2 每天 -->
      <view v-if="data.v1 === '2'" class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      	<picker class="tp-flex-1" mode="time" :value="data.v3" @change="bindTimeChange">
      		<view class="uni-input" :class="!data.v3 && 'placeholder'">{{data.v3 || 'hh:mm'}}</view>
      	</picker>
        
        <view class="tp-flex-1 tp-flex">
          <view class="tp-flex-1"></view>
          <uni-tooltip class="tooltip" :content="$t('components.selectTime.dayTip')">
            <uni-icons type="help-filled" size="36rpx" color="#999"></uni-icons>
          </uni-tooltip>
        </view>
      </view>
      
      <!-- 3 每周 -->
      <view v-if="data.v1 === '3'" class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      	<CustomSelect
      	  :placeholder="$t('components.selectTime.weekday')" 
      	  :options="weekOptions"
      	  v-model="data.v3"
      	></CustomSelect>
        
        <view class="tp-flex-1 tp-flex tp-flex-a-c">
          <picker class="tp-flex-1" v-if="data.v3" mode="time" :value="data.v4" @change="bindTimeChange2">
            <view class="uni-input" :class="!data.v4 && 'placeholder'">{{data.v4 || 'hh:mm'}}</view>
          </picker>
          
          <uni-tooltip v-if="data.v3" class="tooltip" :content="$t('components.selectTime.weekTip')">
            <uni-icons type="help-filled" size="36rpx" color="#999"></uni-icons>
          </uni-tooltip>
        </view>
      </view>
      
      <!-- 4 每月 -->
      <view v-if="data.v1 === '4'" class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      	<CustomSelect
      	  :placeholder="$t('components.selectTime.day')" 
      	  :options="dateOptions"
          @change="dateChange"
      	  v-model="date"
      	></CustomSelect>
        
        <view class="tp-flex-1 tp-flex tp-flex-a-c">
          <picker class="tp-flex-1" v-if="date" mode="time" :value="time" @change="bindTimeChange1">
          	<view class="uni-input" :class="!time && 'placeholder'">{{time || 'hh:mm'}}</view>
          </picker>
          
          <uni-tooltip v-if="date" class="tooltip" :content="$t('components.selectTime.monthTip')">
            <uni-icons type="help-filled" size="36rpx" color="#999"></uni-icons>
          </uni-tooltip>
        </view>
      </view>
      
      <!-- 5 自定义cron -->
      <view v-if="data.v1 === '5'" class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      	<input class="uni-input" :placeholder="$t('components.selectTime.executionRule')" v-model="data.v3"/>
        
        <uni-tooltip class="tooltip tooltip-c">
          <uni-icons type="help-filled" size="36rpx" color="#999" @tap="ttt"></uni-icons>
          <template #content>
            <text>
              <strong style="margin-right: 16rpx;">0/2 * * * *</strong>{{ $t('components.selectTime.cronExample1') }}<br>
              <strong style="margin-right: 16rpx;">0 0/2 * * *</strong>{{ $t('components.selectTime.cronExample2') }}<br>
              <strong style="margin-right: 16rpx;">15 10 * * *</strong>{{ $t('components.selectTime.cronExample3') }}<br>
              <strong style="margin-right: 16rpx;">0/5 14 * * *</strong>{{ $t('components.selectTime.cronExample4') }}<br>
              <strong style="margin-right: 16rpx;">0/5 14,18 * * *</strong>{{ $t('components.selectTime.cronExample5') }}<br>
              <strong style="margin-right: 16rpx;">15 10 ? *</strong>{{ $t('components.selectTime.cronExample6') }}<br>
              <strong style="margin-right: 16rpx;">15 10 15 * *</strong>{{ $t('components.selectTime.cronExample7') }}
            </text>
          </template>
        </uni-tooltip>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
	import { nextTick, onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import CustomSelect from '@/components/custom-select.vue'

	type TimeConditionData = {
		condition_type?: string
		time_condition_type?: string
		v1?: string
		v2?: string
		v3?: string
		v4?: string
		v5?: string
	}

	type OptionItem = { value: string; label: string }

	type Props = {
		data?: TimeConditionData
	}

	const props = withDefaults(defineProps<Props>(), {
		data: () => ({}),
	})

	// NOTE: data 为父组件传入对象，沿用原逻辑（允许修改其内部字段）
	const data = ref(props.data as TimeConditionData)

	const { t } = useI18n()

	const time_condition_type_options = ref<OptionItem[]>([])
	const intervalOptions = ref<OptionItem[]>([])
	const minuteOptions = ref<OptionItem[]>([])
	const weekOptions = ref<OptionItem[]>([])
	const dateOptions = ref<OptionItem[]>([])

	const date = ref<string>('')
	const time = ref<string>('')

	const ttt = () => {
		console.log('=====测试')
	}

	const initMinuteOptions = () => {
		const out: OptionItem[] = []
		for (let i = 0; i < 60; i += 1) {
			const minute = String(i)
			out.push({ value: minute, label: `${minute.padStart(2, '0')}:00` })
		}
		minuteOptions.value = out
	}

	const initDateOptions = () => {
		const out: OptionItem[] = []
		for (let i = 0; i < 31; i += 1) {
			const dd = String(i + 1)
			out.push({ value: dd, label: `${dd}${t('components.selectTime.daySuffix')}` })
		}
		dateOptions.value = out
	}

	const initTextOptions = () => {
		time_condition_type_options.value = [
			{ value: '1', label: t('components.selectTime.single') },
			{ value: '2', label: t('components.selectTime.repeat') },
			{ value: '0', label: t('components.selectTime.range') },
		]
		intervalOptions.value = [
			{ value: '1', label: t('components.selectTime.everyHour') },
			{ value: '2', label: t('components.selectTime.everyDay') },
			{ value: '3', label: t('components.selectTime.everyWeek') },
			{ value: '4', label: t('components.selectTime.everyMonth') },
			{ value: '5', label: t('components.selectTime.customCron') },
		]
		weekOptions.value = [
			{ value: '2', label: t('pages.sceneRuleDetail.monday') },
			{ value: '3', label: t('pages.sceneRuleDetail.tuesday') },
			{ value: '4', label: t('pages.sceneRuleDetail.wednesday') },
			{ value: '5', label: t('pages.sceneRuleDetail.thursday') },
			{ value: '6', label: t('pages.sceneRuleDetail.friday') },
			{ value: '7', label: t('pages.sceneRuleDetail.saturday') },
			{ value: '1', label: t('pages.sceneRuleDetail.sunday') },
		]
	}

	const timeConditionTypeChange = () => {
		data.value.v1 = ''
		data.value.v2 = ''
		data.value.v3 = ''
		data.value.v4 = ''
		data.value.v5 = ''
		date.value = ''
		time.value = ''
	}

	const intervalChange = () => {
		data.value.v2 = ''
		data.value.v3 = ''
		data.value.v4 = ''
		data.value.v5 = ''
		date.value = ''
		time.value = ''
	}

	const bindTimeChange = (e: { detail: { value: string } }) => {
		data.value.v3 = e.detail.value
	}

	const dateChange = () => {
		data.value.v3 = `${date.value}:${time.value}`
	}

	const bindTimeChange1 = (e: { detail: { value: string } }) => {
		time.value = e.detail.value
		data.value.v3 = `${date.value}:${time.value}`
	}

	const bindTimeChange2 = (e: { detail: { value: string } }) => {
		data.value.v4 = e.detail.value
	}

	const singleDateTimeChange = (v1: string) => {
		nextTick(() => {
			data.value.v1 = v1.padEnd(16, '00:00')
		})
	}

	const v1DateTimeChange = (v1: string) => {
		const v2 = data.value.v2
		nextTick(() => {
			if (v2 && v1 > v2) {
				data.value.v1 = v2.padEnd(16, '00:00')
			} else {
				data.value.v1 = v1.padEnd(16, '00:00')
			}
		})
	}

	const v2DateTimeChange = (v2: string) => {
		const v1 = data.value.v1 || ''
		nextTick(() => {
			if (data.value.v1 && v2 < data.value.v1) {
				data.value.v2 = v1.padEnd(16, '00:00')
			} else {
				data.value.v2 = v2.padEnd(16, '00:00')
			}
		})
	}

	onMounted(() => {
		initTextOptions()
		initMinuteOptions()
		initDateOptions()

		const { condition_type, time_condition_type, v1, v3 } = data.value
		if (condition_type === '2' && time_condition_type === '2' && v1 === '4' && v3) {
			const [dd, hh, mm] = v3.split(':')
			date.value = dd
			time.value = `${hh}:${mm}`
		}
	})
</script>

<style scoped>
  @import '@/common/styles/alert-strategy.css';
  
  .zhi {
    font-size: 26rpx;
  }
  .placeholder {
    color: #999;
  }
  ::v-deep .uni-icons.uniui-calendar {
    display: none;
  }
  ::v-deep .uni-date-x {
    padding: 0 26rpx;
    background-color: transparent;
  }
  ::v-deep .uni-date__x-input {
    font-size: 26rpx;
    text-align: left;
    height: 80rpx;
    padding: 0;
  }
  ::v-deep .uni-input-placeholder.input-placeholder {
    color: #999;
  }
  
  ::v-deep .tooltip-c > .uni-tooltip-popup {
    max-width: 70vmin;
  }
</style>
