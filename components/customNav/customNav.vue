<template>
	<view>
		<!-- <view class="topNav" :style="{ height: topHeight, lineHeight: topHeight, background:background }"> -->
		<view class="topNav" :style="{ background:background }">
			<view class="navIcon" @click="clickLeftBtn" :style="{ marginTop: imgTop }">
				<uni-icons type="back" size="30" :color="iconColor"></uni-icons>
			</view>
			<view class="title" :style="{ paddingTop: paddingTop, color:fontColor}">{{ pageTitle }}</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { getCurrentInstance, nextTick, onMounted, ref, toRefs } from 'vue'
	import { useNavBarMetrics } from '@/common/composables/useNavBarMetrics'

	type Props = {
		iconColor?: string
		pageTitle?: string
		background?: string
		fontColor?: string
	}

	const props = withDefaults(defineProps<Props>(), {
		iconColor: '#fff',
		pageTitle: '',
		background: '#FFFFFF',
		fontColor: '#1B1B1B',
	})
	const { iconColor, pageTitle, background, fontColor } = toRefs(props)

	const { topHeight, paddingTop, imgTop, init } = useNavBarMetrics()
	const height = ref<number>(0)

	const clickLeftBtn = () => {
		uni.navigateBack()
	}

	onMounted(async () => {
		// NOTE: $login 是全局注入（类型取决于项目注入方式），这里保持渐进式类型，不影响运行逻辑
		const { proxy } = getCurrentInstance() || {}
		;(proxy as any)?.$login?.isLoginType?.()

		await nextTick()
		init()

		uni.getSystemInfo({
			success: (res) => {
				height.value = res.screenHeight || 0
			},
		})
	})
</script>

<style scoped lang="scss">
	@import '@/common/styles/topNav.scss';
</style>
