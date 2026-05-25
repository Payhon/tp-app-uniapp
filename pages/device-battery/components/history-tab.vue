<template>
	<view class="wrap">
		<view class="segment">
			<view
				class="segment__item"
				:class="{ 'segment__item--on': activeSegment === 'protection' }"
				@tap="switchSegment('protection')"
			>
				<text class="segment__text" :class="{ 'segment__text--on': activeSegment === 'protection' }">
					{{ $t('deviceDetail.history.tabs.protection') }}
				</text>
			</view>
			<view
				class="segment__item"
				:class="{ 'segment__item--on': activeSegment === 'status' }"
				@tap="switchSegment('status')"
			>
				<text class="segment__text" :class="{ 'segment__text--on': activeSegment === 'status' }">
					{{ $t('deviceDetail.history.tabs.status') }}
				</text>
			</view>
		</view>

		<scroll-view
			class="scroll-panel"
			scroll-y
			enable-flex
			:show-scrollbar="false"
			:lower-threshold="120"
			:style="scrollPanelStyle"
			@scrolltolower="handleScrollToLower"
		>
			<template v-if="activeSegment === 'protection'">
				<view v-if="showDisconnectedState" class="state-card">
					<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
					<text class="state-card__title">{{ $t('deviceDetail.history.state.notConnectedTitle') }}</text>
					<text class="state-card__desc">{{ disconnectedHintText }}</text>
				</view>

				<view v-else-if="protectionState.loading" class="loading-panel">
					<view class="loading-card shimmer"></view>
					<view class="loading-row shimmer"></view>
					<view class="loading-row shimmer"></view>
					<view class="loading-row shimmer"></view>
				</view>

				<view v-else-if="protectionState.unsupported" class="state-card">
					<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
					<text class="state-card__title">{{ $t('deviceDetail.history.state.unsupportedTitle') }}</text>
					<text class="state-card__desc">{{ $t('deviceDetail.history.state.unsupportedDesc') }}</text>
				</view>

				<view v-else-if="protectionState.error" class="state-card">
					<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
					<text class="state-card__title">{{ $t('deviceDetail.history.state.errorTitle') }}</text>
					<text class="state-card__desc">{{ protectionState.error }}</text>
					<u-button type="primary" size="small" @click="retryCurrentTab">
						{{ $t('deviceDetail.history.retry') }}
					</u-button>
				</view>

				<view v-else-if="protectionSummary" class="content">
					<view class="summary-card">
						<view v-for="item in protectionSummaryCards" :key="item.key" class="summary-card__item">
							<text class="summary-card__label">{{ item.label }}</text>
							<text class="summary-card__value">{{ item.value }}</text>
						</view>
					</view>

					<view v-if="!protectionSummary.currentRecordCount" class="state-card state-card--inline">
						<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
						<text class="state-card__title">{{ $t('deviceDetail.history.state.emptyTitle') }}</text>
						<text class="state-card__desc">{{ $t('deviceDetail.history.state.emptyProtectionDesc') }}</text>
					</view>

					<view v-for="group in protectionGroups" :key="group.key" class="group-card">
						<view class="group-card__head">
							<text class="group-card__title">{{ group.title }}</text>
						</view>
						<view class="group-card__list">
							<view v-for="item in group.items" :key="item.key" class="group-card__row">
								<text class="group-card__label">{{ item.label }}</text>
								<text class="group-card__value">{{ formatTimes(item.value) }}</text>
							</view>
						</view>
					</view>
				</view>
			</template>

			<template v-else>
				<view v-if="showDisconnectedState" class="state-card">
					<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
					<text class="state-card__title">{{ $t('deviceDetail.history.state.notConnectedTitle') }}</text>
					<text class="state-card__desc">{{ disconnectedHintText }}</text>
				</view>

				<view v-else-if="statusState.loading" class="loading-panel">
					<view class="loading-card shimmer"></view>
					<view class="loading-card shimmer"></view>
				</view>

				<view v-else-if="statusState.unsupported" class="state-card">
					<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
					<text class="state-card__title">{{ $t('deviceDetail.history.state.unsupportedTitle') }}</text>
					<text class="state-card__desc">{{ $t('deviceDetail.history.state.unsupportedDesc') }}</text>
				</view>

				<view v-else-if="statusState.error" class="state-card">
					<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
					<text class="state-card__title">{{ $t('deviceDetail.history.state.errorTitle') }}</text>
					<text class="state-card__desc">{{ statusState.error }}</text>
					<u-button type="primary" size="small" @click="retryCurrentTab">
						{{ $t('deviceDetail.history.retry') }}
					</u-button>
				</view>

				<view v-else-if="!statusState.items.length" class="state-card">
					<image class="state-card__img" src="/static/image/home/empty@2x.png" mode="aspectFit" />
					<text class="state-card__title">{{ $t('deviceDetail.history.state.emptyTitle') }}</text>
					<text class="state-card__desc">{{ $t('deviceDetail.history.state.emptyStatusDesc') }}</text>
				</view>

				<view v-else class="content content--status">
					<view class="summary-strip summary-strip--sticky">
						<view v-for="item in statusSummaryItems" :key="item.key" class="summary-strip__pill">
							<text class="summary-strip__label">{{ item.label }}</text>
							<text class="summary-strip__value">{{ item.value }}</text>
						</view>
					</view>

					<view v-for="record in statusState.items" :key="record.index" class="record-card">
						<view class="record-card__head">
							<view class="record-card__main">
								<text class="record-card__time">{{ formatRecordTime(record) }}</text>
								<text class="record-card__index">{{ historyIndexText(record.index) }}</text>
							</view>
							<text class="record-card__badge" :class="`record-card__badge--${logTone(record.logCode)}`">
								{{ logLabel(record.logCode) }}
							</text>
						</view>

						<view class="metrics-grid">
							<view class="metric-chip">
								<text class="metric-chip__label">{{ $t('deviceDetail.history.metrics.totalVoltage') }}</text>
								<text class="metric-chip__value">{{ formatVoltage(record.totalVoltageV) }}</text>
							</view>
							<view class="metric-chip">
								<text class="metric-chip__label">{{ $t('deviceDetail.history.metrics.current') }}</text>
								<text class="metric-chip__value">{{ formatCurrent(record.currentA) }}</text>
							</view>
							<view class="metric-chip">
								<text class="metric-chip__label">{{ $t('deviceDetail.history.metrics.soc') }}</text>
								<text class="metric-chip__value">{{ formatPercent(record.socPct) }}</text>
							</view>
							<view class="metric-chip">
								<text class="metric-chip__label">{{ $t('deviceDetail.history.metrics.soh') }}</text>
								<text class="metric-chip__value">{{ formatPercent(record.sohPct) }}</text>
							</view>
							<view class="metric-chip">
								<text class="metric-chip__label">{{ $t('deviceDetail.history.metrics.remainingCapacity') }}</text>
								<text class="metric-chip__value">{{ formatCapacityMah(record.remainingCapacityMah) }}</text>
							</view>
							<view class="metric-chip">
								<text class="metric-chip__label">{{ $t('deviceDetail.history.metrics.cycleCount') }}</text>
								<text class="metric-chip__value">{{ record.cycleCount }}</text>
							</view>
							<view class="metric-chip">
								<text class="metric-chip__label">{{ $t('deviceDetail.history.metrics.mosTemp') }}</text>
								<text class="metric-chip__value">{{ formatTemp(record.mosTempC) }}</text>
							</view>
						</view>

						<view class="tag-list">
							<text
								v-for="tag in recordTags(record)"
								:key="tag.key"
								class="tag-list__item"
								:class="`tag-list__item--${tag.tone}`"
							>
								{{ tag.label }}
							</text>
							<text v-if="!recordTags(record).length" class="tag-list__empty">
								{{ $t('deviceDetail.history.noActiveFlags') }}
							</text>
						</view>

						<view class="detail-grid">
							<view class="detail-grid__item">
								<text class="detail-grid__label">{{ $t('deviceDetail.history.details.lowestVoltage') }}</text>
								<text class="detail-grid__value">{{ formatVoltageMv(record.lowestVoltageMv) }}</text>
							</view>
							<view class="detail-grid__item">
								<text class="detail-grid__label">{{ $t('deviceDetail.history.details.highestVoltage') }}</text>
								<text class="detail-grid__value">{{ formatVoltageMv(record.highestVoltageMv) }}</text>
							</view>
							<view class="detail-grid__item">
								<text class="detail-grid__label">{{ $t('deviceDetail.history.details.lowestCell') }}</text>
								<text class="detail-grid__value">{{ record.lowestVoltageCellIndex || '-' }}</text>
							</view>
							<view class="detail-grid__item">
								<text class="detail-grid__label">{{ $t('deviceDetail.history.details.highestCell') }}</text>
								<text class="detail-grid__value">{{ record.highestVoltageCellIndex || '-' }}</text>
							</view>
							<view class="detail-grid__item">
								<text class="detail-grid__label">{{ $t('deviceDetail.history.details.cellTempLow') }}</text>
								<text class="detail-grid__value">{{ formatTemp(record.lowestCellTempC) }}</text>
							</view>
							<view class="detail-grid__item">
								<text class="detail-grid__label">{{ $t('deviceDetail.history.details.cellTempHigh') }}</text>
								<text class="detail-grid__value">{{ formatTemp(record.highestCellTempC) }}</text>
							</view>
						</view>
					</view>

					<view class="list-footer" @tap="loadMoreStatusRecords">
						<text v-if="statusState.loadingMore" class="list-footer__text">{{ $t('common.loading') }}</text>
						<text v-else-if="statusState.hasMore" class="list-footer__text">{{ $t('deviceDetail.history.pullUpMore') }}</text>
						<text v-else class="list-footer__text">{{ $t('deviceDetail.history.noMore') }}</text>
					</view>
				</view>
			</template>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { BmsClient } from '@/common/lib/bms-protocol/client'
