<template>
  <view class="">
    <view class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      <CustomSelect
        :placeholder="$t('pages.sceneRuleDetail.alertLevel')"
        :options="levelOptions"
        @change="change"
        v-model="warningStrategy.warning_level"
      ></CustomSelect>
      
    	<CustomSelect
    	  :placeholder="$t('pages.sceneRuleDetail.notificationGroup')"
    	  :options="noticOptions"
    	  @change="change"
    	  optionValue="id"
    	  optionLabel="group_name"
    	  v-model="warningStrategy.inform_way"
    	></CustomSelect>
    </view>
    
    <view class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c">
        <!-- <view class="label">重复次数</view> -->
      	<input class="uni-input" :placeholder="$t('pages.sceneRuleDetail.repeatCount')" v-model.number="warningStrategy.repeat_count"/>
      </view>
    </view>
    
    <view class="item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
      <view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c">
        <!-- <view class="label">告警描述</view> -->
      	<input class="uni-input" :placeholder="$t('pages.sceneRuleDetail.alertDescription')" v-model="warningStrategy.warning_description"/>
      </view>
    </view>
  </view>
  
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomSelect from '@/components/custom-select.vue'
import { useInjected, type ApiResponse } from '@/common/composables/useInjected'

type NoticeGroup = Record<string, unknown>
type NoticeListRes = { data?: NoticeGroup[] }

type WarningStrategy = {
	warning_level?: string | number
	inform_way?: string | number
	repeat_count?: number
	warning_description?: string
	[key: string]: unknown
}

type ActionData = { warning_strategy?: WarningStrategy } & Record<string, unknown>
type Props = {
	data?: { action_type?: string; actions?: ActionData[] }
}

const props = withDefaults(defineProps<Props>(), {
	data: () => ({ action_type: '', actions: [] }),
})

const { data } = toRefs(props)
const { t } = useI18n()
const { apiRequest } = useInjected()

watch(
	() => data.value,
	(n, o) => {
		console.log(12345, n, o)
	},
	{ deep: true }
)

const levelOptions = computed(() => [
	{ value: '1', label: t('pages.sceneRuleDetail.levels.low') },
	{ value: '2', label: t('pages.sceneRuleDetail.levels.medium') },
	{ value: '3', label: t('pages.sceneRuleDetail.levels.high') },
])

const noticOptions = ref<NoticeGroup[]>([])
const warningStrategy = ref<WarningStrategy>((data.value.actions?.[0]?.warning_strategy as WarningStrategy) || {})

const change = () => {}

const queryNoticeOptions = async () => {
	const req = apiRequest as undefined | (<T>(url: string, params: Record<string, unknown>, method: string) => Promise<ApiResponse<T>>)
	if (!req) return

	const params = { current_page: 1, per_page: 999 }
	try {
		const res = await req<NoticeListRes>('/api/notification/list', params, 'post')
		if (res.code == 200) noticOptions.value = res.data.data || []
	} finally {
		uni.hideLoading()
	}
}

onMounted(() => {
	console.log(data.value)
	queryNoticeOptions()
})
</script>

<style scoped>
  @import '@/common/styles/alert-strategy.css';
</style>
