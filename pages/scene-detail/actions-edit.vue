<template>
<view>
    <!-- 动作编辑部分 -->
    <view
    v-for="(actionGroupItem, actionGroupIndex) in actions"
    :key="actionGroupIndex"
    class="mt-1 w-100%"
    >
    <view style="align-self: center" class="tp-flex tp-flex-1 tp-mg-10 tp-pd-b-10 w-80">
      <view class="tp-panel tp-flex-1">
        <view
          class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing"
          :style="isInSceneEdit ? 'display:none' : ''">
          <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
            <picker
                mode="selector"
                :range="actionOptions"
                range-key="label"
                :value="getPickerIndex(actionOptions, actionGroupItem.actionType, 'value')"
                @change="onActionTypePickerChange($event, actionGroupItem, actionGroupIndex)"
                class="tp-flex-1"
            >
              <view class="uni-input" :class="!actionGroupItem.actionType && 'placeholder'">
                {{ getPickerDisplayText(actionOptions, actionGroupItem.actionType, 'value', 'label') || $t('pages.sceneDetail.actionsEdit.selectActionType') }}
              </view>
            </picker>
            <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
          </view>
        </view>

        <!-- 当 actionType 为 '1' 时（操作设备） -->
        <view v-if="actionGroupItem.actionType === '1'" class="flex-1 border-class">
          <view
              v-for="(instructItem, instructIndex) in actionGroupItem.actionInstructList"
              :key="instructIndex"
              class="action-item-card item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-flex-wrap tp-mg-10 tp-pd-b-10"
          >
          <view class="tp-flex-1">
            <view class="max-w-30 w-full">
              <view class="w-full tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
                <picker
                    mode="selector"
                    :range="actionTypeOptions"
                    range-key="label"
                    :value="getPickerIndex(actionTypeOptions, instructItem.action_type, 'value')"
                    @change="onDeviceTypePickerChange($event, actionGroupIndex, instructIndex)"
                    class="tp-flex-1"
                >
                  <view class="uni-input" :class="!instructItem.action_type && 'placeholder'">
                    {{ getPickerDisplayText(actionTypeOptions, instructItem.action_type, 'value', 'label') || $t('pages.sceneDetail.actionsEdit.selectDeviceType') }}
                  </view>
                </picker>
                <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
              </view>
            </view>

            <!-- 单个设备 -->
            <view v-if="instructItem.action_type === '10'" class="max-w-40 w-full">
              <view class="w-full tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
                <picker
                    mode="selector"
                    :range="deviceOptions"
                    range-key="name"
                    :value="getPickerIndex(deviceOptions, instructItem.action_target, 'id')"
                    @change="onDevicePickerChange($event, actionGroupIndex, instructIndex)"
                    class="tp-flex-1"
                >
                  <view class="uni-input" :class="!instructItem.action_target && 'placeholder'">
                    {{ getPickerDisplayText(deviceOptions, instructItem.action_target, 'id', 'name') || $t('pages.sceneDetail.actionsEdit.selectDevice') }}
                  </view>
                </picker>
                <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
              </view>
            </view>

            <!-- 单类设备 -->
            <view v-if="instructItem.action_type === '11'" class="max-w-40 w-full">
              <view class="w-full tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
                <picker
                    mode="selector"
                    :range="deviceConfigOption"
                    range-key="name"
                    :value="getPickerIndex(deviceConfigOption, instructItem.action_target, 'id')"
                    @change="onDeviceConfigPickerChange($event, actionGroupIndex, instructIndex)"
                    class="tp-flex-1"
                >
                  <view class="uni-input" :class="!instructItem.action_target && 'placeholder'">
                    {{ getPickerDisplayText(deviceConfigOption, instructItem.action_target, 'id', 'name') || $t('pages.sceneDetail.actionsEdit.selectDeviceCategory') }}
                  </view>
                </picker>
                <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
              </view>
            </view>

            <view v-if="instructItem.action_type">
              <!-- 选择属性类型 -->
              <view class="max-w-30 w-full">
                <view class="w-full tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
                  <picker
                      mode="selector"
                      :range="instructItem.actionParamTypeOptions"
                      range-key="label"
                      :value="getPickerIndex(instructItem.actionParamTypeOptions, instructItem.action_param_type, 'value')"
                      @change="onActionParamTypePickerChange($event, actionGroupIndex, instructIndex)"
                      class="tp-flex-1"
                  >
                    <view class="uni-input" :class="!instructItem.action_param_type && 'placeholder'">
                      {{ getPickerDisplayText(instructItem.actionParamTypeOptions, instructItem.action_param_type, 'value', 'label') || $t('pages.sceneDetail.actionsEdit.selectMetricType') }}
                    </view>
                  </picker>
                  <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
                </view>
              </view>

              <!-- 选择属性 -->
              <view v-if="instructItem.showSubSelect" class="max-w-40 w-full">
                <view class="w-full tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
                  <picker
                      mode="selector"
                      :range="instructItem.actionParamOptions"
                      range-key="label"
                      :value="getPickerIndex(instructItem.actionParamOptions, instructItem.action_param, 'key')"
                      @change="onActionParamPickerChange($event, actionGroupIndex, instructIndex)"
                      class="tp-flex-1"
                  >
                    <view class="uni-input" :class="!instructItem.action_param && 'placeholder'">
                      {{ getPickerDisplayText(instructItem.actionParamOptions, instructItem.action_param, 'key', 'label') || $t('pages.sceneDetail.actionsEdit.selectMetric') }}
                    </view>
                  </picker>
                  <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
                </view>
              </view>

              <!-- 输入动作值 -->
              <view v-if="instructItem.showSubSelect && instructItem.actionParamData" class="max-w-60 w-full">
                  <input
                  v-if="instructItem.actionParamData.data_type === 'string'"
                  v-model="instructItem.actionValue"
                  :placeholder="$t('pages.sceneDetail.actionsEdit.examplePrefix') + instructItem.placeholder"
                  @blur="() => actionValueChange(actionGroupIndex, instructIndex)"
                  class="w-full uni-input"
                  />
                  <input
                  v-if="instructItem.actionParamData.data_type === 'number'"
                  v-model.number="instructItem.actionValue"
                  :placeholder="$t('pages.sceneDetail.actionsEdit.examplePrefix') + instructItem.placeholder"
                  class="w-full uni-input"
                  />
	                  <switch
	                  v-if="instructItem.actionParamData.data_type === 'boolean'"
	                  :checked="!!instructItem.actionValue"
	                  @change="(e) => { instructItem.actionValue = e.detail.value; actionValueChange(actionGroupIndex, instructIndex) }"
	                  ></switch>
	              </view>

              <view v-else class="w-60">
                  <input
                  v-model="instructItem.actionValue"
                  :placeholder="$t('pages.sceneDetail.actionsEdit.examplePrefix') + instructItem.placeholder"
                  @blur="() => actionValueChange(actionGroupIndex, instructIndex)"
                  class="w-full uni-input"
                  />
              </view>
              </view>
            </view>
            <view style="width:64rpx" class="tp-flex tp-flex-col tp-flex-j-c tp-mg-l-10">
              <!-- 条件数量大于1条时才允许删除 -->
              <uni-icons 
                v-if="actionGroupItem.actionInstructList.length > 1" 
                class="tp-mg-t-b-10"
                type="minus" 
                size="40rpx" 
                color="red"
                @click="deleteIfGroupsSubItem(actionGroupIndex, instructIndex)"
              ></uni-icons>
              
              <!-- 仅最后一个显示新增 -->
              <uni-icons
                v-if="instructIndex === actionGroupItem.actionInstructList.length - 1"
                class="tp-mg-t-b-10"
                type="plus" 
                size="40rpx"
                color="#4CAF50"
                @click="addIfGroupsSubItem(actionGroupIndex)"
              ></uni-icons>
            </view>
            <!--
            <button
              v-if="instructIndex !== 0"
              @click="() => deleteIfGroupsSubItem(actionGroupIndex, instructIndex)"
              class="tp-btn"
              style="width: 50%; margin-right: 15px;"
            >
            删除
            </button> -->
          </view>
          <!-- 
          <button
              @click="() => addIfGroupsSubItem(actionGroupIndex)"
              style="width: 50%; margin-right: 15px;"
              class="tp-btn"
          >
              新增一个操作
          </button>
          -->
        </view>

        <!-- 激活场景 -->
        <view v-if="actionGroupItem.actionType === '20'" class="ml-6 max-w-40 w-auto">
          <view class="w-full tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
            <picker
                mode="selector"
                :range="sceneList"
                range-key="name"
                :value="getPickerIndex(sceneList, actionGroupItem.action_target, 'id')"
                @change="onScenePickerChange($event, actionGroupIndex)"
                class="tp-flex-1"
            >
              <view class="uni-input" :class="!actionGroupItem.action_target && 'placeholder'">
                {{ getPickerDisplayText(sceneList, actionGroupItem.action_target, 'id', 'name') || $t('pages.sceneDetail.actionsEdit.selectScene') }}
              </view>
            </picker>
            <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
          </view>
        </view>

        <!-- 触发告警 -->
        <view v-if="actionGroupItem.actionType === '30'" class="ml-6 max-w-40 w-auto">
          <view class="w-full tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c picker-wrapper">
            <picker
                mode="selector"
                :range="alarmList"
                range-key="name"
                :value="getPickerIndex(alarmList, actionGroupItem.action_target, 'id')"
                @change="onAlarmPickerChange($event, actionGroupIndex)"
                class="tp-flex-1"
            >
              <view class="uni-input" :class="!actionGroupItem.action_target && 'placeholder'">
                {{ getPickerDisplayText(alarmList, actionGroupItem.action_target, 'id', 'name') || $t('pages.sceneDetail.actionsEdit.selectAlarm') }}
              </view>
            </picker>
            <uni-icons color="#999" type="forward" size="40rpx"></uni-icons>
          </view>
          <!-- <button @click="popUpVisible = true" class="tp-btn">
          创建告警
          </button> -->
        </view>
        </view>
        <view v-if="!isInSceneEdit" style="width:64rpx" class="tp-flex tp-flex-col tp-flex-j-c tp-mg-l-10">
          <!-- 条件数量大于1条时才允许删除 -->
          <uni-icons 
            v-if="actions.length > 1" 
            class="tp-mg-t-b-10"
            type="minus" 
            size="40rpx" 
            color="red"
            @click="deleteActionGroupItem(actionGroupIndex)"
          ></uni-icons>
          
          <!-- 仅最后一个显示新增 -->
          <uni-icons
            v-if="actionGroupIndex === actions.length - 1"
            class="tp-mg-t-b-10"
            type="plus" 
            size="40rpx"
            color="#4CAF50"
            @click="addActionGroupItem()"
          ></uni-icons>
        </view>
        <!--
        <button
          v-if="actionGroupIndex > 0"
          @click="() => deleteActionGroupItem(actionGroupIndex)"
          class="tp-btn mt-6"
          style="width: 50%; margin-right: 15px;"
        >
        删除执行动作
        </button>
        -->
    </view>
    </view>
