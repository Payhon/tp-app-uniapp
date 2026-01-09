<template>
	<view class="wrap" :style="{ width: size + 'rpx', height: size + 'rpx' }">
		<canvas
			class="cvs"
			:canvas-id="canvasId"
			:id="canvasId"
			:style="{ width: size + 'rpx', height: size + 'rpx' }"
			:width="canvasPx"
			:height="canvasPx"
		/>
		<view class="txt">
			<view class="pct">
				<text class="pct__num">{{ percentText }}</text>
				<text class="pct__unit">%</text>
			</view>
			<text class="lbl">{{ label }}</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'

const props = defineProps<{
	value: number
	label: string
	direction?: 'left' | 'right'
	size?: number // rpx
}>()

const instance = getCurrentInstance()
const canvasId = `side-gauge-${Math.random().toString(16).slice(2)}`

const size = computed(() => Number(props.size || 250))

const sys = uni.getSystemInfoSync()
const rpx2px = sys.screenWidth / 750
const pixelRatio = Number(sys.pixelRatio || 1)

const canvasCssPx = computed(() => Math.max(1, Math.round(size.value * rpx2px)))
const canvasPx = computed(() => Math.max(1, Math.round(canvasCssPx.value * pixelRatio)))

const percentText = computed(() => {
	const v = Number(props.value || 0)
	if (!Number.isFinite(v)) return '0'
	return String(Math.max(0, Math.min(100, Math.round(v))))
})

const draw = () => {
	const ctx = uni.createCanvasContext(canvasId, instance?.proxy as any)
	const w = canvasCssPx.value
	const h = canvasCssPx.value
	const cx = w / 2
	const cy = h / 2

	// 清空
	ctx.clearRect(0, 0, w, h)

	// 适配高分屏
	if (pixelRatio !== 1) ctx.scale(pixelRatio, pixelRatio)

	const stroke = Math.max(8, w * 0.08)
	const radius = w / 2 - stroke / 2 - 2

	const dir = props.direction || 'left'
	const start = dir === 'left' ? (Math.PI * 2) / 3 : (-Math.PI * 1) / 3
	const end = dir === 'left' ? (Math.PI * 4) / 3 : Math.PI / 3

	const pct = Math.max(0, Math.min(100, Number(props.value || 0))) / 100
	const progEnd = start + (end - start) * pct

	// bg arc
	ctx.setLineWidth(stroke)
	ctx.setLineCap('round')
	ctx.setStrokeStyle('rgba(230,231,235,0.9)')
	ctx.beginPath()
	ctx.arc(cx, cy, radius, start, end, false)
	ctx.stroke()

	// fg arc (gradient)
	const grad = ctx.createLinearGradient(0, 0, 0, h)
	grad.addColorStop(0, '#00C2FF')
	grad.addColorStop(1, '#0B2DFF')
	ctx.setStrokeStyle(grad as any)
	ctx.beginPath()
	ctx.arc(cx, cy, radius, start, progEnd, false)
	ctx.stroke()

	ctx.draw()
}

onMounted(() => draw())

watch(
	() => [props.value, props.direction, props.size],
	() => draw()
)
</script>

<style lang="scss" scoped>
.wrap {
	position: relative;
}

.cvs {
	display: block;
}

.txt {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
}

.pct {
	display: flex;
	align-items: flex-end;
	gap: 4rpx;
}

.pct__num {
	font-size: 46rpx;
	font-weight: 800;
	color: #0b2dff;
}

.pct__unit {
	font-size: 24rpx;
	font-weight: 700;
	color: #0b2dff;
	padding-bottom: 8rpx;
}

.lbl {
	font-size: 24rpx;
	color: #2d3a4b;
	letter-spacing: 2rpx;
}
</style>

