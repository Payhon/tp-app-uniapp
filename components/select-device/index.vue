<template>
  <view class="">
    <!-- automation_id 是父id，是当前此联动场景的id，
    id是当前条件的id -->
    <!-- <p style="font-size: 10px;">dsns_id：{{data.business_id}}</p>
    <p style="font-size: 10px;">asset_id：{{data.asset_id}}</p>
    <p style="font-size: 10px;">device_id：{{data.device_id}}</p>
    <p style="font-size: 10px;">device_condition_type：{{data.device_condition_type}}</p>
    <p style="font-size: 10px;">v1：{{data.v1}}</p>
    <p style="font-size: 10px;">v2：{{data.v2}}</p>
    <p style="font-size: 10px;">v3：{{data.v3}}</p> -->
    
    <view class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      
      <view class="tp-flex-1">
        <CustomSelect
          :placeholder="$t('components.selectDevice.group')"
          :options="groupOptions"
          @change="groupIdChange"
          optionValue="id"
          optionLabel="device_group"
          v-model="data.asset_id"
        ></CustomSelect>
      </view>
      
    </view>
    
    <view class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing" v-if="data.asset_id || data.device_id">
      <Device 
        class="tp-flex-1"
        :options="deviceOptions"
        @change="deviceIdChange"
        @propTypeChange="propTypeChange"
        v-model="data.device_id"
      ></Device>
      
      <view class="tp-flex-1">
        <SelectPes
          v-if="data.device_id"
          :showStatus="showStatus"
          :propOptions="propOptions"
          v-model="pesData" 
          @change="pesDataChange"
          @valueConfChange="valueConfChange"
          ></SelectPes>
      </view>
      
    </view>
    
    <!-- 前一个选择框选择了属性时才显示 -->
    <view 
      class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing" 
      v-if="data.device_condition_type === '1'"
    >
      <CustomSelect
        v-if="showStatus"
        :placeholder="$t('components.selectDevice.operator')"
        :options="symbolOptions"
        v-model="data.v2"
      ></CustomSelect>
      
      <view class="tp-flex-1">
        <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-a-c tp-mg-l-20">
          <view class="control_l_item_l" v-if="data.v1.startsWith('switch')">
            <view class="control_l_item_r_switch" @click="changSwitch(data)">
              <image src="/static/icon/switch_on.png" v-if="data.v3 == 1" />
              <image src="/static/icon/switch_close.png" v-if="data.v3 == 0" />
            </view>

          </view>
        	<input 
          v-else 
          class="uni-input" 
          :placeholder="$t('components.selectDevice.propertyValue')" 
          v-model.trim="data.v3"
        />
          <text class="tp-font-size-13 tp-mg-l-r-15 unit">{{ valueConf.unit }}</text>
        </view>
      </view>
    </view>
  </view>
  
</template>

