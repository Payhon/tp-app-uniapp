<template>
  <view>
    <view class="tp-mg-l-r-30 action" v-for="(action, index) in actions" :key="action.$index">
      <view class="tp-flex tp-flex-row">
        <view style="align-self: center;" class="tp-panel tp-flex-1 feedback-body">            
          <CustomSelect
            class="item2"
            :placeholder="$t('pages.sceneRuleDetail.actionPlaceholder')"
            :options="getOptions(action.action_type)"
            @change="actionTypeChange($event, index)"
            v-model="action.action_type"
          ></CustomSelect>

          <!-- 操作设备 -->
          <SelectActionDevices class="item2" v-if="action.action_type === '1'" :data="action"></SelectActionDevices>

          <!-- 触发告警 -->
          <SelectNotice class="item2" v-if="action.action_type === '2'" :data="action"></SelectNotice>

          <!-- 激活场景 -->
          <SelectScene class="item2" v-if="action.action_type === '3'" :data="action"></SelectScene>
        </view>
        
        <view style="width:64rpx" class="tp-flex tp-flex-col tp-flex-j-c tp-mg-l-10">
          <!-- 条件数量大于1条时才允许删除 -->
          <uni-icons 
            v-if="actions.length > 1" 
            class="tp-mg-t-b-10"
            type="minus" 
            size="40rpx" 
            color="red"
            @click="removeAction(action, index)"
          ></uni-icons>
          
          <uni-icons
            v-if="actions.length < 3"
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
    <cys-toast ref="toastRef" :msg="toast.msg" location="top"></cys-toast>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomSelect from '@/components/custom-select.vue'
import SelectScene from './select-scene.vue'
import SelectNotice from './select-notice.vue'
import SelectActionDevices from './select-action-devices.vue'

type ActionType = '' | '1' | '2' | '3'

type WarningStrategy = Record<string, unknown> & {
	id?: string | number
	warning_level?: string | number
	inform_way?: string | number
	repeat_count?: number
	warning_description?: string
}

type RawAction = Record<string, any> & {
	$index?: number
	action_type?: ActionType
	business_id?: string
	asset_id?: string
	device_id?: string
	device_condition_type?: string
	v1?: string
	v3?: any
	scenario_strategy_id?: string | number
	warning_strategy?: WarningStrategy
	group_number?: number
	id?: string | number
}

type ActionGroup = {
	$index: number
	action_type: ActionType
	actions: RawAction[]
}

type Props = {
	list?: RawAction[]
}

const props = withDefaults(defineProps<Props>(), {
	list: () => [],
})

const { t } = useI18n()

const toast = ref<{ msg: string }>({ msg: '' })
const toastRef = ref<any>(null)

const actions = ref<ActionGroup[]>([])

const actionTypeOptions = computed(() => [
	{ value: '1', label: t('pages.sceneRuleDetail.actionType1') },
	{ value: '2', label: t('pages.sceneRuleDetail.actionType2') },
	{ value: '3', label: t('pages.sceneRuleDetail.actionType3') },
])

const getOptions = (action_type: ActionType) => {
	console.log(action_type)
	if (!actions.value.length) return actionTypeOptions.value
	const options = actionTypeOptions.value.filter((opt) => !(opt.value !== action_type && actions.value.findIndex((it) => it.action_type === opt.value) >= 0))
	console.log(options)
	return options
}

const initActions = (list: RawAction[]) => {
	const cloned = JSON.parse(JSON.stringify(list || [])) as RawAction[]
	const out: ActionGroup[] = []
	const actionTypeList = new Set(
		cloned.map((action) => {
			action.$index = Math.random()
			return action.action_type
		})
	)
	actionTypeList.forEach((actionType) => {
		out.push({
			$index: Math.random(),
			action_type: (actionType as ActionType) || '',
			actions: cloned.filter((a) => a.action_type === actionType),
		})
	})
	actions.value = out
	console.log('initActions', actions.value)
}

const actionTypeChange = (action_type: ActionType, index: number) => {
	console.log(action_type, index)
	const action = actions.value[index] || ({} as ActionGroup)
	actions.value[index] = {
		$index: Math.random(),
		action_type,
		actions: [
			{
				action_type,
				$index: (action as any).$index,
				business_id: '',
				asset_id: '',
				device_id: '',
				device_action_type: '',
				v1: '',
				v2: '',
				v3: '',
				v4: '',
				v5: '',
				remark: '',
				group_number: (action as any).group_number,
				id: (action as any).id,
				warning_strategy: {},
			},
		],
	}
}

const removeAction = (currAction: ActionGroup, index: number) => {
	actions.value.splice(index, 1)
}

const addAction = (currAction: ActionGroup, index: number) => {
	console.log(1234)
	actions.value.splice(index + 1, 0, {
		$index: Math.random(),
		action_type: '',
		actions: [{ $index: Math.random(), warning_strategy: {} }],
	})
}

const submitData = (list: RawAction[]) =>
	list.map((action) => {
		const { action_type, device_id, device_condition_type, v1, v3, warning_strategy, scenario_strategy_id } = action
		const result: Record<string, unknown> = { action_type }
		if (action_type === '1') {
			result.device_id = device_id
			result.additional_info = JSON.stringify({
				device_model: device_condition_type,
				instruct: { [String(v1 || '')]: v3 },
			})
		} else if (action_type === '2') {
			const { id, warning_level, inform_way, repeat_count, warning_description } = warning_strategy || {}
			console.log(warning_strategy)
			result.warning_strategy = {
				id,
				warning_level,
				inform_way: (inform_way as any) || undefined,
				repeat_count: (repeat_count as any) || undefined,
				warning_description: (warning_description as any) || undefined,
			}
		} else if (action_type === '3') {
			result.scenario_strategy_id = scenario_strategy_id
		}
		return JSON.parse(JSON.stringify(result))
	})

const getActionsData = () => {
	let msg = ''
	let flat = JSON.parse(JSON.stringify(actions.value)) as ActionGroup[]
	const list = flat.map((g) => g.actions).flat()
	console.log(list)

	for (let i = 0; i < list.length; i += 1) {
		const action = list[i]
		console.log('action' + i, action)
		const { action_type, business_id, asset_id, device_id, device_condition_type, v1, v3, scenario_strategy_id } = action
		if (!action_type) {
			msg = t('pages.sceneRuleDetail.selectActionType')
			break
		} else if (action_type === '1') {
			if (!business_id || !asset_id || !device_id || !device_condition_type || !v1 || (!v3 && v3 !== 0)) {
				msg = t('pages.sceneRuleDetail.completeDeviceInfo')
				break
			}
		} else if (action_type === '2') {
			const { warning_level, inform_way } = action.warning_strategy || {}
			if (!warning_level) {
				msg = t('pages.sceneRuleDetail.completeWarningInfo')
				break
			}
			if (!inform_way) {
				msg = t('pages.sceneRuleDetail.completeNotificationInfo')
				break
			}
		} else if (action_type === '3') {
			if (!scenario_strategy_id) {
				msg = t('pages.sceneRuleDetail.completeSceneInfo')
				break
			}
		} else {
			msg = t('pages.sceneRuleDetail.unknownActionType')
			break
		}
	}

	if (msg) return { result: msg }
	return { result: true, actions: submitData(list) }
}

defineExpose({ getActionsData })

watch(
	() => props.list,
	(n) => initActions(n || []),
	{ immediate: true, deep: true }
)

onMounted(() => {
	console.log(props.list, actions.value)
})
</script>

<style scoped>
  @import '@/common/styles/alert-strategy.css';
  
  .action + .action {
    margin-top: 20rpx;
  }
</style>
