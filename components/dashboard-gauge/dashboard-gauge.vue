<template>
	<view class="dashboard-gauge">
		<view class="gauge-wrapper">
			<canvas
				class="gauge-canvas"
				:canvas-id="canvasId"
				:id="canvasId"
				:width="canvasPxW"
				:height="canvasPxH"
			/>

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
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'

type Props = {
	soc?: number
	soh?: number
}

const props = withDefaults(defineProps<Props>(), {
	soc: 0,
	soh: 0,
})

const instance = getCurrentInstance()
const canvasId = `dashboard-gauge-${Math.random().toString(16).slice(2)}`

const sys = uni.getSystemInfoSync()
const pixelRatio = Number(sys.pixelRatio || 1)

const cssW = ref(0)
const cssH = ref(0)

const canvasPxW = computed(() => Math.max(1, Math.round((cssW.value || 1) * pixelRatio)))
const canvasPxH = computed(() => Math.max(1, Math.round((cssH.value || 1) * pixelRatio)))

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

const socText = computed(() => String(clampPct(Number(props.soc || 0))))
const sohText = computed(() => String(clampPct(Number(props.soh || 0))))

type Pt = { x: number; y: number }

const VIEW_W = 400
const VIEW_H = 220

// 底板：完整六边形轮廓（与设计图一致的外形）
const PLATE_PTS: Pt[] = [
	{ x: 64, y: 12 },
	{ x: 336, y: 12 },
	{ x: 378, y: 110 },
	{ x: 336, y: 208 },
	{ x: 64, y: 208 },
	{ x: 22, y: 110 },
]

// 仪表左右边：与设计稿 SVG 路径一致（进度从底部向上）
const LEFT_PTS: Pt[] = [
	{ x: 110, y: 200 },
	{ x: 70, y: 200 },
	{ x: 30, y: 110 },
	{ x: 70, y: 20 },
	{ x: 110, y: 20 },
]

const RIGHT_PTS: Pt[] = [
	{ x: 290, y: 200 },
	{ x: 330, y: 200 },
	{ x: 370, y: 110 },
	{ x: 330, y: 20 },
	{ x: 290, y: 20 },
]

const OUTLINE_W = 26
const TRACK_W = 14

const setShadow = (ctx: any, offsetX: number, offsetY: number, blur: number, color: string) => {
	if (typeof ctx?.setShadow === 'function') {
		ctx.setShadow(offsetX, offsetY, blur, color)
		return
	}
	try {
		ctx.shadowOffsetX = offsetX
		ctx.shadowOffsetY = offsetY
		ctx.shadowBlur = blur
		ctx.shadowColor = color
	} catch {
		// ignore
	}
}

const clearShadow = (ctx: any) => setShadow(ctx, 0, 0, 0, 'rgba(0,0,0,0)')

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)

const pathLen = (pts: Pt[]) => {
	let total = 0
	for (let i = 0; i < pts.length - 1; i += 1) total += dist(pts[i], pts[i + 1])
	return total
}

const roundedPolygon = (ctx: any, pts: Pt[], r: number) => {
	const n = pts.length
	if (n < 3) return

	const len = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)
	const norm = (x: number, y: number) => {
		const l = Math.hypot(x, y) || 1
		return { x: x / l, y: y / l }
	}
	const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

	for (let i = 0; i < n; i += 1) {
		const p0 = pts[(i - 1 + n) % n]
		const p1 = pts[i]
		const p2 = pts[(i + 1) % n]

		const v1 = { x: p0.x - p1.x, y: p0.y - p1.y }
		const v2 = { x: p2.x - p1.x, y: p2.y - p1.y }
		const u1 = norm(v1.x, v1.y)
		const u2 = norm(v2.x, v2.y)

		const l1 = len(p0, p1)
		const l2 = len(p1, p2)

		const dot = clamp(u1.x * u2.x + u1.y * u2.y, -1, 1)
		const angle = Math.acos(dot) || 0.00001
		const tangent = Math.tan(angle / 2) || 0.00001
		const d = Math.min(l1 / 2, l2 / 2, r / tangent)

		const p1a = { x: p1.x + u1.x * d, y: p1.y + u1.y * d }
		const p1b = { x: p1.x + u2.x * d, y: p1.y + u2.y * d }

		if (i === 0) ctx.moveTo(p1a.x, p1a.y)
		else ctx.lineTo(p1a.x, p1a.y)

		ctx.quadraticCurveTo(p1.x, p1.y, p1b.x, p1b.y)
	}
	ctx.closePath()
}

const drawPolyline = (ctx: any, pts: Pt[]) => {
	ctx.beginPath()
	ctx.moveTo(pts[0].x, pts[0].y)
	for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y)
}