import type { BmsHistoryProtectionCounters, BmsHistoryStatusRecord } from '@/common/lib/bms-protocol/types'

type SegmentKey = 'protection' | 'status'
type TagTone = 'danger' | 'warn' | 'info' | 'success'
type HistoryTag = {
	key: string
	label: string
	tone: TagTone
}

const MIN_STATUS_ITEMS_FOR_SCROLL = 2

const props = defineProps<{
	client: BmsClient | null
	connType: 'bluetooth' | 'mqtt' | 'offline'
	sessionMode: 'cloud' | 'instrument'
	active: boolean
	viewportHeightPx?: number
	onPausePolling?: () => void
	onResumePolling?: () => void
}>()

const { t, te } = useI18n()

const activeSegment = ref<SegmentKey>('protection')

const protectionState = reactive({
	loading: false,
	error: '',
	unsupported: false,
	summary: null as BmsHistoryProtectionCounters | null,
})

const statusState = reactive({
	loading: false,
	loadingMore: false,
	error: '',
	unsupported: false,
	items: [] as BmsHistoryStatusRecord[],
	totalCount: 0,
	nextStartIndex: 0,
	hasMore: false,
})

const showDisconnectedState = computed(() => !props.client || props.connType === 'offline')
const protectionSummary = computed(() => protectionState.summary)
const isInstrumentSession = computed(() => props.sessionMode === 'instrument')

