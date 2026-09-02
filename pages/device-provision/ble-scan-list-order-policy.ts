export const BLE_SCAN_LIST_SORT_INTERVAL_MS = 2_000
export const BLE_SCAN_LIST_TOUCH_RELEASE_GUARD_MS = 600

export type BleScanListOrderItem = {
	deviceId: string
	RSSI: number | null
	advMac: string | null
}

export function appendBleScanDeviceId(order: readonly string[], deviceId: string): string[] {
	const normalizedId = String(deviceId || '')
	if (!normalizedId || order.includes(normalizedId)) return [...order]
	return [...order, normalizedId]
}

export function sortBleScanDeviceIds(input: {
	items: readonly BleScanListOrderItem[]
	previousOrder: readonly string[]
	targetMac: string | null
}): string[] {
	const itemById = new Map(input.items.map((item) => [item.deviceId, item]))
	const previousIndex = new Map(input.previousOrder.map((deviceId, index) => [deviceId, index]))
	const deviceIds = input.previousOrder.filter((deviceId) => itemById.has(deviceId))
	for (const item of input.items) {
		if (!previousIndex.has(item.deviceId)) {
			previousIndex.set(item.deviceId, deviceIds.length)
			deviceIds.push(item.deviceId)
		}
	}

	const targetMac = String(input.targetMac || '')
	deviceIds.sort((leftId, rightId) => {
		const left = itemById.get(leftId)
		const right = itemById.get(rightId)
		if (!left || !right) return (previousIndex.get(leftId) ?? 0) - (previousIndex.get(rightId) ?? 0)

		if (targetMac) {
			const leftTargetRank = left.advMac === targetMac ? 0 : 1
			const rightTargetRank = right.advMac === targetMac ? 0 : 1
			if (leftTargetRank !== rightTargetRank) return leftTargetRank - rightTargetRank
		}

		const leftRssi = typeof left.RSSI === 'number' && Number.isFinite(left.RSSI) ? left.RSSI : Number.NEGATIVE_INFINITY
		const rightRssi = typeof right.RSSI === 'number' && Number.isFinite(right.RSSI) ? right.RSSI : Number.NEGATIVE_INFINITY
		if (leftRssi !== rightRssi) return rightRssi - leftRssi
		return (previousIndex.get(leftId) ?? 0) - (previousIndex.get(rightId) ?? 0)
	})

	return deviceIds
}

type TimerHandle = ReturnType<typeof setTimeout>

export type BleScanListSortSchedulerOptions = {
	onFlush: () => void
	now?: () => number
	setTimer?: (callback: () => void, delayMs: number) => TimerHandle
	clearTimer?: (handle: TimerHandle) => void
	intervalMs?: number
	touchReleaseGuardMs?: number
}

export type BleScanListSortScheduler = {
	markDirty: () => void
	lockForTouch: () => void
	releaseTouch: () => void
	flushNow: () => boolean
	cancel: () => void
}

export function createBleScanListSortScheduler(options: BleScanListSortSchedulerOptions): BleScanListSortScheduler {
	const now = options.now ?? Date.now
	const setTimer = options.setTimer ?? ((callback, delayMs) => setTimeout(callback, delayMs))
	const clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle))
	const intervalMs = options.intervalMs ?? BLE_SCAN_LIST_SORT_INTERVAL_MS
	const touchReleaseGuardMs = options.touchReleaseGuardMs ?? BLE_SCAN_LIST_TOUCH_RELEASE_GUARD_MS

	let timer: TimerHandle | null = null
	let timerGeneration = 0
	let dirty = false
	let touchLocked = false
	let nextSortNotBefore = 0
	let touchReleaseNotBefore = 0

	const clearScheduledTimer = () => {
		++timerGeneration
		if (timer == null) return
		clearTimer(timer)
		timer = null
	}

	const flushNow = (): boolean => {
		if (!dirty || touchLocked) return false
		clearScheduledTimer()
		dirty = false
		nextSortNotBefore = 0
		touchReleaseNotBefore = 0
		options.onFlush()
		return true
	}

	const schedule = () => {
		if (!dirty || touchLocked || timer != null) return
		const delayMs = Math.max(0, nextSortNotBefore, touchReleaseNotBefore) - now()
		const generation = ++timerGeneration
		timer = setTimer(() => {
			if (generation !== timerGeneration) return
			timer = null
			void flushNow()
		}, Math.max(0, delayMs))
	}

	return {
		markDirty: () => {
			if (!dirty) {
				dirty = true
				nextSortNotBefore = now() + intervalMs
			}
			schedule()
		},
		lockForTouch: () => {
			touchLocked = true
			clearScheduledTimer()
		},
		releaseTouch: () => {
			if (!touchLocked) return
			touchLocked = false
			touchReleaseNotBefore = now() + touchReleaseGuardMs
			schedule()
		},
		flushNow,
		cancel: () => {
			clearScheduledTimer()
			dirty = false
			touchLocked = false
			nextSortNotBefore = 0
			touchReleaseNotBefore = 0
		},
	}
}