</view>
</template>
  
<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { warningMessageList } from '@/service/alarm'
import {
	deviceMetricsMenu,
	deviceConfigMetricsMenu,
	deviceConfigAll,
	deviceListAll,
	sceneGet
} from '@/service/automation'

type PickerChangeEvent = { detail: { value: string | number } }

type ActionParamType =
	| 'telemetry'
	| 'attributes'
	| 'command'
	| 'c_telemetry'
	| 'c_attribute'
	| 'c_command'
	| string
	| null

interface LabeledOption {
	label: string
	value: string
	disabled?: boolean
}

interface MetricOption {
	key: string
	label: string
	data_type?: string
	// 动态补充字段：picker 里会用到 value
	value?: string
	[key: string]: unknown
}

interface MetricGroup {
	data_source_type: string
	label: string
	options: MetricOption[]
	// 动态补充字段：picker 里会用到 value
	value?: string
	[key: string]: unknown
}

interface ActionInstructItem {
	action_target: string | null
	action_type: string | null
	action_param_type: ActionParamType
	action_param: string | null
	actionValue: unknown

	deviceGroupId: string | null
	actionParamOptions: MetricOption[]
	actionParamOptionsData: MetricGroup[]
	actionParamTypeOptions: LabeledOption[]
	showSubSelect: boolean
	actionParamData: MetricOption | null
	placeholder: string
	inputFeedback: string
	inputValidationStatus: string | undefined

