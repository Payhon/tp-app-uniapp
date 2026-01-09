<template>
	<view class="page">
		<u-navbar :title="$t('pages.alarmDevices')" :autoBack="true" leftIcon="arrow-left">
			<template #right>
				<image class="navbar-filter" src="/static/image/home/icon-filter@2x.png" mode="aspectFit" @tap="openFilter" />
			</template>
		</u-navbar>

		<view class="tabs">
			<view class="tabs__item" :class="{ active: activeTab === 'unhandled' }" @tap="switchTab('unhandled')">
				<text class="tabs__text">{{ $t('alarm.tabUnhandled') }}</text>
				<view v-if="activeTab === 'unhandled'" class="tabs__line"></view>
			</view>
			<view class="tabs__item" :class="{ active: activeTab === 'handled' }" @tap="switchTab('handled')">
				<text class="tabs__text">{{ $t('alarm.tabHandled') }}</text>
				<view v-if="activeTab === 'handled'" class="tabs__line"></view>
			</view>
		</view>

		<scroll-view class="list" scroll-y @scrolltolower="loadMore">
			<view class="list__inner">
				<view v-for="item in items" :key="String(item.id || '')" class="card" @tap="goDetail(item)">
					<view class="card__top">
						<text class="card__title">{{ getDeviceTitle(item) }}</text>
						<view class="level" :class="levelClass(item)">
							<text class="level__icon">!</text>
							<text class="level__text">{{ levelText(item) }}</text>
						</view>
					</view>

					<view class="card__row">
						<text class="card__label">{{ $t('alarm.alarmTime') }}：</text>
						<text class="card__value">{{ formatDateTime(item.create_at) }}</text>
					</view>

					<view class="card__row">
						<text class="card__label">{{ $t('alarm.alarmType') }}：</text>
						<text class="card__value">{{ String(item.alarm_config_name || '-') }}</text>
					</view>
				</view>

				<view v-if="!loading && !items.length" class="empty">
					<text class="empty__text">{{ $t('common.noData') }}</text>
				</view>

				<view v-if="items.length" class="footer">
					<text v-if="loading" class="footer__text">{{ $t('common.loading') }}</text>
					<text v-else-if="!hasMore" class="footer__text">{{ $t('alarm.noMore') }}</text>
				</view>
			</view>
		</scroll-view>

		<u-popup :show="filterVisible" mode="bottom" :round="16" @close="onFilterCancel">
			<view class="filter">
				<view class="filter__header">
					<text class="filter__btn" @tap="onFilterCancel">{{ $t('common.cancel') }}</text>
					<text class="filter__title">{{ $t('alarm.filterTitle') }}</text>
					<text class="filter__btn filter__btn--primary" @tap="onFilterConfirm">{{ $t('common.confirm') }}</text>
				</view>
				<view class="filter__body">
					<view
						v-for="opt in levelOptions"
						:key="opt.value"
						class="filter__item"
						:class="{ active: pendingLevel === opt.value }"
						@tap="pendingLevel = opt.value"
					>
						<text class="filter__item-text">{{ opt.label }}</text>
					</view>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import { alarmHistory } from '@/service/alarm'
import type { AlarmHistoryItem, AlarmHistoryListResp, AlarmLevel } from '@/types/alarm'

type TabKey = 'unhandled' | 'handled'
type LevelFilter = AlarmLevel | 'ALL'

const activeTab = ref<TabKey>('unhandled')
const filterVisible = ref(false)

const selectedLevel = ref<LevelFilter>('ALL')
const pendingLevel = ref<LevelFilter>('ALL')

const items = ref<AlarmHistoryItem[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)

const { t } = useI18n()

const hasMore = computed(() => items.value.length < total.value)

const levelOptions = computed(() => [
	{ value: 'ALL' as const, label: t('alarm.levelAll') },
	{ value: 'H' as const, label: t('alarm.level.H') },
	{ value: 'M' as const, label: t('alarm.level.M') },
	{ value: 'L' as const, label: t('alarm.level.L') }
])

const openFilter = () => {
	pendingLevel.value = selectedLevel.value
	filterVisible.value = true
}

const onFilterCancel = () => {
	filterVisible.value = false
}

