<template>
  <view class="fizz-dialog" v-show="visible">
    <view class="mask"></view>
    <view class="conetent">
      <view class="text-center dialog-title">
        {{ $t('components.notifyDialog.confirmText', { action: status === '1' ? $t('components.notifyDialog.process') : $t('components.notifyDialog.ignore') }) }}
      </view>
      <view class="context-container">
        <input class="border-input" type="text" :placeholder="$t('components.notifyDialog.optional')" v-model="content" />
      </view>
      <view class="foot-btn">
        <view class="border-right flex-1" @click="cancle">{{ $t('common.cancel') }}</view>
        <view class="flex-1" @click="confirm">{{ $t('common.confirm') }}</view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { getCurrentInstance, ref, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type Props = {
	visible?: boolean
	alarmId?: string | number
	status?: string | number
}

type ApiResponse = { code: number }

const props = withDefaults(defineProps<Props>(), {
	visible: false,
	alarmId: '',
	status: '',
})

const emit = defineEmits<{
	(e: 'close', refresh?: boolean): void
}>()

const { t } = useI18n()
const content = ref<string>('')
const { visible, alarmId, status } = toRefs(props)

const confirm = async () => {
	// NOTE: API 是项目全局注入（类型取决于注入实现），这里保持渐进式类型，不影响运行逻辑
	const { proxy } = getCurrentInstance() || {}
	const apiRequest = (proxy as any)?.API?.apiRequest as
		| ((url: string, data: Record<string, unknown>, method: string) => Promise<ApiResponse>)
		| undefined

	if (!apiRequest) return

	const res = await apiRequest(
		'/api/v1/alarm/info',
		{
			id: props.alarmId,
			processing_result: props.status,
			processing_instructions: content.value,
		},
		'put'
	)

	if (res?.code === 200) {
		uni.showToast({ title: t('components.notifyDialog.operationSuccess') })
		cancle(true)
	}
}

const cancle = (refresh?: boolean) => {
	emit('close', refresh)
}

watch(
	() => visible.value,
	(val) => {
		if (val) content.value = ''
	}
)
</script>
<style scoped lang="css">
.fizz-dialog .mask{
  position: fixed;
  z-index: 999;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(0,0,0,.5);
}
.fizz-dialog .conetent{
  position: fixed;
  z-index: 999;
  width: 80%;
  max-width: 300px;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%,-50%);
  transform: translate(-50%,-50%);
  background-color: #fff;
  text-align: center;
  border-radius: 3px;
  overflow: hidden;
}
.foot-btn{
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  height: 28px;
  margin-bottom: 5px;
}
.context-container{
  padding: 16px;
}
.border-input{
  border: 1px solid #ddd;
  border-radius: 4px;
  line-height: 32px;
  text-align: left;
  padding: 4px;
}
.dialog-title{
  margin-top: 10px;
}
.border-right{
  border-right: 1px solid #ddd;
}
.flex-1{
  flex: 1;
}
</style>
