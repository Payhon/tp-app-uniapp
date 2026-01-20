<template>
	<view class="dashboard-gauge">
		<view class="gauge-wrapper">
			<canvas
				class="gauge-canvas"
				:canvas-id="canvasId"
				:id="canvasId"
			/>

			<!-- #ifndef MP-WEIXIN -->
			<view class="content-overlay">
				<view class="values-row">
					<view class="val-item">
						<view class="num-wrap">
							<text class="num-main">{{ socText }}</text>
							<text class="num-unit">%</text>
						</view>
						<text class="val-label">SOC</text>
					</view>

					<view class="val-item">
						<view class="num-wrap">
							<text class="num-main">{{ sohText }}</text>
							<text class="num-unit">%</text>
						</view>
						<text class="val-label">SOH</text>
					</view>
				</view>

				<view class="bottom-slot">
					<slot name="footer"></slot>
				</view>
			</view>
			<!-- #endif -->
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'

type Pt = { x: number; y: number }

type Props = {
	soc?: number
	soh?: number
	footerStateText?: string
	footerMacText?: string
}

const props = withDefaults(defineProps<Props>(), {
	soc: 0,
	soh: 0,
	footerStateText: '',
	footerMacText: '',
})

const instance = getCurrentInstance()
const canvasId = `gauge-${Math.random().toString(16).slice(2)}`

const cssW = ref(0)
const cssH = ref(0)

const socText = computed(() => String(Math.round(props.soc || 0)))
const sohText = computed(() => String(Math.round(props.soh || 0)))

// 虚拟画布坐标系 (加高比例)
const VW = 400
const VH = 240
const TRACK_W = 16

/**
 * 轨道点位定义 (从底部到顶部的路径)
 * 左侧：由下往上
 * 右侧：由下往上
 */
const LEFT_PTS: Pt[] = [
	{ x: 110, y: 210 },
	{ x: 60, y: 210 },
	{ x: 25, y: VH / 2 },
	{ x: 60, y: 30 },
	{ x: 110, y: 30 },
]

const RIGHT_PTS: Pt[] = [
	{ x: 290, y: 210 },
	{ x: 340, y: 210 },
	{ x: 375, y: VH / 2 },
	{ x: 340, y: 30 },
	{ x: 290, y: 30 },
]

// 计算路径段长度
const getDist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)

// 绘制路径逻辑
const drawPath = (ctx: any, pts: Pt[], limitPct: number = 1) => {
	if (pts.length < 2) return
	
	let totalLen = 0
	for (let i = 0; i < pts.length - 1; i++) totalLen += getDist(pts[i], pts[i+1])
	
	const targetLen = totalLen * Math.max(0, Math.min(1, limitPct))
	let currentLen = 0
	
	ctx.beginPath()
	ctx.moveTo(pts[0].x, pts[0].y)
	
	for (let i = 0; i < pts.length - 1; i++) {
		const p1 = pts[i]
		const p2 = pts[i+1]
		const segLen = getDist(p1, p2)
		
		if (currentLen + segLen >= targetLen) {
			const ratio = (targetLen - currentLen) / segLen
			ctx.lineTo(p1.x + (p2.x - p1.x) * ratio, p1.y + (p2.y - p1.y) * ratio)
			break
		}
		
		ctx.lineTo(p2.x, p2.y)
		currentLen += segLen
	}
}

