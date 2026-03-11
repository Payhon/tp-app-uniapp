<template>
	<view class="wrap">
		<view class="sum-card">
			<text class="sum-card__v">{{ totalVText }}</text>
			<text class="sum-card__n">{{ cellCountText }}</text>
		</view>

		<view class="grid">
			<view
				v-for="(v, idx) in cellVoltages"
				:key="idx"
				class="cell"
				:class="{ 'cell--hi': idx + 1 === highestIdx, 'cell--low': idx + 1 === lowestIdx }"
			>
				<text class="cell__name">{{ cellNoText(idx + 1) }}</text>
				<text class="cell__v">{{ v }}</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { BmsStatus } from '@/common/lib/bms-protocol/types'

const props = defineProps<{
	status: BmsStatus | null
}>()

const { t } = useI18n()

const cellCount = computed(() => Number(props.status?.meta?.seriesCount || 0))

const totalVText = computed(() => {
	const v = props.status?.electrical?.packCellSumVoltageV
	if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
	if (v >= 1000 || v >= 0xffff) return '-'
	return `${v.toFixed(1)}V`
})

const cellCountText = computed(() => {
	const raw = t('deviceDetail.cells.cellCount', { n: cellCount.value }) as string
	return raw.includes('{n}') ? raw.replace('{n}', String(cellCount.value)) : raw
})

const cellNoText = (n: number) => {
	const raw = t('deviceDetail.cells.cellNo', { n }) as string
	return raw.includes('{n}') ? raw.replace('{n}', String(n)) : raw
}

const highestIdx = computed(() => Number(props.status?.electrical?.cellVoltageIndex?.highest || 0))
const lowestIdx = computed(() => Number(props.status?.electrical?.cellVoltageIndex?.lowest || 0))

const cellVoltages = computed(() => {
	const list = props.status?.cell?.voltagesMv || []
	return list.map((mv) => `${(Number(mv || 0) / 1000).toFixed(2)}V`)
})
</script>

<style lang="scss" scoped>
.wrap {
	padding: 24rpx;
	box-sizing: border-box;
}

.sum-card {
	background: #ffffff;
	border-radius: 22rpx;
	padding: 26rpx 24rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
	text-align: center;
}

.sum-card__v {
	display: block;
	font-size: 44rpx;
	font-weight: 700;
	color: #0b3bff;
}

.sum-card__n {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #9aa0a6;
}

.grid {
	margin-top: 20rpx;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	gap: 18rpx;
}

.cell {
	background: #ffffff;
	border-radius: 18rpx;
	padding: 18rpx 12rpx;
	box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.cell__name {
	font-size: 22rpx;
	color: #9aa0a6;
}

.cell__v {
	font-size: 24rpx;
	font-weight: 600;
	color: #333333;
}

.cell--hi .cell__v {
	color: #ff4d4f;
}

.cell--low .cell__v {
	color: #0b3bff;
}
</style>