	[key: string]: unknown
}

interface ActionGroupItem {
	actionType: string | null
	action_type?: string | null
	action_target?: string | null
	actionInstructList: ActionInstructItem[]
	[key: string]: unknown
}

interface DeviceOption {
	id: string
	name: string
	[key: string]: unknown
}

interface QueryDevice {
	group_id: string | null
	device_name: string | null
	bind_config: number
}

interface QueryDeviceConfig {
	device_config_name: string
}

interface ListResponse<T> {
	data: T
	[key: string]: unknown
}

interface PagedList<T> {
	list: T[]
	[key: string]: unknown
}

const props = defineProps<{
	actions: ActionGroupItem[]
	isInSceneEdit?: boolean
}>()

const emit = defineEmits<{
	(e: 'update:actions', value: ActionGroupItem[]): void
}>()

const { t } = useI18n()

const isInSceneEdit = computed(() => !!props.isInSceneEdit)
const actions = computed(() => props.actions)

const emitUpdate = () => {
	emit('update:actions', props.actions)
}

const createInstructItem = (): ActionInstructItem => ({
	action_target: '',
	action_type: null,
	action_param_type: null,
	action_param: null,
	actionValue: null,
	deviceGroupId: null,
	actionParamOptions: [],
	actionParamOptionsData: [],
	actionParamTypeOptions: [],
	showSubSelect: true,
	actionParamData: null,
	placeholder: '',
	inputFeedback: '',
	inputValidationStatus: ''
})

