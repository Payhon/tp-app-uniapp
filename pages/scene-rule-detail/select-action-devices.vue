<template>
  <view class="tp-flex tp-flex-col">
    <view class="item2 tp-pd-l-r-25 " v-for="(action, index) in data.actions" :key="action.$index">
      
      <view class="tp-flex tp-flex-row">
        <view style="align-self: center;" class="tp-panel tp-flex-1">
          
          <!-- 设备条件 -->
          <SelectDevice :showStatus="false" key="SelectDevice" :data="action"></SelectDevice>
        </view>
        
        <view style="width:64rpx" class="tp-flex tp-flex-col tp-flex-j-c tp-mg-l-10">
          <!-- 条件数量大于1条时才允许删除 -->
          <uni-icons 
            v-if="data.actions.length > 1" 
            class="tp-mg-t-b-10"
            type="minus" 
            size="40rpx" 
            color="red"
            @click="removeAction(action, index)"
          ></uni-icons>
          
          <!-- 仅最后一个显示新增 -->
          <uni-icons
            class="tp-mg-t-b-10"
            type="plus" 
            size="40rpx"
            color="#2979ff"
            @click="addAction(action, index)"
          ></uni-icons>
        </view>
      </view>
    </view>
    
    <!-- 消息提示框 -->
    <cys-toast ref="toast" :msg="toast.msg" location="top"></cys-toast>
  </view>
  
</template>

<script setup lang="ts">
import { onMounted, ref, toRefs } from 'vue'
import CustomSelect from '@/components/custom-select.vue'
import SelectDevice from '@/components/select-device'

type ActionRow = {
	$index?: number
	action_type?: string
	additional_info?: string
	business_id?: string
	asset_id?: string
	device_id?: string
	device_condition_type?: string
	v1?: string
	v3?: string
	[key: string]: unknown
}

type Props = {
	data?: { action_type?: string; actions?: ActionRow[] }
}

const props = withDefaults(defineProps<Props>(), {
	data: () => ({ action_type: '', actions: [] }),
})

const { data } = toRefs(props)

const toast = ref<{ msg: string }>({ msg: '' })
const actions = ref<unknown[]>([])

const removeAction = (currAction: ActionRow, index: number) => {
	console.log(currAction, index)
	data.value.actions?.splice(index, 1)
}

const addAction = (currAction: ActionRow, index: number) => {
	data.value.actions?.splice(index + 1, 0, {
		$index: Math.random(),
		action_type: '1',
		business_id: '',
		asset_id: '',
		device_id: '',
		device_condition_type: '',
		v1: '',
		v3: '',
	})
	console.log(data.value.actions)
}

onMounted(() => {
	console.log(data.value)
	;(data.value.actions || []).forEach((action) => {
		if (action.additional_info) {
			const info = JSON.parse(action.additional_info) as { device_model?: string; instruct?: Record<string, unknown> }
			const entries = Object.entries(info.instruct || {})
			const [first] = entries
			const v1 = first?.[0]
			const v3 = first?.[1]
			action.device_condition_type = String(info.device_model || '')
			action.v1 = String(v1 || '')
			action.v3 = String(v3 || '')
		}
	})
	console.log(data.value.actions)
})
</script>

<style scoped>
  @import '@/common/styles/alert-strategy.css';
  
  .ttt {
    margin-bottom: 30rpx;
  }
</style>
