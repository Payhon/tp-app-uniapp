<template>
  <view>
    <view class=" tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing">
    	<CustomSelect
    	  :placeholder="$t('pages.sceneSelect.placeholder')"
    	  :options="sceneOptions"
    	  @change="change"
    	  optionValue="id"
    	  optionLabel="scenario_name"
    	  v-model="data.actions[0].scenario_strategy_id"
    	></CustomSelect>
    </view>
  </view>
  
</template>

<script setup lang="ts">
import { onMounted, ref, toRefs, watch } from 'vue'
import CustomSelect from '@/components/custom-select.vue'
import { useInjected, type ApiResponse } from '@/common/composables/useInjected'

type SceneItem = Record<string, unknown>
type SceneListRes = { data?: SceneItem[] }

type Props = {
	data?: { action_type?: string; actions?: Array<Record<string, any>> }
	test?: string
}

const props = withDefaults(defineProps<Props>(), {
	data: () => ({ action_type: '', actions: [] }),
})

const { data } = toRefs(props)
const { apiRequest } = useInjected()

const sceneOptions = ref<SceneItem[]>([])

watch(
	() => data.value,
	(n, o) => {
		console.log(n, o)
	},
	{ deep: true }
)

const change = () => {}

const querySceneOptions = async () => {
	const req = apiRequest as undefined | (<T>(url: string, params: Record<string, unknown>, method: string) => Promise<ApiResponse<T>>)
	if (!req) return

	const params = { page: 1, page_size: 999 }
	try {
		const res = await req<SceneListRes>('/api/v1/scene', params, 'get')
		if (res.code == 200) sceneOptions.value = res.data.data || []
	} finally {
		uni.hideLoading()
	}
}

onMounted(() => {
	querySceneOptions()
	console.log(123, data.value)
})
</script>

<style scoped>
  @import '@/common/styles/alert-strategy.css';
</style>