const disconnectedHintText = computed(() => {
	return isInstrumentSession.value
		? (t('deviceDetail.history.state.instrumentNotConnectedDesc') as string)
		: (t('deviceDetail.history.state.notConnectedDesc') as string)
})
const scrollPanelStyle = computed(() => {
	if (!props.viewportHeightPx || props.viewportHeightPx <= 0) return {}
	return {
		height: `${props.viewportHeightPx}px`,
	}
})

const protectionSummaryCards = computed(() => {
	const summary = protectionSummary.value
	if (!summary) return []
	return [
		{
			key: 'currentRecordCount',
			label: t('deviceDetail.history.summary.totalRecords') as string,
			value: String(summary.currentRecordCount || 0),
		},
		{
			key: 'currentRecordAddress',
			label: t('deviceDetail.history.summary.currentAddress') as string,
			value: summary.currentRecordAddress ? `0x${summary.currentRecordAddress.toString(16).toUpperCase()}` : '0x0000',
		},
		{
			key: 'totalChargeSeconds',
			label: t('deviceDetail.history.summary.totalChargeTime') as string,
			value: formatDuration(summary.totalChargeSeconds),
		},
		{
			key: 'totalDischargeSeconds',
			label: t('deviceDetail.history.summary.totalDischargeTime') as string,
			value: formatDuration(summary.totalDischargeSeconds),
		},
	]
})

const statusSummaryItems = computed(() => {
	return [
		{
			key: 'total',
			label: t('deviceDetail.history.statusSummary.total') as string,
			value: String(statusState.totalCount || 0),
		},
		{
			key: 'loaded',
			label: t('deviceDetail.history.statusSummary.loaded') as string,
			value: String(statusState.items.length || 0),
		},
		{
			key: 'currentAddress',
			label: t('deviceDetail.history.statusSummary.currentAddress') as string,
			value: statusCurrentAddressText.value,
		},
	]
})

const statusCurrentAddressText = computed(() => {
	const summary = protectionSummary.value
	if (!summary) return '0x0000'
	const latestAddress = Number(summary.currentRecordAddress || 0)
	const totalCount = Number(statusState.totalCount || summary.currentRecordCount || 0)
	const tailRecord = statusState.items[statusState.items.length - 1]
	if (!tailRecord) return `0x${latestAddress.toString(16).toUpperCase()}`
	let derivedAddress = latestAddress - tailRecord.index
	if (totalCount > 0) {
		derivedAddress = ((derivedAddress % totalCount) + totalCount) % totalCount
	} else {
		derivedAddress = Math.max(0, derivedAddress)
	}
	return `0x${derivedAddress.toString(16).toUpperCase()}`
})

