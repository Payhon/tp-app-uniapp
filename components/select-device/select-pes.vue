<template>
  <view>
    <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c" @click="showPop">
    	<input class="uni-input" :placeholder="$t('components.selectDevice.statusProperty')" disabled :value="showValue"/>
    	<view>
    	  <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
    	</view>
    </view>
    
    <uni-popup ref="pop" type="bottom" backgroundColor="#fff">
    	<scroll-view :scroll-y="true" scroll-with-animation="true" :style="{ maxHeight: '700rpx' }">
    		<view class="selectlist" v-if="showStatus">
          <view style="color: #bbb;" class="select_item">{{ $t('components.selectDevice.onlineStatus') }}</view>
    			<view class="select_item" v-for="(option, key) in statusOptions" :key="key" @click="onSelect('3', option)">
    				{{ option.label }}
    			</view>
    		</view>
        
        <view class="selectlist" v-if="propOptions.length">
          <view style="color: #bbb;" class="select_item">{{ $t('components.selectDevice.property') }}</view>
        	<view class="select_item" v-for="(option, key) in propOptions" :key="key" @click="onSelect('1', option)">
        		{{ option.title }}
        	</view>
        </view>
        <template v-else>
          <view style="color:red;" class="select_item" v-if="!showStatus">
            <text>{{ $t('components.selectDevice.noData') }}</text>
          </view>
        </template>
        
    	</scroll-view>
    </uni-popup>
  </view>
  
</template>

<script setup lang="ts">
	import { computed, ref, toRefs, watch, watchEffect } from 'vue'
	import { useI18n } from 'vue-i18n'

	type PesModel = { device_condition_type?: string; v1?: string; v2?: string }
	type PropOption = { name?: string; title?: string; unit?: string } & Record<string, unknown>
	type StatusOption = { value: string; name: string; label: string; mode: string }

	type Props = {
		// 兼容 Vue2 v-model（value/update:value）与 Vue3 v-model（modelValue/update:modelValue）
		value?: PesModel
		modelValue?: PesModel
		propOptions?: PropOption[]
		showStatus?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		modelValue: () => ({}),
		propOptions: () => [],
		showStatus: true,
	})

	const emit = defineEmits<{
		(e: 'update:value', v: PesModel): void
		(e: 'update:modelValue', v: PesModel): void
		(e: 'change', n?: PesModel, o?: PesModel): void
		(e: 'valueConfChange', v: Record<string, unknown>): void
	}>()

	const { propOptions, showStatus } = toRefs(props)
	const pop = ref<any>(null) // NOTE: uni-ui 组件实例方法类型未在项目中显式声明
	const { t } = useI18n()

	const value = computed<PesModel>(() => (props.value !== undefined ? props.value : props.modelValue) || {})

	const statusOptions = computed<StatusOption[]>(() => [
		{ value: '1', name: 'online', label: t('components.selectDevice.online'), mode: 'onlineState' },
		{ value: '2', name: 'offline', label: t('components.selectDevice.offline'), mode: 'onlineState' },
		{ value: '3', name: 'onAndOff', label: t('components.selectDevice.onAndOff'), mode: 'onlineState' },
	])

	const selectedConf = computed<Record<string, unknown> | null>(() => {
		if (value.value.device_condition_type === '1') {
			const option = propOptions.value.find((item) => item?.name === value.value.v1)
			return option || null
		}
		if (value.value.device_condition_type === '3') {
			const option = statusOptions.value.find((item) => item.value === value.value.v2)
			return option || null
		}
		return null
	})

	const showValue = computed<string>(() => {
		if (value.value.device_condition_type === '1') {
			const option = propOptions.value.find((item) => item?.name === value.value.v1)
			return option?.title ? String(option.title) : ''
		}
		if (value.value.device_condition_type === '3') {
			const option = statusOptions.value.find((item) => item.value === value.value.v2)
			return option?.label ? String(option.label) : ''
		}
		return ''
	})

	watchEffect(() => {
		const conf = selectedConf.value
		if (conf) emit('valueConfChange', conf)
	})

	watch(
		() => value.value,
		(n, o) => {
			emit('change', n, o)
		},
		{ deep: true }
	)

	const showPop = () => {
		pop.value?.open?.()
	}
	const hidePop = () => {
		pop.value?.close?.()
	}

	const onSelect = (deviceConditionType: '1' | '2' | '3', option: Record<string, unknown>) => {
		console.log(JSON.parse(JSON.stringify(option)))
		if (deviceConditionType === '1') {
			const next: PesModel = {
				device_condition_type: '1',
				v1: String(option.name ?? ''),
				v2: '',
			}
			emit('update:value', next)
			emit('update:modelValue', next)
		} else if (deviceConditionType === '3') {
			const next: PesModel = {
				device_condition_type: '3',
				v1: '',
				v2: String(option.value ?? ''),
			}
			emit('update:value', next)
			emit('update:modelValue', next)
		}
		hidePop()
	}
</script>

<style scoped>
  
</style>
