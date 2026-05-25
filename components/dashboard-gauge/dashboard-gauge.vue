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
				<view class="top-voltage" v-if="totalVoltageText">
					<text class="top-voltage__label">{{ totalVoltageLabelText }}</text>
					<text class="top-voltage__value">{{ totalVoltageText }}</text>
				</view>

				<view class="values-row">
					<view class="val-item">
						<view class="num-wrap">
							<text class="num-main">{{ socText }}</text>
							<text class="num-unit">%</text>
						</view>
						<text class="val-label">SOC</text>
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
import i18n from '@/lang'

type Pt = { x: number; y: number }

type Props = {
	soc?: number
	soh?: number
	totalVoltageText?: string
	totalVoltageLabel?: string
	footerStateText?: string
	footerMacText?: string
}

const props = withDefaults(defineProps<Props>(), {
	soc: 0,
	soh: 0,
	totalVoltageText: '',
	totalVoltageLabel: '',
	footerStateText: '',
	footerMacText: '',
})

const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params as any) as string

const instance = getCurrentInstance()
const canvasId = `gauge-${Math.random().toString(16).slice(2)}`

const cssW = ref(0)
const cssH = ref(0)

const socText = computed(() => String(Math.round(props.soc || 0)))
const totalVoltageLabelText = computed(() => props.totalVoltageLabel || t('components.dashboardGauge.totalVoltageLabel'))

type CubicSegment = {
	p0: Pt
	c1: Pt
	c2: Pt
	p1: Pt
}

// 虚拟画布坐标系 (加高比例)
const VW = 400
const VH = 240
const TRACK_W = 16

const LEFT_CURVES: CubicSegment[] = [
	{
		p0: { x: 104, y: 206 },
		c1: { x: 62, y: 206 },
		c2: { x: 28, y: 176 },
		p1: { x: 28, y: 120 },
	},
	{
		p0: { x: 28, y: 120 },
		c1: { x: 28, y: 64 },
		c2: { x: 62, y: 34 },
		p1: { x: 104, y: 34 },
	},
]

const RIGHT_CURVES: CubicSegment[] = [
	{
		p0: { x: 296, y: 206 },
		c1: { x: 338, y: 206 },
		c2: { x: 372, y: 176 },
		p1: { x: 372, y: 120 },
	},
	{
		p0: { x: 372, y: 120 },
		c1: { x: 372, y: 64 },
		c2: { x: 338, y: 34 },
		p1: { x: 296, y: 34 },
	},
]

// 计算路径段长度
const getDist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)

const cubicBezierPoint = (seg: CubicSegment, t: number): Pt => {
	const mt = 1 - t
	const mt2 = mt * mt
	const t2 = t * t
	return {
		x:
			mt2 * mt * seg.p0.x +
			3 * mt2 * t * seg.c1.x +
			3 * mt * t2 * seg.c2.x +
			t2 * t * seg.p1.x,
		y:
			mt2 * mt * seg.p0.y +
			3 * mt2 * t * seg.c1.y +
			3 * mt * t2 * seg.c2.y +
			t2 * t * seg.p1.y,
	}
}

const sampleCurvePath = (curves: CubicSegment[], precision = 24): Pt[] => {
	const pts: Pt[] = []
	curves.forEach((seg, segIndex) => {
		for (let i = 0; i <= precision; i += 1) {
			if (segIndex > 0 && i === 0) continue
			pts.push(cubicBezierPoint(seg, i / precision))
		}
	})
	return pts
}

const LEFT_PTS = sampleCurvePath(LEFT_CURVES)
const RIGHT_PTS = sampleCurvePath(RIGHT_CURVES)

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
	
	// 右侧进度同样显示 SOC
	drawPath(ctx, RIGHT_PTS, (props.soc || 0) / 100)
	ctx.stroke()

	// #ifdef MP-WEIXIN
	const soc = socText.value
	const totalVoltageText = String(props.totalVoltageText || '')
	const totalVoltageLabel = String(totalVoltageLabelText.value || '')
	const stateText = String(props.footerStateText || '')
	const macText = String(props.footerMacText || '')

	ctx.setTextAlign('center')
	ctx.setTextBaseline('middle')

	if (totalVoltageText) {
		ctx.setFillStyle('#7A869A')
		ctx.setFontSize(13)
		ctx.fillText(totalVoltageLabel, 200, 42)
		ctx.setFillStyle('#0F172A')
		ctx.setFontSize(24)
		ctx.fillText(totalVoltageText, 200, 68)
	}

	// SOC
	ctx.setFillStyle('#003399')
	ctx.setFontSize(36)
	ctx.fillText(soc, 200, 120)
	ctx.setFontSize(18)
	ctx.fillText('%', 235, 120)
	ctx.setFillStyle('#4b5563')
	ctx.setFontSize(16)
	ctx.fillText('SOC', 200, 150)

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

watch(() => [props.soc, props.totalVoltageText, totalVoltageLabelText.value, props.footerStateText, props.footerMacText], draw)
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

.top-voltage {
	position: absolute;
	top: 30rpx;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6rpx;
}

.top-voltage__label {
	font-size: 22rpx;
	color: #7a869a;
	font-weight: 600;
}

.top-voltage__value {
	font-size: 40rpx;
	line-height: 1;
	color: #0f172a;
	font-weight: 800;
	font-family: 'Avenir Next', -apple-system, sans-serif;
}

.values-row {
	display: flex;
	justify-content: center;
	padding: 0;
	margin-top: 12rpx;
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
	bottom: 11%;
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