const createActionItem = (): ActionGroupItem => ({
	actionType: null,
	action_type: null,
	action_target: '',
	actionInstructList: []
})

const popUpVisible = ref<boolean>(false)

const actionOptions = ref<LabeledOption[]>([
	{
		label: t('pages.sceneRuleDetail.actionType1') as string,
		value: '1',
		disabled: false
	},
	{
		label: t('pages.sceneRuleDetail.actionType3') as string,
		value: '20',
		disabled: false
	},
	{
		label: t('pages.sceneRuleDetail.actionType2') as string,
		value: '30',
		disabled: false
	}
])

const actionTypeOptions = ref<LabeledOption[]>([
	{
		label: t('pages.sceneRuleDetail.singleDevice') as string,
		value: '10'
	},
	{
		label: t('pages.sceneRuleDetail.singleDeviceType') as string,
		value: '11'
	}
])

const deviceOptions = ref<DeviceOption[]>([])
const sceneList = ref<Array<{ id: string; name: string }>>([])
const alarmList = ref<Array<{ id: string; name: string }>>([])
const deviceConfigOption = ref<DeviceOption[]>([])

const queryDevice = reactive<QueryDevice>({
	group_id: null,
	device_name: null,
	bind_config: 0
})

const queryDeviceConfig = reactive<QueryDeviceConfig>({
	device_config_name: ''
})

const placeholderMap: Record<string, string> = {
	telemetry: '20',
	attributes: 'on-line',
	command: '{"param1":1}',
	c_telemetry: '{"switch":1,"switch1":0}',
	c_attribute: '{"addr":1,"port":0}',
	c_command: '{"method":"switch1","params":{"false":0}}'
}

watch(
	() => props.actions,
	(newActions) => {
		if (!newActions || !Array.isArray(newActions)) return
		newActions.forEach((item, index) => {
			if (item && item.actionType === '1' && Array.isArray(item.actionInstructList)) {
				item.actionInstructList.forEach((_instructItem, instructIndex) => {
					void actionParamShow(index, instructIndex, true)
				})
			}
		})
	},
	{ deep: false }
)

onMounted(() => {
	if (props.actions && Array.isArray(props.actions)) {
		props.actions.forEach((item, index) => {
			if (item && item.actionType === '1' && Array.isArray(item.actionInstructList)) {
				item.actionInstructList.forEach((_instructItem, instructIndex) => {
					void actionParamShow(index, instructIndex, true)
				})
			}
		})
	}

	if (deviceOptions.value.length === 0) void getDevice(null, null)
	if (deviceConfigOption.value.length === 0) void getDeviceConfig('')
	void getSceneList('')
	void getAlarmList('')
})

