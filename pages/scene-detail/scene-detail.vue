<template>
  <view class="pagehome">
    <view class="tp-box tp-box-sizing tp-flex tp-flex-col">
      <!-- Background Elements for Atmosphere -->
      <view class="bg-glow-1"></view>
      <view class="bg-glow-2"></view>

      <!-- Content Container -->
      <view class="content-wrapper">
        <!-- Scene Info Card -->
        <view class="tp-panel scene-card">
          <view class="tp-ipt-item">
            <view class="input-label">{{ $t('pages.sceneDetail.sceneTitle') }}</view>
            <input
              maxlength="20"
              type="text"
              class="modern-input"
              :placeholder="$t('pages.sceneDetail.sceneTitle')"
              placeholder-class="input-placeholder"
              v-model.trim="formData.info.name"
            />
          </view>
          <view class="tp-ipt-item">
            <view class="input-label">{{ $t('pages.sceneDetail.sceneDescription') }}</view>
            <input
              maxlength="40"
              type="text"
              class="modern-input"
              :placeholder="$t('pages.sceneDetail.sceneDescription')"
              placeholder-class="input-placeholder"
              v-model.trim="formData.info.description"
            />
          </view>
        </view>

        <!-- Actions Card -->
        <view class="tp-panel actions-card">
          <view class="section-header">
            <text class="section-title">{{ $t('pages.sceneDetail.actions') }}</text>
          </view>
	          <actions-edit
	            v-model:actions="formData.actions"
	            :isInSceneEdit="true"
	          ></actions-edit>
        </view>

        <!-- Save Button -->
        <view class="button-wrapper">
          <button class="modern-btn" @tap="handlerSubmit">{{ $t('common.save') }}</button>
        </view>
      </view>

      <Modal 
        v-model="visible" 
        :title="$t('common.save')" 
        :text="$t('pages.sceneDetail.saveConfirm')" 
        @cancel="cancel" 
        @confirm="confirm" 
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import Modal from '@/components/x-modal/x-modal'
import ActionsEdit from './actions-edit.vue'
import { useInjected } from '@/common/composables/useInjected'

type ActionParamType =
	| 'telemetry'
	| 'attributes'
	| 'command'
	| 'c_telemetry'
	| 'c_attribute'
	| 'c_command'
	| string
	| null

interface ActionInstructItem {
	action_target?: string
	action_type?: string | null
	action_param_type?: ActionParamType
	action_param?: string | null
	action_value?: string
	actionValue?: unknown

	deviceGroupId?: string | null
	actionParamOptions?: unknown[]
	actionParamOptionsData?: unknown[]
	actionParamTypeOptions?: unknown[]
	showSubSelect?: boolean
	actionParamData?: unknown
	placeholder?: string
	inputFeedback?: string
	inputValidationStatus?: string

	// 兼容接口返回/历史字段
	[key: string]: unknown
}

interface ActionGroupItem {
	actionType: string
	actionInstructList: ActionInstructItem[]
	action_type?: string

	[key: string]: unknown
}

interface SceneInfo {
	id?: string
	name: string
	description: string
}

interface SceneFormData {
	info: SceneInfo
	actions: ActionGroupItem[]

	// 兼容接口返回/历史字段
	[key: string]: unknown
}

interface SceneDetailResponseData {
	info: SceneInfo
	actions: ActionInstructItem[]
	[key: string]: unknown
}

type SubmitData = SceneInfo & { actions: ActionInstructItem[] }

const { t } = useI18n()
const { apiRequest } = useInjected()

const editId = ref<string>('')

const formData = reactive<SceneFormData>({
	info: {
		name: '',
		description: ''
	},
	actions: []
})

const visible = ref<boolean>(false)
const submitData = ref<SubmitData | null>(null)

const initEmptyForm = () => {
	Object.assign(formData, {
		info: {
			name: '',
			description: ''
		},
		actions: [
			{
				actionType: '1',
				actionInstructList: [
					{
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
					}
				]
			}
		]
	} satisfies SceneFormData)
}

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.addScene') as string
	})
})

onLoad((options) => {
	const opt = options as Record<string, string | undefined>
	editId.value = opt.id || ''

	uni.setNavigationBarTitle({
		title: editId.value ? (t('pages.sceneDetail.editScene') as string) : (t('pages.sceneDetail.newScene') as string)
	})

	if (editId.value) {
		void getInfo()
	} else {
		initEmptyForm()
	}
})