function formatWithParams(key: string, params: Record<string, unknown>): string {
	const tpl = t(key, params) as string
	return tpl.replace(/\{(\w+)\}/g, (m, k) => {
		if (!Object.prototype.hasOwnProperty.call(params, k)) return m
		return String((params as Record<string, unknown>)[k])
	})
}

function logHistory(event: string, data?: Record<string, unknown>): void {
	try {
		console.log(`[device-history] ${event}`, data || {})
	} catch (e) {}
}

const protectionGroups = computed(() => {
	const summary = protectionSummary.value
	if (!summary) return []
	return [
		{
			key: 'temp',
			title: t('deviceDetail.history.groups.temp') as string,
			items: [
				{ key: 'chargeHighTempCount', label: t('deviceDetail.history.counter.chargeHighTempCount') as string, value: summary.chargeHighTempCount },
				{ key: 'chargeLowTempCount', label: t('deviceDetail.history.counter.chargeLowTempCount') as string, value: summary.chargeLowTempCount },
				{ key: 'dischargeHighTempCount', label: t('deviceDetail.history.counter.dischargeHighTempCount') as string, value: summary.dischargeHighTempCount },
				{ key: 'dischargeLowTempCount', label: t('deviceDetail.history.counter.dischargeLowTempCount') as string, value: summary.dischargeLowTempCount },
				{ key: 'mosHighTempCount', label: t('deviceDetail.history.counter.mosHighTempCount') as string, value: summary.mosHighTempCount },
			],
		},
		{
			key: 'voltageCurrent',
			title: t('deviceDetail.history.groups.voltageCurrent') as string,
			items: [
				{ key: 'packOverVoltageCount', label: t('deviceDetail.history.counter.packOverVoltageCount') as string, value: summary.packOverVoltageCount },
				{ key: 'packOverDischargeCount', label: t('deviceDetail.history.counter.packOverDischargeCount') as string, value: summary.packOverDischargeCount },
				{ key: 'softChargeOverCurrentCount', label: t('deviceDetail.history.counter.softChargeOverCurrentCount') as string, value: summary.softChargeOverCurrentCount },
				{ key: 'softDischargeOverCurrentCount', label: t('deviceDetail.history.counter.softDischargeOverCurrentCount') as string, value: summary.softDischargeOverCurrentCount },
				{ key: 'hardOverCurrentCount', label: t('deviceDetail.history.counter.hardOverCurrentCount') as string, value: summary.hardOverCurrentCount },
				{ key: 'hardShortCircuitCount', label: t('deviceDetail.history.counter.hardShortCircuitCount') as string, value: summary.hardShortCircuitCount },
			],
		},
		{
			key: 'chargeDischarge',
			title: t('deviceDetail.history.groups.chargeDischarge') as string,
			items: [
				{ key: 'softOverChargeCount', label: t('deviceDetail.history.counter.softOverChargeCount') as string, value: summary.softOverChargeCount },
				{ key: 'softOverDischargeCount', label: t('deviceDetail.history.counter.softOverDischargeCount') as string, value: summary.softOverDischargeCount },
				{ key: 'hardOverChargeCount', label: t('deviceDetail.history.counter.hardOverChargeCount') as string, value: summary.hardOverChargeCount },
				{ key: 'hardOverDischargeCount', label: t('deviceDetail.history.counter.hardOverDischargeCount') as string, value: summary.hardOverDischargeCount },
				{ key: 'fullChargeCount', label: t('deviceDetail.history.counter.fullChargeCount') as string, value: summary.fullChargeCount },
			],
		},
		{
			key: 'system',
			title: t('deviceDetail.history.groups.system') as string,
			items: [
				{ key: 'lowVoltagePowerOffCount', label: t('deviceDetail.history.counter.lowVoltagePowerOffCount') as string, value: summary.lowVoltagePowerOffCount },
				{ key: 'autoPowerOffCount', label: t('deviceDetail.history.counter.autoPowerOffCount') as string, value: summary.autoPowerOffCount },
				{ key: 'keyPowerOffCount', label: t('deviceDetail.history.counter.keyPowerOffCount') as string, value: summary.keyPowerOffCount },
				{ key: 'resetCount', label: t('deviceDetail.history.counter.resetCount') as string, value: summary.resetCount },
			],
		},
	]
})

function pad2(n: number): string {
	return String(n || 0).padStart(2, '0')
}

