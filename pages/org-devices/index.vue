<template>
	<view class="org-devices-page">
		<view class="search-card">
			<u-input
				v-model="keyword"
				:placeholder="$t('pages.orgDevices.searchPlaceholder')"
				clearable
				border="surround"
				@confirm="handleSearch"
			></u-input>
			<view class="search-btn" @tap="handleSearch">{{ $t('common.search') }}</view>
		</view>

		<view v-if="filterTypes.length" class="filter-card">
			<view class="filter-item" hover-class="filter-item--hover" @tap="openTypeSheet">
				<text class="filter-label">{{ $t('pages.orgDevices.filterType') }}</text>
				<text class="filter-value">{{ currentTypeLabel }}</text>
				<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
			</view>
			<view class="filter-item" hover-class="filter-item--hover" @tap="openOrgSheet">
				<text class="filter-label">{{ $t('pages.orgDevices.filterOrg') }}</text>
				<text class="filter-value">{{ currentOrgLabel }}</text>
				<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
			</view>
			<view class="filter-clear" hover-class="filter-clear--hover" @tap="clearFilters">{{
				$t('pages.orgDevices.filterClear')
			}}</view>
		</view>

		<view v-if="!loading && !deviceList.length" class="empty">
			<text class="empty-text">{{ $t('pages.orgDevices.emptyTip') }}</text>
		</view>

		<view v-else class="list">
			<view v-for="item in deviceList" :key="item.device_id" class="device-card" @tap="goDetail(item)">
				<view class="device-header">
					<text class="device-title">{{ item.device_name || item.device_number || '-' }}</text>
					<view class="device-status" :class="item.is_online ? 'online' : 'offline'">
						{{ item.is_online ? $t('pages.orgDevices.online') : $t('pages.orgDevices.offline') }}
					</view>
				</view>
				<view class="device-sub">{{ item.device_number || '-' }}</view>
				<view class="device-org">
					{{ orgLabel(item) }}
				</view>
			</view>
		</view>

		<view v-if="loading" class="loading">
			<u-loading-icon :size="24" color="#246FDD"></u-loading-icon>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { appOrgDeviceList, appOrgOptions } from '@/service/device'
import { useUserStore } from '@/store/user'

const { t } = useI18n()
const userStore = useUserStore()

type OrgDeviceItem = {
	device_id: string
	device_number: string
	device_name?: string
	is_online: number
	activation_status?: string
	owner_org_id?: string | null
	owner_org_name?: string | null
	owner_org_type?: string | null
}

type OrgOption = {
	id: string
	name: string
	org_type: string
}

const keyword = ref('')
const deviceList = ref<OrgDeviceItem[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)

const selectedOrgType = ref<string | null>(null)
const selectedOrg = ref<OrgOption | null>(null)
const orgOptions = ref<OrgOption[]>([])

const userOrgType = computed(() => String((userStore.userInfo as any)?.org_type || '').toUpperCase())

const filterTypes = computed(() => {
	if (userOrgType.value === 'BMS_FACTORY' || !userOrgType.value) return ['PACK_FACTORY', 'DEALER', 'STORE']
	if (userOrgType.value === 'PACK_FACTORY') return ['DEALER', 'STORE']
	if (userOrgType.value === 'DEALER') return ['STORE']
	return []
})

const typeLabelMap = computed(() => ({
	PACK_FACTORY: t('pages.orgDevices.typePack') as string,
	DEALER: t('pages.orgDevices.typeDealer') as string,
	STORE: t('pages.orgDevices.typeStore') as string
}))

const currentTypeLabel = computed(() => {
	if (!selectedOrgType.value) return t('pages.orgDevices.all') as string
	return typeLabelMap.value[selectedOrgType.value as keyof typeof typeLabelMap.value] || selectedOrgType.value
})

const currentOrgLabel = computed(() => {
	if (!selectedOrgType.value) return t('pages.orgDevices.all') as string
	if (!selectedOrg.value) return t('pages.orgDevices.all') as string
	return selectedOrg.value.name
})

const orgLabel = (item: OrgDeviceItem) => {
	if (!item.owner_org_id) return t('pages.orgDevices.orgFactory') as string
	const name = item.owner_org_name || ''
	return name || t('pages.orgDevices.orgFactory')
}

const loadOrgOptions = async () => {
	if (!selectedOrgType.value) {
		orgOptions.value = []
		return
	}
	try {
		const resp: any = await appOrgOptions({ org_type: selectedOrgType.value })
		const data = resp?.data
		const list = Array.isArray(data) ? data : data?.list || []
		orgOptions.value = list as OrgOption[]
	} catch {
		orgOptions.value = []
	}
}