const getInfo = async () => {
	if (!apiRequest) return

	uni.showLoading({
		title: t('common.loading') as string
	})

	try {
		const params = { id: editId.value }
		const res = await apiRequest<SceneDetailResponseData>(`/api/v1/scene/detail/${editId.value}`, params, 'get')
		if (res.code === 200) {
			Object.assign(formData, {
				...res.data,
				actions: convertActionsData(res.data.actions)
			})
		} else {
			uni.showToast({
				title: res.message || '',
				icon: 'none',
				duration: 2000
			})
		}
	} finally {
		uni.hideLoading()
	}
}

const convertActionsData = (actionsData: ActionInstructItem[]) => {
	const actionGroupsData: ActionGroupItem[] = []
	const actionInstructList: ActionInstructItem[] = []

	actionsData.map((item) => {
		if (item.action_type === '10' || item.action_type === '11') {
			item.actionParamOptions = []
			const actionValueObj = JSON.parse(item.action_value as string) as { params?: unknown } & Record<string, unknown>

			if (item.action_param_type === 'c_telemetry' || item.action_param_type === 'c_attribute' || item.action_param_type === 'c_command') {
				item.actionValue = item.action_value
			}
			if (item.action_param_type === 'telemetry' || item.action_param_type === 'attributes') {
				item.actionValue = actionValueObj[item.action_param as string]
			}
			if (item.action_param_type === 'command') {
				item.actionValue = actionValueObj.params
			}

			item.actionParamOptions = []
			actionInstructList.push(item)
		} else {
			item.actionType = item.action_type as string
			actionGroupsData.push(item as unknown as ActionGroupItem)
		}
	})

	if (actionInstructList.length > 0) {
		const type1Data: ActionGroupItem = {
			actionType: '1',
			actionInstructList
		}
		actionGroupsData.push(type1Data)
	}

	return actionGroupsData
}

const handlerSubmit = () => {
	const configFormData = JSON.parse(JSON.stringify(formData.info)) as SceneInfo
	const { name } = formData.info
	const { actions } = formData

	if (!name) {
		uni.showToast({
			title: t('pages.sceneDetail.enterSceneTitle') as string,
			icon: 'none',
			duration: 2000
		})
		return
	}

	const validateResult = transActionsOut(actions)
	;(configFormData as SubmitData).actions = validateResult

	submitData.value = configFormData as SubmitData
	visible.value = true
}

const cancel = () => {
	visible.value = false
}

const confirm = () => {
	if (!submitData.value) return
	void doSubmit(submitData.value)
}

const doSubmit = async (data: SubmitData) => {
	if (!apiRequest) return

	uni.showLoading({
		title: t('common.loading') as string
	})

	try {
		const url = '/api/v1/scene'
		const method = data.id ? 'put' : 'post'

		const res = await apiRequest<unknown>(url, data as unknown as Record<string, unknown>, method)
		if (res.code === 200) {
			uni.navigateBack(-1)
		} else {
			uni.showToast({
				title: res.message || '',
				icon: 'none',
				duration: 2000
			})
		}
	} finally {
		uni.hideLoading()
	}
}

const transActionsOut = (actions: ActionGroupItem[]) => {
	const actionsData: ActionInstructItem[] = []

	// eslint-disable-next-line array-callback-return
	actions.map((item) => {
		if (item.actionType === '1') {
			// eslint-disable-next-line array-callback-return
			item.actionInstructList.map((instructItem) => {
				// 如果是c_telemetry/c_attribute,那么action_value示例格式：{"c_telemetry":2}
				// 如果是c_command,那么action_value示例格式：{"method":"switch1","params":{"false":0}}
				if (
					instructItem.action_param_type === 'c_telemetry' ||
					instructItem.action_param_type === 'c_attribute' ||
					instructItem.action_param_type === 'c_command'
				) {
					instructItem.action_value = instructItem.actionValue as string
				}

				// 如果是telemetry/attribute，那么 action_value示例格式：{"humidity":2}
				if (instructItem.action_param_type === 'telemetry' || instructItem.action_param_type === 'attributes') {
					const action_value: Record<string, unknown> = {}
					action_value[instructItem.action_param as string] = instructItem.actionValue
					instructItem.action_value = JSON.stringify(action_value)
				}

				// 如果是command/c_command，那么 action_value示例格式:	{"method":"ReSet","params":{"switch":1,"light":"close"}}
				if (instructItem.action_param_type === 'command') {
					const action_value = {
						method: instructItem.action_param,
						params: JSON.stringify(JSON.parse(instructItem.actionValue as string))
					}
					instructItem.action_value = JSON.stringify(action_value)
				}

				actionsData.push(instructItem)
			})
		} else {
			item.action_type = item.actionType
			actionsData.push(item as unknown as ActionInstructItem)
		}
	})

	return actionsData
}
</script>