<script setup lang="ts">
	import { getCurrentInstance, onMounted, ref, toRefs } from 'vue'
	import CustomSelect from '@/components/custom-select.vue'
	import Device from './device.vue'
	import SelectPes from './select-pes.vue'
	import { deviceList } from '@/service/device'

	type ConditionData = {
		business_id?: string | number
		asset_id?: string | number
		device_id?: string | number
		device_condition_type?: string
		v1?: string
		v2?: string
		v3?: string | number
	}

	type GroupTreeItem = { group: { id: string | number; name: string } }
	type GroupOption = { id: string | number; device_group: string }
	type ApiResponse<T> = { code: number; data: T; message?: string }
	type PesModel = { device_condition_type?: string; v1?: string; v2?: string }

	type Props = {
		data?: ConditionData
		showStatus?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		data: () => ({}),
		showStatus: true,
	})

	const { showStatus } = toRefs(props)
	// NOTE: data 为父组件传入对象，沿用原逻辑（允许修改其内部字段）
	const data = ref(props.data as ConditionData)

	const condition = ref<Record<string, unknown>>({})
	const projectOptions = ref<unknown[]>([])
	const groupOptions = ref<GroupOption[]>([])
	const deviceOptions = ref<unknown[]>([])
	const propOptions = ref<unknown[]>([])
	const pesData = ref<PesModel>({})
	const valueConf = ref<Record<string, unknown>>({})
	const toast = ref<{ msg: string }>({ msg: '' })
	const toastRef = ref<any>(null)

	const symbolOptions = [
		{ value: '>', label: '>' },
		{ value: '>=', label: '>=' },
		{ value: '<', label: '<' },
		{ value: '<=', label: '<=' },
		{ value: '==', label: '==' },
		{ value: '!=', label: '!=' },
		{ value: 'in', label: 'in' },
		{ value: 'between', label: 'between' },
	]

	const getApiRequest = () => {
		// NOTE: API 是项目全局注入（类型取决于注入实现），这里保持渐进式类型，不影响运行逻辑
		const { proxy } = getCurrentInstance() || {}
		return (proxy as any)?.API?.apiRequest as
			| (<T>(url: string, params: Record<string, unknown>, method: string) => Promise<ApiResponse<T>>)
			| undefined
	}

	const changSwitch = (row: ConditionData) => {
		if (row.v3 == 1) {
			row.v3 = '0'
		} else {
			row.v3 = '1'
		}
	}

	const queryGroupOptions = async () => {
		const apiRequest = getApiRequest()
		if (!apiRequest) return

		const params: Record<string, unknown> = {}
		try {
			const res = await apiRequest<GroupTreeItem[]>('/api/v1/device/group/tree', params, 'get')
			if (res.code == 200) {
				groupOptions.value =
					(res.data || []).map((item) => ({
						id: item.group.id,
						device_group: item.group.name,
					})) || []
			} else {
				toast.value.msg = res.message || ''
				toastRef.value?.show?.()
			}
		} finally {
			uni.hideLoading()
		}
	}

	const queryDeviceOptions = async () => {
		if (!data.value.asset_id) return

		const params = {
			group_id: data.value.asset_id,
			page: 1,
			page_size: 9999,
		}
		try {
			const res = (await deviceList(params)) as unknown as ApiResponse<{ list?: unknown[] }>
			if (res.code == 200) {
				deviceOptions.value = res.data?.list || []
			} else {
				toast.value.msg = res.message || ''
				toastRef.value?.show?.()
			}
		} finally {
			uni.hideLoading()
		}
	}

	const queryPropOptions = async (id: string | number) => {
		if (!id) return
		const apiRequest = getApiRequest()
		if (!apiRequest) return

		const params = {
			id,
			current_page: 1,
			per_page: 9999,
		}
		try {
			const res = await apiRequest<{ data?: Array<{ chart_data?: string }> }>('/api/device/model/list', params, 'post')
			if (res.code == 200) {
				const raw = res.data?.data?.[0]?.chart_data || ''
				const parsed = raw ? (JSON.parse(raw) as { tsl?: { properties?: unknown[] } }) : undefined
				propOptions.value = parsed?.tsl?.properties || []
			} else {
				toast.value.msg = res.message || ''
				toastRef.value?.show?.()
			}
		} finally {
			uni.hideLoading()
		}
	}

	const queryEventOptions = () => {}

	const setDataField = <K extends keyof ConditionData>(key: K, v: ConditionData[K]) => {
		;(data.value as ConditionData)[key] = v
	}

	const businessIdChange = async () => {
		groupOptions.value = []
		setDataField('asset_id', '')
		setDataField('device_id', '')
		setDataField('device_condition_type', '')
		setDataField('v1', '')
		setDataField('v2', '')
		setDataField('v3', '')
		await queryGroupOptions()
		console.log(data.value)
	}

	const groupIdChange = async () => {
		setDataField('device_id', '')
		setDataField('device_condition_type', '')
		setDataField('v1', '')
		setDataField('v2', '')
		setDataField('v3', '')
		deviceOptions.value = []
		await queryDeviceOptions()
		console.log(34, data.value)
	}

	const deviceIdChange = () => {
		console.log(data.value)
		setDataField('device_condition_type', '')
		setDataField('v1', '')
		setDataField('v2', '')
		setDataField('v3', '')
		console.log(data.value)
		initPesData()
	}

	const propTypeChange = async (propType: string | number | undefined) => {
		propOptions.value = []
		if (propType) await queryPropOptions(propType)
	}

	const pesDataChange = (row: PesModel) => {
		console.log(row)
		setDataField('device_condition_type', row.device_condition_type || '')
		setDataField('v1', row.v1 || '')
		setDataField('v2', row.v2 || '')
		setDataField('v3', '')
		if ((data.value.v1 || '').startsWith('switch')) {
			setDataField('v3', '0')
		} else {
			setDataField('v3', '')
		}
	}

	const initPesData = () => {
		pesData.value = {
			device_condition_type: data.value.device_condition_type,
			v1: data.value.v1,
			v2: data.value.v2,
		}
	}

	const valueConfChange = (conf: Record<string, unknown>) => {
		valueConf.value = conf
	}

	onMounted(async () => {
		await queryGroupOptions()
		if (data.value.asset_id) await queryDeviceOptions()
		initPesData()
		console.log(data.value)
	})
</script>

<style scoped>
  @import '@/common/styles/alert-strategy.css';

  .unit {
    color: #999;
  }
  .control_l_item_r_switch uni-image{
    text-align: left;
    margin-top: 10px;
    width: 78px;
    height: 37px;
  }
</style>
