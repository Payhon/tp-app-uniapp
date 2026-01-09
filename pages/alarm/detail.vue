<template>
	<view class="page">
		<u-navbar :title="$t('alarm.detailTitle')" :autoBack="true" leftIcon="arrow-left"></u-navbar>

		<view class="content">
			<view class="card">
				<view class="card__top">
					<text class="card__title">{{ deviceTitle }}</text>
					<view class="level" :class="levelClass(detail)">
						<text class="level__icon">!</text>
						<text class="level__text">{{ levelText(detail) }}</text>
					</view>
				</view>

				<view class="card__row">
					<text class="card__label">{{ $t('alarm.alarmTime') }}：</text>
					<text class="card__value">{{ formatDateTime(detail.create_at) }}</text>
				</view>

				<view class="card__row">
					<text class="card__label">{{ $t('alarm.alarmType') }}：</text>
					<text class="card__value">{{ String(detail.alarm_config_name || '-') }}</text>
				</view>

				<view class="card__row card__row--desc">
					<text class="card__label">{{ $t('alarm.alarmDesc') }}：</text>
					<text class="card__desc">{{ alarmDescText }}</text>
				</view>
			</view>

			<view class="card">
				<view class="section__title">{{ $t('alarm.suggestionTitle') }}</view>
				<view v-if="suggestions.length" class="suggestions">
					<view v-for="(s, idx) in suggestions" :key="idx" class="suggestions__item">
						<text class="suggestions__text">{{ idx + 1 }}. {{ s }}</text>
					</view>
				</view>
				<text v-else class="section__empty">-</text>
			</view>

			<view class="card">
				<view class="section__title">{{ $t('alarm.processingRemarkTitle') }}</view>
				<view class="remark">
					<textarea
						class="remark__input"
						v-model="remark"
						:maxlength="200"
						:placeholder="$t('alarm.processingRemarkPlaceholder')"
					></textarea>
					<text class="remark__count">{{ remark.length }}/200</text>
				</view>
			</view>
		</view>

		<view class="footer">
			<u-button
				:text="handled ? $t('alarm.handled') : $t('alarm.finishButton')"
				shape="circle"
				type="primary"
				color="#0B3BFF"
				:disabled="submitting || handled"
				@click="markHandled"
			></u-button>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import { alarmHistoryDetail, handleAlarmHistory } from '@/service/alarm'
import type { AlarmHistoryItem, AlarmLevel } from '@/types/alarm'

const { t } = useI18n()

const id = ref('')
const detail = ref<AlarmHistoryItem>({})
const remark = ref('')
const submitting = ref(false)

const handled = computed(() => String(detail.value?.alarm_status || '').toUpperCase() === 'N')

const deviceTitle = computed(() => {
	const list = Array.isArray(detail.value?.alarm_device_list) ? (detail.value?.alarm_device_list as any[]) : []
	const first = list.length ? list[0] : null
	const name = String(first?.name || '').trim()
	return name || '-'
})

const pad2 = (n: number) => String(n).padStart(2, '0')

const formatDateTime = (iso?: string | null) => {
	if (!iso) return '-'
	const d = new Date(String(iso))
	if (Number.isNaN(d.getTime())) return '-'
	const y = d.getFullYear()
	const m = pad2(d.getMonth() + 1)
	const day = pad2(d.getDate())
	const hh = pad2(d.getHours())
	const mm = pad2(d.getMinutes())
	return `${y}.${m}.${day} ${hh}:${mm}`
}

const levelCode = (item: AlarmHistoryItem) => {
	const level = String(item?.alarm_level || '').trim().toUpperCase()
	if (level === 'H' || level === 'M' || level === 'L') return level as AlarmLevel
	return 'L' as AlarmLevel
}

const levelClass = (item: AlarmHistoryItem) => {
	const code = levelCode(item)
	if (code === 'H') return 'level--h'
	if (code === 'M') return 'level--m'
	return 'level--l'
}

const levelText = (item: AlarmHistoryItem) => {
	const code = levelCode(item)
	return t(`alarm.level.${code}`)
}