function formatDuration(seconds: number): string {
	if (!Number.isFinite(Number(seconds)) || Number(seconds) >= 0xffffffff) return '-'
	const safe = Math.max(0, Math.floor(Number(seconds || 0)))
	const days = Math.floor(safe / 86400)
	const hours = Math.floor((safe % 86400) / 3600)
	const minutes = Math.floor((safe % 3600) / 60)
	const parts: string[] = []
	if (days > 0) parts.push(`${days}${t('deviceDetail.history.duration.day') as string}`)
	if (hours > 0) parts.push(`${hours}${t('deviceDetail.history.duration.hour') as string}`)
	if (minutes > 0 || !parts.length) parts.push(`${minutes}${t('deviceDetail.history.duration.minute') as string}`)
	return parts.join(' ')
}

function formatTimes(n: number): string {
	if (!Number.isFinite(Number(n)) || Number(n) >= 0xffff) return '-'
	return formatWithParams('deviceDetail.unit.times', { n: Number(n || 0) })
}

function formatVoltage(v: number): string {
	if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
	return `${v.toFixed(2)}V`
}

function formatVoltageMv(v: number): string {
	if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
	return `${v}mV`
}

function formatCapacityMah(v: number): string {
	if (typeof v !== 'number' || !Number.isFinite(v) || v >= 0xffffffff) return '-'
	if (v >= 1000) return `${(v / 1000).toFixed(2)}Ah`
	return `${Math.round(v)}mAh`
}

function formatCurrent(v: number): string {
	if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
	return `${v > 0 ? '+' : ''}${v.toFixed(2)}A`
}

function formatPercent(v: number): string {
	if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
	return `${Math.round(v)}%`
}

function formatTemp(v: number | null): string {
	if (typeof v !== 'number' || !Number.isFinite(v)) return '-'
	return `${Math.round(v)}°C`
}

function formatRecordTime(record: BmsHistoryStatusRecord): string {
	return `${record.time.year}.${pad2(record.time.month)}.${pad2(record.time.day)} ${pad2(record.time.hour)}:${pad2(record.time.minute)}:${pad2(record.time.second)}`
}

function normalizeStatusItems(records: BmsHistoryStatusRecord[]): BmsHistoryStatusRecord[] {
	const map = new Map<number, BmsHistoryStatusRecord>()
	for (const record of records) {
		map.set(record.index, record)
	}
	return Array.from(map.values()).sort((a, b) => a.index - b.index)
}

function historyIndexText(index: number): string {
	return formatWithParams('deviceDetail.history.index', { n: index + 1 })
}

function resolveFlagLabel(group: string, key: string): string {
	const labelKey = `deviceDetail.history.statusFlagLabel.${group}.${key}`
	return te(labelKey) ? (t(labelKey) as string) : key
}

const dangerLogCodes = new Set([
	22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
	37, 42, 48, 49, 51, 90, 96, 107, 108, 109, 115, 117, 119, 121, 123, 125,
])
const warnLogCodes = new Set([
	5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
	35, 39, 41, 43, 44, 45, 46, 47,
	53, 54, 88, 89, 92, 93, 94, 95, 98, 99, 100, 111, 127, 198, 200, 201,
])
const successLogCodes = new Set([
	36, 38, 40, 50, 52, 91, 97,
	101, 102, 103, 104, 105, 106, 110, 112, 113, 114, 116, 118, 120, 122, 124, 126, 128, 199, 202,
])

function logTone(code: number): TagTone {
	if (dangerLogCodes.has(code)) return 'danger'
	if (warnLogCodes.has(code)) return 'warn'
	if (successLogCodes.has(code)) return 'success'
	return 'info'
}

function logLabel(code: number): string {
	const key = `deviceDetail.history.logCodeMap.${code}`
	if (te(key)) return t(key) as string
	return formatWithParams('deviceDetail.history.logCodeFallback', { code })
}

function recordTags(record: BmsHistoryStatusRecord): HistoryTag[] {
	const tags: HistoryTag[] = []
	for (const [key, enabled] of Object.entries(record.flags.voltage)) {
		if (!enabled) continue
		tags.push({ key: `voltage-${key}`, label: resolveFlagLabel('voltage', key), tone: key.includes('Recovery') ? 'info' : 'danger' })
	}
	for (const [key, enabled] of Object.entries(record.flags.current)) {
		if (!enabled) continue
		tags.push({ key: `current-${key}`, label: resolveFlagLabel('current', key), tone: key.includes('Recovery') ? 'info' : 'danger' })
	}
	for (const [key, enabled] of Object.entries(record.flags.temperature)) {
		if (!enabled) continue
		tags.push({ key: `temperature-${key}`, label: resolveFlagLabel('temperature', key), tone: key.includes('Recovery') ? 'warn' : 'danger' })
	}
	for (const [key, enabled] of Object.entries(record.flags.chargeDischarge)) {
		if (!enabled) continue
		tags.push({ key: `chargeDischarge-${key}`, label: resolveFlagLabel('chargeDischarge', key), tone: key.endsWith('On') ? 'success' : 'info' })
	}
	return tags
}

