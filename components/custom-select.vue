<template>
  <view class="tp-flex-1 custom-select-popup">
    <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c select-row" @tap="showPop">
      <view class="label">{{label}}</view>
    	<view class="input-wrapper">
        <input class="uni-input" :placeholder="placeholder" disabled :value="currentDisplayText || showValue" :key="`input-${value || ''}-${currentDisplayText || showValue || ''}`"/>
        <view class="input-overlay" @tap="showPop"></view>
      </view>
    	<view class="" v-if="!clearable || (clearable && !value)">
        <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
      </view>
      <view class="" v-if="clearable && value" @tap.stop="clear">
        <uni-icons color="#999" type="clear" size="40rpx"></uni-icons>
      </view>
    </view>
    
    <uni-popup ref="pop" type="bottom" backgroundColor="#fff">
    	<scroll-view :scroll-y="true" scroll-with-animation="true" :style="{ maxHeight: '700rpx' }">
    		<view class="selectlist">
    			<view class="select_item" v-for="(option, key) in options" :key="key" @click="onSelect(option)">
    				{{ option[optionLabel] }}
    			</view>
    		</view>
    	</scroll-view>
    </uni-popup>
  </view>
  
</template>

<script setup lang="ts">
	import { computed, nextTick, ref, toRefs, watch } from 'vue'

	type SelectValue = string | number | null | undefined
	type SelectOption = Record<string, unknown>

	type Props = {
		// 兼容 Vue2 v-model（value/update:value）与 Vue3 v-model（modelValue/update:modelValue）
		value?: SelectValue
		modelValue?: SelectValue
		clearable?: boolean
		options?: SelectOption[]
		optionValue?: string
		optionLabel?: string
		label?: string
		placeholder?: string
	}

	const props = withDefaults(defineProps<Props>(), {
		clearable: false,
		options: () => [],
		optionValue: 'value',
		optionLabel: 'label',
		label: '',
		placeholder: '',
	})

	const emit = defineEmits<{
		(e: 'update:value', v?: SelectValue): void
		(e: 'update:modelValue', v?: SelectValue): void
		(e: 'change', n?: SelectValue, o?: SelectValue): void
		(e: 'click'): void
	}>()

	const { clearable, options, optionValue, optionLabel, label, placeholder } = toRefs(props)

	const pop = ref<any>(null) // NOTE: uni-ui 组件实例方法类型未在项目中显式声明
	const currentDisplayText = ref<string>('') // 当前显示的文本

	const value = computed<SelectValue>(() => (props.value !== undefined ? props.value : props.modelValue))

	const showValue = computed<string>(() => {
		console.log(
			'showValue computed - value:',
			value.value,
			'options length:',
			options.value?.length,
			'optionValue:',
			optionValue.value,
			'optionLabel:',
			optionLabel.value
		)

		if (value.value === null || value.value === undefined || value.value === '') {
			console.log('showValue - value is empty')
			return ''
		}

		if (!options.value || options.value.length === 0) {
			console.log('showValue - options is empty')
			return ''
		}

		const option = options.value.find((item) => {
			if (!item) return false
			const itemValue = item[optionValue.value]
			if (itemValue === value.value) return true
			if (String(itemValue) === String(value.value)) return true
			const numItem = Number(itemValue)
			const numValue = Number(value.value)
			if (!Number.isNaN(numItem) && !Number.isNaN(numValue) && numItem === numValue) return true
			return false
		})

		if (option && option[optionLabel.value] !== undefined && option[optionLabel.value] !== null) {
			const displayText = String(option[optionLabel.value])
			console.log('showValue found:', { value: value.value, option, displayText, optionLabel: optionLabel.value })
			return displayText
		}

		console.log('showValue not found:', {
			value: value.value,
			valueType: typeof value.value,
			options: options.value.map((o) => ({ id: o[optionValue.value], name: o[optionLabel.value] })),
			optionValue: optionValue.value,
		})
		return ''
	})

	watch(
		() => value.value,
		(n, o) => {
			emit('change', n, o)
			if (n !== o) currentDisplayText.value = ''
			nextTick(() => {})
		}
	)

	watch(
		() => options.value,
		() => {
			nextTick(() => {})
		},
		{ deep: true }
	)

	const clear = () => {
		emit('update:value')
		emit('update:modelValue')
	}

	const showPop = (e?: unknown) => {
		console.log('showPop', e)
		emit('click')
		pop.value?.open?.()
	}

	const hidePop = () => {
		pop.value?.close?.()
	}

	const onSelect = (option: SelectOption) => {
		if (!option) return
		const newValue = option[optionValue.value] as SelectValue
		const displayText = (option[optionLabel.value] ?? '') as SelectValue
		console.log('onSelect:', { option, newValue, displayText, optionValue: optionValue.value, optionLabel: optionLabel.value })
		currentDisplayText.value = String(displayText ?? '')
		emit('update:value', newValue)
		emit('update:modelValue', newValue)
		emit('change', newValue)
		hidePop()
		nextTick(() => {})
	}
</script>

<style scoped>
  .label {
    font-size: 26rpx;
  }
  .select-row {
    position: relative;
  }
  .input-wrapper {
    flex: 1;
    position: relative;
  }
  .input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }
</style>

<style>
  /* 确保弹出层从页面底部弹出，不受父元素影响 */
  .custom-select-popup ::v-deep .uni-popup {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 9999 !important;
  }
  
  .custom-select-popup ::v-deep .uni-popup.bottom .uni-popup__wrapper {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
  }
</style>