const loadList = async (reset = false) => {
	if (loading.value) return
	if (reset) {
		page.value = 1
		deviceList.value = []
		total.value = 0
	}

	loading.value = true
	try {
		const resp: any = await appOrgDeviceList({
			page: page.value,
			page_size: pageSize,
			device_number: keyword.value.trim() || undefined,
			owner_org_id: selectedOrg.value?.id || undefined,
			owner_org_type: selectedOrgType.value || undefined
		})
		const payload = resp?.data || {}
		const list = Array.isArray(payload?.list) ? (payload.list as OrgDeviceItem[]) : []
		const totalVal = Number(payload?.total || 0)
		deviceList.value = reset ? list : deviceList.value.concat(list)
		total.value = Number.isFinite(totalVal) ? totalVal : deviceList.value.length
		if (list.length > 0) page.value += 1
	} catch {
		if (reset) deviceList.value = []
	} finally {
		loading.value = false
	}
}

const handleSearch = () => {
	loadList(true)
}

const openTypeSheet = () => {
	if (!filterTypes.value.length) return
	const types = filterTypes.value
	const labels = types.map((t) => typeLabelMap.value[t] || t)
	uni.showActionSheet({
		itemList: labels,
		success: async (res) => {
			const nextType = types[res.tapIndex]
			selectedOrgType.value = nextType
			selectedOrg.value = null
			await loadOrgOptions()
			loadList(true)
		}
	})
}

const openOrgSheet = async () => {
	if (!selectedOrgType.value) {
		uni.showToast({ title: t('pages.orgDevices.selectTypeFirst') as string, icon: 'none' })
		return
	}
	if (!orgOptions.value.length) {
		await loadOrgOptions()
	}
	if (!orgOptions.value.length) {
		uni.showToast({ title: t('pages.orgDevices.noOrgOptions') as string, icon: 'none' })
		return
	}
	const labels = orgOptions.value.map((o) => o.name)
	uni.showActionSheet({
		itemList: labels,
		success: (res) => {
			selectedOrg.value = orgOptions.value[res.tapIndex]
			loadList(true)
		}
	})
}

const clearFilters = () => {
	selectedOrgType.value = null
	selectedOrg.value = null
	orgOptions.value = []
	loadList(true)
}

const goDetail = (item: OrgDeviceItem) => {
	if (!item?.device_id) return
	uni.navigateTo({ url: `/pages/device-battery/detail?device_id=${encodeURIComponent(String(item.device_id))}` })
}

onLoad(() => {
	loadList(true)
})

onPullDownRefresh(() => {
	loadList(true).finally(() => {
		uni.stopPullDownRefresh()
	})
})

onReachBottom(() => {
	if (deviceList.value.length >= total.value && total.value > 0) return
	loadList()
})
</script>

<style lang="scss" scoped>
.org-devices-page {
	min-height: 100vh;
	background: #f5f6f8;
	padding: 24rpx;
}

.search-card {
	background: #fff;
	padding: 20rpx;
	border-radius: 16rpx;
	display: flex;
	gap: 16rpx;
	align-items: center;
}

.search-btn {
	padding: 0 20rpx;
	height: 68rpx;
	line-height: 68rpx;
	background: #246fdd;
	color: #fff;
	border-radius: 12rpx;
	font-size: 26rpx;
	white-space: nowrap;
}

.filter-card {
	margin-top: 16rpx;
	background: #fff;
	border-radius: 16rpx;
	padding: 8rpx 20rpx;
}

.filter-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14rpx 0;
}

.filter-item--hover {
	opacity: 0.8;
}

.filter-label {
	font-size: 26rpx;
	color: #666;
}

.filter-value {
	flex: 1;
	text-align: right;
	margin-right: 12rpx;
	color: #333;
	font-size: 26rpx;
}

.filter-clear {
	margin: 8rpx 0 12rpx;
	text-align: right;
	font-size: 24rpx;
	color: #246fdd;
}

.filter-clear--hover {
	opacity: 0.8;
}

.empty {
	padding: 120rpx 0;
	text-align: center;
}

.empty-text {
	color: #999;
	font-size: 26rpx;
}

.list {
	margin-top: 16rpx;
}

.device-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 20rpx;
	margin-bottom: 16rpx;
}

.device-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.device-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #222;
}

.device-status {
	font-size: 22rpx;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
}

.device-status.online {
	background: rgba(36, 111, 221, 0.1);
	color: #246fdd;
}

.device-status.offline {
	background: rgba(153, 153, 153, 0.12);
	color: #999;
}

.device-sub {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #666;
}

.device-org {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #999;
}

.loading {
	padding: 20rpx 0;
	text-align: center;
}
</style>