function resetProtectionState(): void {
	protectionState.loading = false
	protectionState.error = ''
	protectionState.unsupported = false
	protectionState.summary = null
}

function resetStatusState(): void {
	statusState.loading = false
	statusState.loadingMore = false
	statusState.error = ''
	statusState.unsupported = false
	statusState.items = []
	statusState.totalCount = 0
	statusState.nextStartIndex = 0
	statusState.hasMore = false
}

async function ensureProtectionLoaded(force = false): Promise<BmsHistoryProtectionCounters | null> {
	if (showDisconnectedState.value || !props.client) return null
	if (!force && (protectionState.summary || protectionState.unsupported || protectionState.loading)) return protectionState.summary
	resetProtectionState()
	protectionState.loading = true
	logHistory('load protection start', { force, connType: props.connType, sessionMode: props.sessionMode })
	try {
		const summary = await props.client.readHistoryProtectionCounters()
		if (!summary) {
			logHistory('load protection unsupported')
			protectionState.unsupported = true
			return null
		}
		protectionState.summary = summary
		logHistory('load protection success', {
			currentRecordAddress: summary.currentRecordAddress,
			currentRecordCount: summary.currentRecordCount,
			totalChargeSeconds: summary.totalChargeSeconds,
			totalDischargeSeconds: summary.totalDischargeSeconds,
		})
		return summary
	} catch (e) {
		protectionState.error = e instanceof Error ? e.message : String(e || '')
		logHistory('load protection failed', { error: protectionState.error })
		return null
	} finally {
		protectionState.loading = false
	}
}

async function fetchStatusChunk(startIndex: number, quantity: number, replace: boolean): Promise<void> {
	if (!props.client) return
	const preservedTotalCount = statusState.totalCount
	if (replace) {
		resetStatusState()
		statusState.totalCount = preservedTotalCount
		statusState.loading = true
	} else {
		statusState.loadingMore = true
		statusState.error = ''
	}
	logHistory('load status chunk start', { startIndex, quantity, replace })
	try {
		const next: BmsHistoryStatusRecord[] = []
		for (let i = 0; i < quantity; i += 1) {
			const itemIndex = startIndex + i
			logHistory('load status single request', { itemIndex })
			const records = await props.client.readHistoryStatusRecords(itemIndex, 1)
			if (!records) {
				logHistory('load status unsupported', { itemIndex })
				statusState.unsupported = true
				return
			}
			if (records.length) next.push(...records)
		}
		statusState.items = normalizeStatusItems(replace ? next : statusState.items.concat(next))
		statusState.nextStartIndex = startIndex + Math.max(next.length, quantity)
		statusState.hasMore = statusState.nextStartIndex < statusState.totalCount
		logHistory('load status chunk success', {
			startIndex,
			quantity,
			loaded: next.length,
			firstIndex: next[0]?.index ?? null,
			lastIndex: next[next.length - 1]?.index ?? null,
			nextStartIndex: statusState.nextStartIndex,
			hasMore: statusState.hasMore,
		})
	} catch (e) {
		statusState.error = e instanceof Error ? e.message : String(e || '')
		logHistory('load status chunk failed', { startIndex, quantity, error: statusState.error })
	} finally {
		statusState.loading = false
		statusState.loadingMore = false
	}
}

async function prefillStatusRecords(): Promise<void> {
	while (
		props.active &&
		activeSegment.value === 'status' &&
		statusState.hasMore &&
		statusState.items.length < MIN_STATUS_ITEMS_FOR_SCROLL &&
		!statusState.loading &&
		!statusState.loadingMore
	) {
		const startIndex = statusState.nextStartIndex
		const quantity = Math.min(1, statusState.totalCount - startIndex)
		if (quantity <= 0) {
			statusState.hasMore = false
			return
		}
		logHistory('prefill status auto load', { startIndex, quantity, loaded: statusState.items.length, totalCount: statusState.totalCount })
		await fetchStatusChunk(startIndex, quantity, false)
	}
}