const alarmDescText = computed(() => {
	const content = String(detail.value?.content || '').trim()
	const desc = String(detail.value?.description || '').trim()
	return content || desc || '-'
})

const suggestions = computed(() => {
	const raw = String((detail.value as any)?.processing_suggestions || '').trim()
	if (!raw) return []
	return raw
		.split(/\r?\n/)
		.map((x) => String(x || '').trim())
		.filter(Boolean)
})

const loadDetail = async () => {
	if (!id.value) return
	const rsp = await alarmHistoryDetail(id.value)
	if (!rsp || (rsp as any).code !== 200) return
	detail.value = ((rsp as any).data || {}) as AlarmHistoryItem
	remark.value = String((detail.value as any)?.processing_remark || '').slice(0, 200)
}

const markHandled = async () => {
	if (handled.value || submitting.value || !id.value) return
	submitting.value = true
	try {
		const payload: Record<string, unknown> = { id: id.value, processing_remark: remark.value }
		const rsp = await handleAlarmHistory(payload)
		if (!rsp || (rsp as any).code !== 200) {
			uni.showToast({ title: t('alarm.handleFailed'), icon: 'none' })
			return
		}
		uni.showToast({ title: t('alarm.handleSuccess'), icon: 'success' })
		detail.value = { ...detail.value, alarm_status: 'N', processed_at: new Date().toISOString() }
	} finally {
		submitting.value = false
	}
}

onLoad((query) => {
	id.value = String((query as any)?.id || '').trim()
	if (!id.value) {
		uni.showToast({ title: t('auth.toast.missingParams'), icon: 'none' })
		return
	}
	loadDetail()
})
</script>

<style scoped lang="scss">
.page {
	min-height: 100vh;
	background: #f5f6f8;
}

.content {
	padding: 24rpx 24rpx 160rpx;
}

.card {
	background: #ffffff;
	border-radius: 18rpx;
	padding: 26rpx 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	margin-bottom: 22rpx;
}

.card__top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 18rpx;
}

.card__title {
	font-size: 30rpx;
	color: #1a1a1a;
	font-weight: 600;
	max-width: 460rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.level {
	display: flex;
	align-items: center;
	padding: 6rpx 14rpx;
	border-radius: 999rpx;
}

.level__icon {
	font-size: 20rpx;
	line-height: 20rpx;
	font-weight: 700;
	margin-right: 8rpx;
}

.level__text {
	font-size: 22rpx;
	font-weight: 600;
}

.level--h {
	background: rgba(255, 77, 79, 0.12);
	color: #ff4d4f;
}

.level--m {
	background: rgba(255, 153, 0, 0.12);
	color: #ff9900;
}

.level--l {
	background: rgba(255, 200, 0, 0.14);
	color: #f4b400;
}

.card__row {
	display: flex;
	align-items: flex-start;
	margin-top: 10rpx;
}

.card__row--desc {
	margin-top: 14rpx;
}

.card__label {
	font-size: 26rpx;
	color: #999999;
	white-space: nowrap;
}

.card__value {
	font-size: 26rpx;
	color: #1a1a1a;
}

.card__desc {
	font-size: 26rpx;
	color: #ff4d4f;
	line-height: 38rpx;
}

.section__title {
	font-size: 30rpx;
	font-weight: 700;
	color: #1a1a1a;
	margin-bottom: 18rpx;
}

.section__empty {
	color: #999999;
	font-size: 26rpx;
}

.suggestions__item {
	margin-top: 10rpx;
}

.suggestions__text {
	font-size: 26rpx;
	color: #666666;
	line-height: 38rpx;
}

.remark {
	position: relative;
}

.remark__input {
	width: 100%;
	min-height: 240rpx;
	background: #f7f7f7;
	border-radius: 14rpx;
	padding: 18rpx 18rpx 48rpx;
	font-size: 26rpx;
	color: #1a1a1a;
	box-sizing: border-box;
}

.remark__count {
	position: absolute;
	right: 18rpx;
	bottom: 14rpx;
	font-size: 24rpx;
	color: #999999;
}

.footer {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 24rpx 24rpx 40rpx;
	background: transparent;
}
</style>