const getDevice = async (groupId: string | null, name: string | null) => {
	queryDevice.group_id = groupId || null
	queryDevice.device_name = name || null
	const res = (await deviceListAll(queryDevice as unknown as Record<string, unknown>)) as ListResponse<DeviceOption[]>
	deviceOptions.value = res.data || []
}

const getDeviceConfig = async (name: string) => {
	queryDeviceConfig.device_config_name = name || ''
	const res = (await deviceConfigAll(queryDeviceConfig as unknown as Record<string, unknown>)) as ListResponse<DeviceOption[]>
	deviceConfigOption.value = res.data || []
}

const getSceneList = async (name: string) => {
	const params = {
		page: 1,
		page_size: 10,
		name: name || ''
	}
	const res = (await sceneGet(params)) as ListResponse<PagedList<{ id: string; name: string }>>
	sceneList.value = res.data?.list || []
}

const getAlarmList = async (name: string) => {
	const params = {
		page: 1,
		page_size: 10,
		name: name || ''
	}
	const res = (await warningMessageList(params)) as ListResponse<PagedList<{ id: string; name: string }>>
	alarmList.value = res.data?.list || []
}

const actionChange = (actionGroupItem: ActionGroupItem, actionGroupIndex: number, data: string | null) => {
	actionOptions.value.forEach((item) => {
		item.disabled = false
	})

	actionGroupItem.actionType = data
	actionGroupItem.actionInstructList = []
	actionGroupItem.action_type = null
	actionGroupItem.action_target = ''

	if (data === '1') {
		addIfGroupsSubItem(actionGroupIndex)
	}

	emitUpdate()
}

const actionTypeChange = (actionGroupIndex: number, instructIndex: number, data: string | null) => {
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	instructItem.action_type = data
	instructItem.action_target = null
	instructItem.action_param_type = null
	instructItem.action_param = null
	instructItem.actionValue = null

	if (data === '10') {
		if (deviceOptions.value.length === 0) void getDevice(null, null)
	} else if (data === '11') {
		if (deviceConfigOption.value.length === 0) void getDeviceConfig('')
	}

	emitUpdate()
}

const actionTargetChange = (actionGroupIndex: number, instructIndex: number) => {
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	instructItem.action_param_type = null
	instructItem.action_param = null
	instructItem.actionValue = null
	instructItem.actionParamOptionsData = []
	instructItem.actionParamTypeOptions = []
	instructItem.actionParamOptions = []
	void actionParamShow(actionGroupIndex, instructIndex)
	emitUpdate()
}

const actionParamShow = async (actionGroupIndex: number, instructIndex: number, updateOptions = false) => {
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	if (!instructItem.action_target) return

	let res: ListResponse<MetricGroup[]> | null = null
	if (instructItem.action_type === '10') {
		res = (await deviceMetricsMenu({ device_id: instructItem.action_target })) as ListResponse<MetricGroup[]>
	} else if (instructItem.action_type === '11') {
		res = (await deviceConfigMetricsMenu({ device_config_id: instructItem.action_target })) as ListResponse<MetricGroup[]>
	}

	if (!res?.data) return

	res.data.forEach((item) => {
		item.value = item.data_source_type
		item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`

		item.options.forEach((subItem) => {
			subItem.value = subItem.key
			subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`
		})
	})

	instructItem.actionParamOptionsData = res.data
	instructItem.actionParamTypeOptions = res.data.map((item) => {
		return {
			label: item.label,
			value: item.value || item.data_source_type
		}
	})
	instructItem.showSubSelect = true

	if (updateOptions && instructItem.action_param_type) {
		actionParamTypeChange(actionGroupIndex, instructIndex, instructItem.action_param_type, updateOptions)
	}
	if (updateOptions && instructItem.action_param) {
		actionParamChange(actionGroupIndex, instructIndex, instructItem.action_param, updateOptions)
	}
}