const onFilterConfirm = () => {
	filterVisible.value = false
	if (selectedLevel.value === pendingLevel.value) return
	selectedLevel.value = pendingLevel.value
	loadFirstPage()
}

const switchTab = (tab: TabKey) => {
	if (activeTab.value === tab) return
	activeTab.value = tab
	loadFirstPage()
}

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

const getDeviceTitle = (item: AlarmHistoryItem) => {
	const list = Array.isArray(item?.alarm_device_list) ? (item.alarm_device_list as any[]) : []
	const first = list.length ? list[0] : null
	const name = String(first?.name || '').trim()
	return name || '-'
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

const buildQuery = (pageNo: number) => {
	const handled = activeTab.value === 'handled'
	const params: Record<string, unknown> = {
		page: pageNo,
		page_size: pageSize,
		handled
	}
	if (selectedLevel.value !== 'ALL') {
		params.alarm_level = selectedLevel.value
	}
	return params
}

const loadFirstPage = async () => {
	page.value = 1
	total.value = 0
	items.value = []
	await loadMore()
}

const loadMore = async () => {
	if (loading.value) return
	if (page.value !== 1 && !hasMore.value) return
	loading.value = true
	try {
		const rsp = await alarmHistory(buildQuery(page.value))
		if (!rsp || (rsp as any).code !== 200) return
		const data = ((rsp as any).data || {}) as AlarmHistoryListResp
		const list = Array.isArray(data.list) ? data.list : []
		total.value = Number(data.total || 0)
		items.value = page.value === 1 ? list : items.value.concat(list)
		page.value += 1
	} finally {
		loading.value = false
	}
}

const goDetail = (item: AlarmHistoryItem) => {
	const id = String(item?.id || '').trim()
	if (!id) return
	uni.navigateTo({ url: `/pages/alarm/detail?id=${encodeURIComponent(id)}` })
}

onShow(() => loadFirstPage())
</script>

<style scoped lang="scss">
.page {
	min-height: 100vh;
	background: #f5f6f8;
	display: flex;
	flex-direction: column;
}

.navbar-filter {
	width: 44rpx;
	height: 44rpx;
	margin-right: 20rpx;
}

.tabs {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: #ffffff;
	padding: 18rpx 0 0;
}

.tabs__item {
	position: relative;
	padding: 12rpx 0 18rpx;
	min-width: 160rpx;
	text-align: center;
}

.tabs__text {
	font-size: 30rpx;
	color: #666666;
	font-weight: 500;
}

.tabs__item.active .tabs__text {
	color: #1a1a1a;
}

.tabs__line {
	position: absolute;
	left: 50%;
	bottom: 0;
	transform: translateX(-50%);
	width: 60rpx;
	height: 6rpx;
	border-radius: 4rpx;
	background: #0b3bff;
}

.list {
	flex: 1;
}

.list__inner {
	padding: 24rpx 24rpx 40rpx;
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
	align-items: center;
	margin-top: 10rpx;
}

.card__label {
	font-size: 26rpx;
	color: #999999;
}

.card__value {
	font-size: 26rpx;
	color: #1a1a1a;
}

.empty {
	padding: 80rpx 0;
	text-align: center;
}

.empty__text {
	color: #999999;
	font-size: 28rpx;
}

.footer {
	padding: 16rpx 0 0;
	text-align: center;
}

.footer__text {
	color: #999999;
	font-size: 24rpx;
}

.filter {
	background: #ffffff;
	border-top-left-radius: 16rpx;
	border-top-right-radius: 16rpx;
	padding-bottom: 40rpx;
}

.filter__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 28rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.filter__btn {
	font-size: 28rpx;
	color: #666666;
	min-width: 140rpx;
}

.filter__btn--primary {
	color: #0b3bff;
	text-align: right;
}

.filter__title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1a1a1a;
}

.filter__body {
	padding: 30rpx 0 10rpx;
}

.filter__item {
	padding: 22rpx 0;
	text-align: center;
}

.filter__item-text {
	font-size: 30rpx;
	color: #999999;
}

.filter__item.active .filter__item-text {
	color: #0b3bff;
	font-weight: 600;
}
</style>