const draw = () => {
	if (!cssW.value || !cssH.value) return
	const ctx = uni.createCanvasContext(canvasId, instance?.proxy as any)
	
	const scale = Math.min(cssW.value / VW, cssH.value / VH)
	const dx = (cssW.value - VW * scale) / 2
	const dy = (cssH.value - VH * scale) / 2
	
	ctx.save()
	ctx.translate(dx, dy)
	ctx.scale(scale, scale)

	// 1. 绘制六边形白色底座 + 阴影
	ctx.save()
	if (typeof ctx.setShadow === 'function') {
		ctx.setShadow(0, 15, 40, 'rgba(0, 40, 110, 0.08)')
	}
	ctx.beginPath()
	const r = 35 // 六边形折角处的圆角感模拟
	ctx.moveTo(75, 10)
	ctx.lineTo(325, 10)
	ctx.quadraticCurveTo(390, 10, 395, VH / 2)
	ctx.quadraticCurveTo(390, VH - 10, 325, VH - 10)
	ctx.lineTo(75, VH - 10)
	ctx.quadraticCurveTo(10, VH - 10, 5, VH / 2)
	ctx.quadraticCurveTo(10, 10, 75, 10)
	ctx.setFillStyle('#FFFFFF')
	ctx.fill()
	ctx.restore()

	// 2. 绘制静止轨道背景
	ctx.setLineCap('round')
	ctx.setLineJoin('round')
	ctx.setLineWidth(TRACK_W)
	ctx.setStrokeStyle('#F5F8FF')
	
	drawPath(ctx, LEFT_PTS)
	ctx.stroke()
	drawPath(ctx, RIGHT_PTS)
	ctx.stroke()

	// 3. 绘制进度条 (由下往上)
	const grad = ctx.createLinearGradient(0, VH - 30, 0, 30)
	grad.addColorStop(0, '#0033CC')
	grad.addColorStop(0.5, '#007BFF')
	grad.addColorStop(1, '#00E5FF')
	
	ctx.setStrokeStyle(grad)
	
	// SOC 进度
	drawPath(ctx, LEFT_PTS, (props.soc || 0) / 100)
	ctx.stroke()
	
	// SOH 进度
	drawPath(ctx, RIGHT_PTS, (props.soh || 0) / 100)
	ctx.stroke()

	// #ifdef MP-WEIXIN
	const soc = socText.value
	const soh = sohText.value
	const stateText = String(props.footerStateText || '')
	const macText = String(props.footerMacText || '')

	ctx.setTextAlign('center')
	ctx.setTextBaseline('middle')

	// SOC
	ctx.setFillStyle('#003399')
	ctx.setFontSize(36)
	ctx.fillText(soc, 140, 120)
	ctx.setFontSize(18)
	ctx.fillText('%', 175, 120)
	ctx.setFillStyle('#4b5563')
	ctx.setFontSize(16)
	ctx.fillText('SOC', 140, 150)

	// SOH
	ctx.setFillStyle('#003399')
	ctx.setFontSize(36)
	ctx.fillText(soh, 260, 120)
	ctx.setFontSize(18)
	ctx.fillText('%', 295, 120)
	ctx.setFillStyle('#4b5563')
	ctx.setFontSize(16)
	ctx.fillText('SOH', 260, 150)

	// Footer texts
	if (stateText) {
		ctx.setFillStyle('#f6a545')
		ctx.setFontSize(14)
		ctx.fillText(stateText, 200, 188)
	}
	if (macText) {
		ctx.setFillStyle('#4b5563')
		ctx.setFontSize(14)
		ctx.fillText(macText, 200, 210)
	}
	// #endif

	ctx.restore()
	ctx.draw()
}

const measure = () => {
	uni.createSelectorQuery()
		.in(instance?.proxy as any)
		.select('.gauge-wrapper')
		.boundingClientRect((rect: any) => {
			if (rect) {
				cssW.value = rect.width
				cssH.value = rect.height
				draw()
			}
		})
		.exec()
}

onMounted(() => {
	setTimeout(measure, 200)
})

watch(() => [props.soc, props.soh, props.footerStateText, props.footerMacText], draw)
</script>

<style lang="scss" scoped>
.dashboard-gauge {
	width: 100%;
}

.gauge-wrapper {
	position: relative;
	width: 100%;
	height: 420rpx; // 调高整体高度
	margin: 0 auto;
}

.gauge-canvas {
	width: 100%;
	height: 100%;
}

.content-overlay {
	position: absolute;
	inset: 0;
	pointer-events: none;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.values-row {
	display: flex;
	justify-content: space-between;
	padding: 0 20%; // 增大左右间距，避免文字贴进度条太近
	margin-top: -30rpx;
}

.val-item {
	display: flex;
	flex-direction: column;
	align-items: center;

	.num-wrap {
		display: flex;
		align-items: baseline;
	}

	.num-main {
		font-size: 76rpx;
		font-weight: 900;
		color: #003399;
		line-height: 1;
		font-family: 'Avenir Next', -apple-system, sans-serif;
	}

	.num-unit {
		font-size: 26rpx;
		color: #003399;
		margin-left: 8rpx;
		font-weight: 800;
	}

	.val-label {
		font-size: 28rpx;
		color: #4b5563;
		font-weight: 800;
		margin-top: 12rpx;
		letter-spacing: 2rpx;
	}
}

.bottom-slot {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 15%;
	display: flex;
	justify-content: center;
}

.gauge-footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14rpx;
}

.state-pill {
	font-size: 24rpx;
	color: #f6a545;
	padding: 8rpx 28rpx;
	background: #fff3e6;
	border-radius: 999px;
	font-weight: 500;
}

.mac {
	font-size: 24rpx;
	color: #4b5563;
	font-family: 'Avenir Next', Helvetica, Arial, sans-serif;
	margin-top: 14rpx;
}
</style>