const actionParamTypeChange = (
	actionGroupIndex: number,
	instructIndex: number,
	data: ActionParamType,
	updateOptions?: boolean
) => {
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	instructItem.action_param_type = data

	if (!updateOptions) {
		instructItem.action_param = null
		instructItem.actionParamData = null
	}

	const foundItem = instructItem.actionParamOptionsData.find((item) => item.data_source_type === data)
	instructItem.actionParamOptions = foundItem ? foundItem.options : []
	instructItem.placeholder = placeholderMap[String(data)] || ''
	if (!updateOptions) instructItem.actionValue = null

	if (instructItem.action_param_type === 'c_attribute' || instructItem.action_param_type === 'c_telemetry' || instructItem.action_param_type === 'c_command') {
		instructItem.showSubSelect = false
	} else {
		instructItem.showSubSelect = true
	}

	if (!updateOptions) emitUpdate()
}

const actionParamChange = (actionGroupIndex: number, instructIndex: number, data: string | null, updateOptions?: boolean) => {
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	instructItem.action_param = data
	if (!updateOptions) instructItem.actionValue = null

	instructItem.actionParamData = instructItem.actionParamOptions.find((item) => item.key === data) || null
	if (instructItem.actionParamData?.data_type) {
		instructItem.actionParamData.data_type = String(instructItem.actionParamData.data_type).toLowerCase()
	}

	if (!updateOptions) emitUpdate()
}

const actionValueChange = (actionGroupIndex: number, instructIndex: number) => {
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	if (
		instructItem.action_param_type === 'command' ||
		instructItem.action_param_type === 'c_attribute' ||
		instructItem.action_param_type === 'c_telemetry' ||
		instructItem.action_param_type === 'c_command'
	) {
		try {
			const parsed = JSON.parse(String(instructItem.actionValue))
			if (typeof parsed === 'object') {
				instructItem.inputFeedback = ''
				instructItem.inputValidationStatus = undefined
			} else {
				uni.showToast({
					title: t('pages.sceneRuleDetail.jsonFormat') as string,
					icon: 'none'
				})
				instructItem.inputValidationStatus = 'error'
			}
		} catch (_e) {
			uni.showToast({
				title: t('pages.sceneRuleDetail.jsonFormat') as string,
				icon: 'none'
			})
			instructItem.inputValidationStatus = 'error'
		}
	}

	emitUpdate()
}

const addIfGroupsSubItem = (actionGroupIndex: number) => {
	props.actions[actionGroupIndex].actionInstructList.push(createInstructItem())
	emitUpdate()
}

const deleteIfGroupsSubItem = (actionGroupIndex: number, instructIndex: number) => {
	props.actions[actionGroupIndex].actionInstructList.splice(instructIndex, 1)
	emitUpdate()
}

const deleteActionGroupItem = (actionGroupIndex: number) => {
	props.actions.splice(actionGroupIndex, 1)
	emitUpdate()
}

const addActionGroupItem = () => {
	props.actions.push(createActionItem())
	emitUpdate()
}

const onActionTypePickerChange = (e: PickerChangeEvent, actionGroupItem: ActionGroupItem, actionGroupIndex: number) => {
	const index = Number(e.detail.value)
	const selectedValue = actionOptions.value[index] ? actionOptions.value[index].value : null
	actionChange(actionGroupItem, actionGroupIndex, selectedValue)
}

const onDeviceTypePickerChange = (e: PickerChangeEvent, actionGroupIndex: number, instructIndex: number) => {
	const index = Number(e.detail.value)
	const selectedValue = actionTypeOptions.value[index] ? actionTypeOptions.value[index].value : null
	actionTypeChange(actionGroupIndex, instructIndex, selectedValue)
}

const onDevicePickerChange = (e: PickerChangeEvent, actionGroupIndex: number, instructIndex: number) => {
	const index = Number(e.detail.value)
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	instructItem.action_target = deviceOptions.value[index] ? deviceOptions.value[index].id : null
	actionTargetChange(actionGroupIndex, instructIndex)
}

const onDeviceConfigPickerChange = (e: PickerChangeEvent, actionGroupIndex: number, instructIndex: number) => {
	const index = Number(e.detail.value)
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	instructItem.action_target = deviceConfigOption.value[index] ? deviceConfigOption.value[index].id : null
	actionTargetChange(actionGroupIndex, instructIndex)
}

const onActionParamTypePickerChange = (e: PickerChangeEvent, actionGroupIndex: number, instructIndex: number) => {
	const index = Number(e.detail.value)
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	const selectedValue = instructItem.actionParamTypeOptions[index] ? instructItem.actionParamTypeOptions[index].value : null
	actionParamTypeChange(actionGroupIndex, instructIndex, selectedValue)
}

