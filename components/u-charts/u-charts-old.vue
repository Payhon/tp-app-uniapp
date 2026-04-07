<template>
	<canvas v-if="canvasId" :id="canvasId" :canvasId="canvasId" :style="{'width':cWidth*pixelRatio+'px','height':cHeight*pixelRatio+'px', 'transform': 'scale('+(1/pixelRatio)+')','margin-left':-cWidth*(pixelRatio-1)/2+'px','margin-top':-cHeight*(pixelRatio-1)/2+'px'}"
	 @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd" @error="error">
	</canvas>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted } from 'vue'
import i18n from '@/lang'

// NOTE: 旧版封装（uCharts 依赖 $this 取 canvas 上下文），保留行为但用 Vue3 setup 写法
import uCharts from '@/js_sdk/u-charts/u-charts.js'

type AnyRecord = Record<string, any>
const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params as any) as string

const props = withDefaults(
	defineProps<{
		chartType: string
		opts: AnyRecord
		canvasId?: string
		cWidth?: number
		cHeight?: number
		pixelRatio?: number
	}>(),
	{
		chartType: 'column',
		canvasId: 'u-canvas',
		cWidth: 375,
		cHeight: 250,
		pixelRatio: 1
	}
)

const canvases: Record<string, any> = {}
const proxy = (getCurrentInstance()?.proxy as any) || null

const initColumnChart = () => {
	canvases[props.canvasId] = new (uCharts as any)({
		$this: proxy,
		canvasId: props.canvasId,
		type: 'column',
		legend: true,
		fontSize: 11,
		background: '#FFFFFF',
		pixelRatio: props.pixelRatio,
		animation: true,
		categories: props.opts?.categories,
		series: props.opts?.series,
		enableScroll: true,
		xAxis: {
			disableGrid: true,
			itemCount: 4,
			scrollShow: true
		},
		yAxis: {},
		dataLabel: true,
		width: (props.cWidth || 0) * (props.pixelRatio || 1),
		height: (props.cHeight || 0) * (props.pixelRatio || 1),
		extra: {
			column: { type: 'group' }
		}
	})
}

const initLineChart = () => {
	canvases[props.canvasId] = new (uCharts as any)({
		$this: proxy,
		canvasId: props.canvasId,
		type: 'line',
		fontSize: 11,
		legend: true,
		dataLabel: false,
		dataPointShape: true,
		background: '#FFFFFF',
		pixelRatio: props.pixelRatio,
		categories: props.opts?.categories,
		series: props.opts?.series,
		animation: true,
		enableScroll: true,
		xAxis: {
			type: 'grid',
			gridColor: '#CCCCCC',
			gridType: 'dash',
			dashLength: 8,
			itemCount: 4,
			scrollShow: true
		},
		yAxis: {
			gridType: 'dash',
			gridColor: '#CCCCCC',
			dashLength: 8,
			splitNumber: 5,
			min: 10,
			max: 180,
			format: (val: number) => {
				return val.toFixed(0) + t('components.uCharts.currencyUnit')
			}
		},
		width: (props.cWidth || 0) * (props.pixelRatio || 1),
		height: (props.cHeight || 0) * (props.pixelRatio || 1),
		extra: {
			line: { type: 'straight' }
		}
	})
}

const init = () => {
	switch (props.chartType) {
		case 'column':
			initColumnChart()
			break
		case 'line':
			initLineChart()
			break
		default:
			break
	}
}

onMounted(() => {
	init()
})

// 这里仅作为示例传入两个参数，cid为canvas-id,newdata为更新的数据，需要更多参数请自行修改
const changeData = (cid: string, newdata: AnyRecord) => {
	canvases[cid]?.updateData?.({
		series: newdata.series,
		categories: newdata.categories
	})
}

const touchStart = (e: unknown) => {
	const chart = canvases[props.canvasId]
	chart?.showToolTip?.(e, {
		format: function (item: any, category: any) {
			return category + ' ' + item.name + ':' + item.data
		}
	})
	chart?.scrollStart?.(e)
}

const touchMove = (e: unknown) => {
	canvases[props.canvasId]?.scroll?.(e)
}

const touchEnd = (e: unknown) => {
	canvases[props.canvasId]?.scrollEnd?.(e)
}

const error = (e: unknown) => {
	// eslint-disable-next-line no-console
	console.log(e)
}

defineExpose({
	changeData
})
</script>

<style scoped>
	.charts {
		width: 100%;
		height: 100%;
		flex: 1;
		background-color: #FFFFFF;
	}
</style>
