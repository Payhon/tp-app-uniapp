<template>
  <view>
    <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c" @click="showPop">
    	<input class="uni-input" :placeholder="$t('components.device.placeholder')" disabled :value="showValue"/>
    	<view>
        <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
      </view>
    </view>
    
    <gq-tree
      class="gq-tree"
      ref="pop"
      :range="options"
      idKey="device"
      nameKey="device_name"
      childKey="children"
      pidKey="parent_id"
      allKey="type"
      :showSearch="false"
      :multiple="false"
      :cascade="false"
      :selectParent="true"
      :foldAll="false"
      confirmColor="#007aff"
      cancelColor="#757575"
      :title="$t('components.device.selectTitle')"
      titleColor="#757575"
      @cancel="treeCancel"
      @confirm="onSelect"
    >
    <text>{{ $t('components.device.test') }}</text>
    </gq-tree>
  </view>
  
</template>

<script setup lang="ts">
	import { computed, ref, toRefs, watch, watchEffect } from 'vue'

	type PropType = string | number | undefined
	type DeviceNode = {
		device: string
		device_name: string
		device_token?: string
		device_type?: string
		type?: PropType
		children?: DeviceNode[]
	}
	type DevicePathItem = {
		device_id: string
		device_name: string
		device_token?: string
		device_type?: string
		type?: PropType
	}

	type Props = {
		// 兼容 Vue2 v-model（value/update:value）与 Vue3 v-model（modelValue/update:modelValue）
		value?: string
		modelValue?: string
		options?: DeviceNode[]
	}

	const props = withDefaults(defineProps<Props>(), {
		options: () => [],
	})

	const emit = defineEmits<{
		(e: 'update:value', v?: string): void
		(e: 'update:modelValue', v?: string): void
		(e: 'change', n?: string, o?: string): void
		(e: 'propTypeChange', n?: PropType, o?: PropType): void
	}>()

	const { options } = toRefs(props)
	const pop = ref<any>(null) // NOTE: uni_modules/gq-tree 的实例方法类型未在项目中显式声明
	const type = ref<PropType>(undefined)

	const value = computed<string | undefined>(() => (props.value !== undefined ? props.value : props.modelValue) || undefined)

	const deepFind = (deviceId: string | undefined, treeData: DeviceNode[]): DevicePathItem[] => {
		const devicePath: DevicePathItem[] = []
		if (!deviceId) return devicePath

		for (let i = 0; i < treeData.length; i += 1) {
			const item = treeData[i]
			if (item.device === deviceId) {
				devicePath.push({
					device_id: item.device,
					device_name: item.device_name,
					device_token: item.device_token,
					device_type: item.device_type,
					type: item.type,
				})
				break
			} else if (item.children) {
				devicePath.push({
					device_id: item.device,
					device_name: item.device_name,
					device_token: item.device_token,
					device_type: item.device_type,
					type: item.type,
				})

				const temp = deepFind(deviceId, item.children)
				if (temp.length) {
					devicePath.push(...temp)
					break
				} else {
					devicePath.length = 0
				}
			} else {
				devicePath.length = 0
			}
		}
		return devicePath
	}

	const showValue = computed<string>(() => {
		const path = deepFind(value.value, options.value)
		if (!path.length) return ''
		return path.map((item) => item.device_name).join('/')
	})

	watchEffect(() => {
		const path = deepFind(value.value, options.value)
		type.value = path.length ? path[path.length - 1]?.type : undefined
	})

	watch(
		() => value.value,
		(n, o) => {
			console.log('deviceId = change', n, o)
			emit('change', n, o)
		}
	)

	watch(
		() => type.value,
		(n, o) => {
			console.log(n, o)
			emit('propTypeChange', n, o)
		}
	)

	const showPop = () => {
		pop.value?._show?.()
	}
	const hidePop = () => {
		pop.value?._hide?.()
	}

	const onSelect = ([option]: Array<Record<string, unknown>>) => {
		console.log(option)
		if (!option) return
		type.value = (option.value as PropType) ?? type.value
		// NOTE: gq-tree 返回结构由 uni_modules 决定，这里保持与原逻辑一致（优先使用 option.id）
		const id = (option.id as string | undefined) ?? (option.device as string | undefined)
		emit('update:value', id)
		emit('update:modelValue', id)
	}

	const treeCancel = () => {}
</script>

<style scoped>
  ::v-deep .tree-cnt {
    top: 65%;
  }
</style>