const onActionParamPickerChange = (e: PickerChangeEvent, actionGroupIndex: number, instructIndex: number) => {
	const index = Number(e.detail.value)
	const instructItem = props.actions[actionGroupIndex].actionInstructList[instructIndex]
	const selectedValue = instructItem.actionParamOptions[index] ? instructItem.actionParamOptions[index].key : null
	actionParamChange(actionGroupIndex, instructIndex, selectedValue)
}

const onScenePickerChange = async (e: PickerChangeEvent, actionGroupIndex: number) => {
	const index = Number(e.detail.value)
	const actionGroupItem = props.actions[actionGroupIndex]
	const selectedScene = sceneList.value[index]

	actionGroupItem.action_target = selectedScene ? selectedScene.id : null

	await nextTick()
	emitUpdate()
}

const onAlarmPickerChange = async (e: PickerChangeEvent, actionGroupIndex: number) => {
	const index = Number(e.detail.value)
	const actionGroupItem = props.actions[actionGroupIndex]
	const selectedAlarm = alarmList.value[index]

	actionGroupItem.action_target = selectedAlarm ? selectedAlarm.id : null

	await nextTick()
	emitUpdate()
}

const getRecordValue = (target: unknown, key: string): unknown => {
	if (!target || typeof target !== 'object') return undefined
	return (target as Record<string, unknown>)[key]
}

const getPickerIndex = (options: unknown[], value: unknown, valueKey = 'value') => {
	if (!options || !Array.isArray(options) || options.length === 0) return 0
	if (value === null || value === undefined || value === '') return 0

	const index = options.findIndex((item) => {
		if (!item) return false
		const itemValue = getRecordValue(item, valueKey)
		if (itemValue === value) return true
		if (String(itemValue) === String(value)) return true
		const numItem = Number(itemValue)
		const numValue = Number(value as string | number)
		if (!Number.isNaN(numItem) && !Number.isNaN(numValue) && numItem === numValue) return true
		return false
	})

	return index >= 0 ? index : 0
}

const getPickerDisplayText = (options: unknown[], value: unknown, valueKey = 'value', labelKey = 'label') => {
	if (!options || !Array.isArray(options) || options.length === 0) return ''
	if (value === null || value === undefined || value === '') return ''

	const option = options.find((item) => {
		if (!item) return false
		const itemValue = getRecordValue(item, valueKey)
		if (itemValue === value) return true
		if (String(itemValue) === String(value)) return true
		const numItem = Number(itemValue)
		const numValue = Number(value as string | number)
		if (!Number.isNaN(numItem) && !Number.isNaN(numValue) && numItem === numValue) return true
		return false
	})

	const label = getRecordValue(option, labelKey)
	return label !== undefined && label !== null ? String(label) : ''
}
</script>
  <style>
	@import '@/common/styles/alert-strategy.css';
	
	.action-item-card {
		background: #f5f5f5;
		border-radius: 24rpx;
		padding: 32rpx 28rpx;
    margin-left: 24rpx;
    margin-right: 24rpx;
		margin-bottom: 24rpx;
		position: relative;
	}
	
	.action-item-card:not(:last-child)::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 28rpx;
		right: 28rpx;
		height: 1rpx;
		background-color: rgba(0, 0, 0, 0.1);
	}
	
	.action-item-card .tp-flex-1 {
		margin-right: 24rpx;
	}
	
	.action-item-card .tp-flex-1:last-child {
		margin-right: 0;
	}
	
	.action-item-card .max-w-30,
	.action-item-card .max-w-40,
	.action-item-card .max-w-60 {
		margin-right: 20rpx;
		margin-bottom: 8rpx;
	}
	
	.action-item-card .max-w-30:last-child,
	.action-item-card .max-w-40:last-child,
	.action-item-card .max-w-60:last-child {
		margin-right: 0;
	}
	
	.placeholder {
		color: #999;
	}
	
	.picker-wrapper {
		position: relative;
	}
	
	.picker-wrapper picker {
		flex: 1;
	}
	
	.picker-wrapper .uni-icons {
		margin-left: 8rpx;
		flex-shrink: 0;
	}
  </style>