async function ensureStatusLoaded(force = false): Promise<void> {
	if (showDisconnectedState.value || !props.client) return
	if (!force && (statusState.items.length || statusState.unsupported || statusState.loading)) return
	const summary = await ensureProtectionLoaded(force)
	if (!summary) {
		if (protectionState.error) statusState.error = protectionState.error
		if (protectionState.unsupported) statusState.unsupported = true
		logHistory('load status skipped by protection summary', {
			protectionError: protectionState.error || null,
			protectionUnsupported: protectionState.unsupported,
		})
		return
	}
	statusState.totalCount = summary.currentRecordCount || 0
	if (!statusState.totalCount) {
		resetStatusState()
		statusState.totalCount = 0
		logHistory('load status empty', { totalCount: 0 })
		return
	}
	const quantity = 1
	const startIndex = 0
	logHistory('load status initial window', {
		totalCount: statusState.totalCount,
		currentRecordAddress: summary.currentRecordAddress,
		startIndex,
		quantity,
	})
	await fetchStatusChunk(startIndex, quantity, true)
	statusState.totalCount = summary.currentRecordCount || 0
	await prefillStatusRecords()
}

async function ensureCurrentSegmentLoaded(force = false): Promise<void> {
	if (!props.active) return
	if (activeSegment.value === 'protection') {
		await ensureProtectionLoaded(force)
		return
	}
	await ensureStatusLoaded(force)
}

function switchSegment(next: SegmentKey): void {
	if (activeSegment.value === next) return
	activeSegment.value = next
	void ensureCurrentSegmentLoaded(false)
}

function retryCurrentTab(): void {
	logHistory('retry current segment', { segment: activeSegment.value })
	void ensureCurrentSegmentLoaded(true)
}

function handleScrollToLower(): void {
	if (activeSegment.value !== 'status') return
	void loadMoreStatusRecords()
}

async function loadMoreStatusRecords(): Promise<void> {
	if (!props.active || activeSegment.value !== 'status' || statusState.loading || statusState.loadingMore || !statusState.hasMore) return
	if (!props.client || statusState.nextStartIndex >= statusState.totalCount) return
	const startIndex = statusState.nextStartIndex
	const quantity = Math.min(1, statusState.totalCount - startIndex)
	if (quantity <= 0) {
		statusState.hasMore = false
		logHistory('load more skipped', { reason: 'quantity<=0', nextStartIndex: statusState.nextStartIndex, totalCount: statusState.totalCount })
		return
	}
	logHistory('load more status', { startIndex, quantity, nextStartIndex: statusState.nextStartIndex })
	await fetchStatusChunk(startIndex, quantity, false)
}

watch(
	() => props.active,
	(active) => {
		if (!active) return
		void ensureCurrentSegmentLoaded(false)
	},
	{ immediate: true }
)

watch(
	() => [props.client, props.connType] as const,
	() => {
		resetProtectionState()
		resetStatusState()
		if (props.active) {
			void ensureCurrentSegmentLoaded(false)
		}
	}
)

defineExpose({
	loadMoreStatusRecords,
})
</script>

<style lang="scss" scoped>
.wrap {
	padding: 24rpx;
	box-sizing: border-box;
}

.scroll-panel {
	margin-top: 20rpx;
	box-sizing: border-box;
}

.segment {
	display: flex;
	gap: 16rpx;
	padding: 10rpx;
	border-radius: 28rpx;
	background: rgba(255, 255, 255, 0.74);
	box-shadow: 0 10rpx 30rpx rgba(11, 59, 255, 0.08);
}

.segment__item {
	flex: 1;
	min-height: 88rpx;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	transition: all 0.2s ease;
}