const strokePath = (ctx: any, style: any, width: number) => {
	ctx.setStrokeStyle(style)
	ctx.setLineWidth(width)
	ctx.setLineCap('round')
	ctx.setLineJoin('round')
	ctx.stroke()
}

const drawProgress = (ctx: any, pts: Pt[], pct: number, grad: any) => {
	const p = clamp01(pct)
	if (p <= 0) return
	const total = pathLen(pts)
	let remaining = total * p

	ctx.beginPath()
	ctx.moveTo(pts[0].x, pts[0].y)

	for (let i = 0; i < pts.length - 1; i += 1) {
		const a = pts[i]
		const b = pts[i + 1]
		const seg = dist(a, b)
		if (remaining <= 0) break
		if (remaining >= seg) {
			ctx.lineTo(b.x, b.y)
			remaining -= seg
			continue
		}
		const t = remaining / seg
		ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
		break
	}

	strokePath(ctx, grad, TRACK_W)
}

const draw = () => {
	const w = cssW.value
	const h = cssH.value
	if (!w || !h) return

	const ctx = uni.createCanvasContext(canvasId, instance?.proxy as any)
	ctx.clearRect(0, 0, canvasPxW.value, canvasPxH.value)

	ctx.save()
	if (pixelRatio !== 1) ctx.scale(pixelRatio, pixelRatio)

	const scale = Math.min(w / VIEW_W, h / VIEW_H)
	const tx = (w - VIEW_W * scale) / 2
	const ty = (h - VIEW_H * scale) / 2
	ctx.translate(tx, ty)
	ctx.scale(scale, scale)

	// 渐变：上青下蓝
	const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H)
	grad.addColorStop(0, '#00E5FF')
	grad.addColorStop(1, '#0033CC')

	// 1) 白色底板 + 阴影
	ctx.beginPath()
	roundedPolygon(ctx, PLATE_PTS, 28)
	setShadow(ctx, 0, 14, 28, 'rgba(0, 20, 60, 0.10)')
	ctx.setFillStyle('#FFFFFF')
	ctx.fill()
	clearShadow(ctx)

	// 2) 白色外描边（更贴近设计图的“立体感”）
	drawPolyline(ctx, LEFT_PTS)
	strokePath(ctx, '#FFFFFF', OUTLINE_W)
	drawPolyline(ctx, RIGHT_PTS)
	strokePath(ctx, '#FFFFFF', OUTLINE_W)

	// 3) 轨道
	drawPolyline(ctx, LEFT_PTS)
	strokePath(ctx, '#E3EAFF', TRACK_W)
	drawPolyline(ctx, RIGHT_PTS)
	strokePath(ctx, '#E3EAFF', TRACK_W)

	// 4) 进度
	drawProgress(ctx, LEFT_PTS, Number(props.soc || 0) / 100, grad)
	drawProgress(ctx, RIGHT_PTS, Number(props.soh || 0) / 100, grad)

	ctx.restore()
	ctx.draw()
}

const measure = async () => {
	await nextTick()
	uni.createSelectorQuery()
		.in(instance?.proxy as any)
		.select('.gauge-wrapper')
		.boundingClientRect((rect: any) => {
			if (!rect) return
			cssW.value = Math.max(1, Math.floor(rect.width || 1))
			cssH.value = Math.max(1, Math.floor(rect.height || 1))
			draw()
		})
		.exec()
}

onMounted(() => {
	measure()
})

watch(
	() => [props.soc, props.soh],
	() => draw()
)
</script>

<style lang="scss" scoped>
.dashboard-gauge {
	width: 100%;
}

.gauge-wrapper {
	position: relative;
	width: 100%;
	height: 0;
	padding-top: 55%;
}

.gauge-canvas {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
}

.content-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}

.values-row {
	position: absolute;
	left: 0;
	right: 0;
	top: 24%;
	display: flex;
	justify-content: space-between;
	padding: 0 16%;
	box-sizing: border-box;
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
		font-size: 72rpx;
		font-weight: 800;
		color: #003399;
		font-family: 'Avenir Next', Helvetica, Arial, sans-serif;
	}

	.num-unit {
		font-size: 32rpx;
		color: #003399;
		margin-left: 4rpx;
		font-weight: 600;
	}

	.val-label {
		font-size: 32rpx;
		color: #2d3a4b;
		font-weight: 500;
		margin-top: 8rpx;
	}
}

.bottom-slot {
	position: absolute;
	left: 0;
	right: 0;
	top: 58%;
	display: flex;
	flex-direction: column;
	align-items: center;
}
</style>