<style lang="scss">
	@import '@/common/styles/alert-strategy.css';
  
  /* Global Reset & Base */
  .pagehome {
    width: 100%;
    min-height: 100vh;
    background: #f5f7fa;
    position: relative;
    overflow: hidden;
  }

  .tp-box {
    width: 100%;
    min-height: 100vh;
    background: #f5f7fa;
    position: relative;
    color: #334155;
    font-size: 28rpx;
    padding-bottom: 40rpx;
  }

  /* Ambient Background Glows */
  .bg-glow-1 {
    position: fixed;
    top: -10%;
    left: -10%;
    width: 700rpx;
    height: 700rpx;
    background: radial-gradient(circle, rgba(100, 108, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
    filter: blur(40px);
  }

  .bg-glow-2 {
    position: fixed;
    bottom: 5%;
    right: -5%;
    width: 600rpx;
    height: 600rpx;
    background: radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
    filter: blur(40px);
  }

  /* Content Wrapper */
  .content-wrapper {
    position: relative;
    z-index: 1;
    padding: 30rpx;
    padding-bottom: 100rpx;
  }

  /* Modern Card Styles */
  .tp-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 32rpx;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.04);
    margin-bottom: 30rpx;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .scene-card {
    padding: 0;
    background: #ffffff;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  }

  .actions-card {
    padding: 30rpx;
  }

  /* Section Header */
  .section-header {
    margin-bottom: 30rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 0.5rpx;
    }
  }

  /* Input Items */
  .tp-ipt-item {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    padding: 30rpx;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20rpx;

    &:last-child {
      border-bottom: none;
    }

    .input-label {
      font-size: 28rpx !important;
      font-weight: 700 !important;
      color: #334155 !important;
      min-width: 140rpx !important;
      flex-shrink: 0 !important;
    }
  }

  /* Modern Input */
  .modern-input {
    flex: 1;
    height: auto;
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    font-size: 28rpx;
    color: #1e293b;
    transition: all 0.3s ease;

    &:focus {
      background: transparent;
      border: none;
      box-shadow: none;
    }
  }

  .input-placeholder {
    color: #94a3b8;
    font-size: 28rpx;
  }

  /* Modern Button */
  .button-wrapper {
    position: relative;
    padding: 40rpx 0;
  }

  .modern-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: #646cff;
    border-radius: 32rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: #ffffff;
    border: none;
    box-shadow: 0 8rpx 24rpx rgba(100, 108, 255, 0.3), 0 2rpx 8rpx rgba(100, 108, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 12rpx rgba(100, 108, 255, 0.25), 0 1rpx 4rpx rgba(100, 108, 255, 0.15);
    }
    
    &::after {
      border: none;
    }
  }

  /* Tooltip */
  .tooltip ::v-deep .uni-tooltip-popup {
    width: max-content;
    left: initial;
    right: 0;
  }
  
  .title {
    font-size: 26rpx;
  }
  
  ::v-deep .uni-input {
    background-color: transparent;
    font-size: 28rpx;
  }

  ::v-deep .uni-input-input {
    color: #1e293b;
  }
  
  ::v-deep .uni-input .uni-input-placeholder.input-placeholder {
    color: #94a3b8;
  }
  
  ::v-deep .uniui-forward, 
  ::v-deep .uniui-clear {
    font-size: 28rpx !important;
    color: #94a3b8 !important;
    vertical-align: middle;
    margin-right: 12rpx;
  }
  
  ::v-deep .uniui-clear {
    font-size: 36rpx !important;
  }
  
  ::v-deep .uni-icons {
    display: block;
  }
  
  uni-text {
    color: #1e293b;
  }
  
  ::v-deep .checklist-text > span {
    font-size: 26rpx;
  }
  
  ::v-deep .item2 {
    border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  }

  ::v-deep .item > .tp-flex-1 + .tp-flex-1 {
    margin-left: 20rpx;
  }

  ::v-deep .item + .item {
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  }
  
  /* 确保弹窗从页面最外层底部弹出 */
  ::v-deep .custom-select-popup .uni-popup {
    position: fixed !important;
    z-index: 99999 !important;
  }
  
  ::v-deep .custom-select-popup .uni-popup.bottom .uni-transition {
    position: fixed !important;
    bottom: 0 !important;
    z-index: 100000 !important;
  }
</style>
