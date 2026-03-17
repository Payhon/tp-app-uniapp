import { defineStore } from 'pinia'

import { normalizeMac } from '@/common/device-provision/ble'
import { resolveAddTrackingViewMode, type HomeDeviceViewMode } from '@/common/device-view-mode'
import { appBoundDeviceList } from '@/service/device'
import { useUserStore } from '@/store/user'

export type BoundDevice = {
	device_id: string
	device_number: string
	device_name?: string
	ble_mac?: string | null
	bms_comm_type?: number | null
	[key: string]: unknown
}

type BoundDevicesState = {
	list: BoundDevice[]
	lastFetchedAt: number
	viewMode: HomeDeviceViewMode | null
}

export const useBoundDevicesStore = defineStore('boundDevices', {
	state: (): BoundDevicesState => ({
		list: [],
		lastFetchedAt: 0,
		viewMode: null
	}),
	getters: {
		boundBleMacSet(state): Set<string> {
			const set = new Set<string>()
			for (const d of state.list) {
				const mac = d?.ble_mac ? normalizeMac(String(d.ble_mac)) : null
				if (mac) set.add(mac)
			}
			return set
		},
	},
	actions: {
		clear() {
			this.list = []
			this.lastFetchedAt = 0
			this.viewMode = null
		},
		removeByDeviceId(deviceId: string) {
			const id = String(deviceId || '')
			if (!id) return
			this.list = this.list.filter((x) => String(x?.device_id || '') !== id)
		},
	async refresh(options?: { force?: boolean; viewMode?: HomeDeviceViewMode }) {
		const isLoggedIn = Boolean(uni.getStorageSync('access_token'))
		if (!isLoggedIn) {
			this.clear()
			return
		}

		const userStore = useUserStore()
		const nextViewMode = options?.viewMode || resolveAddTrackingViewMode(userStore.userInfo)

		const now = Date.now()
		const ttlMs = 30_000
		const modeChanged = this.viewMode !== nextViewMode
		if (!options?.force && !modeChanged && this.lastFetchedAt && now - this.lastFetchedAt < ttlMs) return

		// 后端参数校验 page_size 最大为 100；这里做分页拉取，确保过滤“已添加设备”时尽量完整。
		const pageSize = 100
		const maxPages = 20 // 安全兜底，避免异常 total 导致死循环
		const all: BoundDevice[] = []

		for (let page = 1; page <= maxPages; page += 1) {
			// eslint-disable-next-line no-await-in-loop
			const rsp = await appBoundDeviceList({ page, page_size: pageSize, view_mode: nextViewMode })
			if (!rsp || (rsp as any).code !== 200) break

			const rawList = (rsp as any).data?.list as unknown
			const list = Array.isArray(rawList) ? (rawList as BoundDevice[]) : []
			all.push(...list)

			const total = Number((rsp as any).data?.total || 0)
			if (list.length < pageSize) break
			if (Number.isFinite(total) && total > 0 && all.length >= total) break
		}

		this.list = all
		this.lastFetchedAt = now
		this.viewMode = nextViewMode
	},
		hasBleMac(mac12: string): boolean {
			const mac = normalizeMac(mac12)
			if (!mac) return false
			return this.boundBleMacSet.has(mac)
		}
	}
})