.segment__item--on {
	background: linear-gradient(135deg, #0b3bff 0%, #246fdd 100%);
	box-shadow: 0 10rpx 22rpx rgba(11, 59, 255, 0.22);
}

.segment__text {
	font-size: 28rpx;
	font-weight: 600;
	color: #657082;
}

.segment__text--on {
	color: #ffffff;
}

.content {
	margin-top: 20rpx;
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.content--status {
	margin-top: 0;
}

.summary-card,
.group-card,
.record-card,
.summary-strip,
.state-card,
.loading-panel {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 24rpx;
	box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
}

.summary-card {
	padding: 24rpx;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16rpx;
}

.summary-card__item {
	min-height: 120rpx;
	padding: 20rpx;
	border-radius: 20rpx;
	background: linear-gradient(180deg, rgba(11, 59, 255, 0.08) 0%, rgba(11, 59, 255, 0.03) 100%);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.summary-card__label {
	font-size: 22rpx;
	color: #7a8496;
}

.summary-card__value {
	font-size: 34rpx;
	font-weight: 700;
	color: #0f172a;
}

.group-card {
	padding: 24rpx;
}

.group-card__head {
	margin-bottom: 16rpx;
}

.group-card__title {
	font-size: 28rpx;
	font-weight: 700;
	color: #0f172a;
}

.group-card__list {
	display: flex;
	flex-direction: column;
}

.group-card__row {
	min-height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid rgba(226, 232, 240, 0.8);
}

.group-card__row:last-child {
	border-bottom: 0;
}

.group-card__label {
	flex: 1;
	padding-right: 24rpx;
	font-size: 26rpx;
	line-height: 1.5;
	color: #4b5563;
}

.group-card__value {
	font-size: 28rpx;
	font-weight: 700;
	color: #0b3bff;
}

.summary-strip {
	padding: 18rpx 20rpx;
	display: flex;
	gap: 16rpx;
}

.summary-strip--sticky {
	position: sticky;
	top: 0;
	z-index: 3;
	padding-top: 6rpx;
	padding-bottom: 18rpx;
	background: linear-gradient(180deg, rgba(241, 245, 255, 0.96) 0%, rgba(241, 245, 255, 0.82) 72%, rgba(241, 245, 255, 0) 100%);
	backdrop-filter: blur(10rpx);
}

.summary-strip__pill {
	flex: 1;
	min-width: 0;
	min-height: 78rpx;
	padding: 0 14rpx;
	border-radius: 18rpx;
	background: rgba(15, 23, 42, 0.04);
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10rpx;
}

.summary-strip__label {
	flex: 1;
	min-width: 0;
	font-size: 20rpx;
	color: #7a8496;
	white-space: nowrap;
}

.summary-strip__value {
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 700;
	color: #0f172a;
}

.record-card {
	padding: 24rpx;
}

.record-card__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16rpx;
}

.record-card__main {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.record-card__time {
	font-size: 30rpx;
	font-weight: 700;
	color: #0f172a;
}

.record-card__index {
	font-size: 22rpx;
	color: #7a8496;
}

.record-card__badge {
	max-width: 280rpx;
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 600;
	line-height: 1.3;
}

.record-card__badge--danger {
	background: rgba(239, 68, 68, 0.12);
	color: #dc2626;
}

.record-card__badge--warn {
	background: rgba(249, 115, 22, 0.12);
	color: #ea580c;
}

.record-card__badge--info {
	background: rgba(11, 59, 255, 0.1);
	color: #1d4ed8;
}

.record-card__badge--success {
	background: rgba(34, 197, 94, 0.12);
	color: #15803d;
}

.metrics-grid {
	margin-top: 18rpx;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 14rpx;
}

.metric-chip {
	padding: 18rpx;
	border-radius: 18rpx;
	background: rgba(248, 250, 252, 0.9);
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.metric-chip__label {
	font-size: 22rpx;
	color: #7a8496;
}

.metric-chip__value {
	font-size: 28rpx;
	font-weight: 700;
	color: #0f172a;
}

.tag-list {
	margin-top: 18rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.tag-list__item,
.tag-list__empty {
	padding: 10rpx 16rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	line-height: 1.3;
}

.tag-list__item--danger {
	background: rgba(239, 68, 68, 0.12);
	color: #dc2626;
}

.tag-list__item--warn {
	background: rgba(249, 115, 22, 0.12);
	color: #ea580c;
}

.tag-list__item--info {
	background: rgba(37, 99, 235, 0.1);
	color: #2563eb;
}

.tag-list__item--success {
	background: rgba(34, 197, 94, 0.12);
	color: #15803d;
}

.tag-list__empty {
	background: rgba(148, 163, 184, 0.12);
	color: #64748b;
}

.detail-grid {
	margin-top: 18rpx;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12rpx 18rpx;
}

.detail-grid__item {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.detail-grid__label {
	font-size: 22rpx;
	color: #7a8496;
}

.detail-grid__value {
	font-size: 26rpx;
	font-weight: 600;
	color: #1f2937;
}

.list-footer {
	padding: 8rpx 0 20rpx;
	text-align: center;
}

.list-footer__text {
	font-size: 24rpx;
	color: #8e95a2;
}

.state-card {
	margin-top: 20rpx;
	padding: 44rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	text-align: center;
}

.state-card--inline {
	margin-top: 0;
}

.state-card__img {
	width: 180rpx;
	height: 120rpx;
	opacity: 0.92;
}

.state-card__title {
	font-size: 30rpx;
	font-weight: 700;
	color: #0f172a;
}

.state-card__desc {
	font-size: 24rpx;
	line-height: 1.6;
	color: #64748b;
}

.loading-panel {
	margin-top: 20rpx;
	padding: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.loading-card,
.loading-row {
	border-radius: 20rpx;
	background: linear-gradient(90deg, rgba(226, 232, 240, 0.8) 25%, rgba(241, 245, 249, 1) 50%, rgba(226, 232, 240, 0.8) 75%);
	background-size: 200% 100%;
}

.loading-card {
	height: 280rpx;
}

.loading-row {
	height: 88rpx;
}

.shimmer {
	animation: shimmer 1.4s linear infinite;
}

@keyframes shimmer {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}
</style>
