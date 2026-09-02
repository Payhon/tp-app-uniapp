import {
	BLE_SCAN_LIST_SORT_INTERVAL_MS,
	BLE_SCAN_LIST_TOUCH_RELEASE_GUARD_MS,
	appendBleScanDeviceId,
	createBleScanListSortScheduler,
	sortBleScanDeviceIds,
} from './ble-scan-list-order-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

function assertOrder(actual: readonly string[], expected: readonly string[], message: string) {
	assert(actual.join(',') === expected.join(','), `${message}: expected ${expected.join(',')}, got ${actual.join(',')}`)
}

assert(BLE_SCAN_LIST_SORT_INTERVAL_MS === 2_000, 'list reorder interval should be 2 seconds')
assert(BLE_SCAN_LIST_TOUCH_RELEASE_GUARD_MS === 600, 'touch release guard should be 600ms')
assertOrder(appendBleScanDeviceId(['A', 'B'], 'C'), ['A', 'B', 'C'], 'new devices should append at the end')
assertOrder(appendBleScanDeviceId(['A', 'B'], 'A'), ['A', 'B'], 'existing devices should keep their position')

const stableRssiOrder = sortBleScanDeviceIds({
	previousOrder: ['B', 'A', 'invalid', 'weaker'],
	targetMac: null,
	items: [
		{ deviceId: 'A', RSSI: -70, advMac: 'AC0000000001' },
		{ deviceId: 'B', RSSI: -70, advMac: 'AC0000000002' },
		{ deviceId: 'invalid', RSSI: null, advMac: 'AC0000000003' },
		{ deviceId: 'weaker', RSSI: -80, advMac: 'AC0000000004' },
	],
})
assertOrder(stableRssiOrder, ['B', 'A', 'weaker', 'invalid'], 'equal RSSI should preserve previous order and invalid RSSI should be last')

const targetFirstOrder = sortBleScanDeviceIds({
	previousOrder: ['strong', 'target', 'weak'],
	targetMac: 'AC0000000099',
	items: [
		{ deviceId: 'strong', RSSI: -45, advMac: 'AC0000000001' },
		{ deviceId: 'target', RSSI: -95, advMac: 'AC0000000099' },
		{ deviceId: 'weak', RSSI: -90, advMac: 'AC0000000002' },
	],
})
assertOrder(targetFirstOrder, ['target', 'strong', 'weak'], 'QR target should remain ahead of stronger non-target devices')

class FakeClock {
	private currentTime = 0
	private nextId = 0
	private tasks = new Map<number, { dueAt: number; callback: () => void }>()

	now = () => this.currentTime

	setTimer = (callback: () => void, delayMs: number): ReturnType<typeof setTimeout> => {
		const id = ++this.nextId
		this.tasks.set(id, { dueAt: this.currentTime + Math.max(0, delayMs), callback })
		return id as unknown as ReturnType<typeof setTimeout>
	}

	clearTimer = (handle: ReturnType<typeof setTimeout>) => {
		this.tasks.delete(handle as unknown as number)
	}

	tick(milliseconds: number) {
		const targetTime = this.currentTime + milliseconds
		while (true) {
			const dueTask = Array.from(this.tasks.entries())
				.filter(([, task]) => task.dueAt <= targetTime)
				.sort((left, right) => left[1].dueAt - right[1].dueAt || left[0] - right[0])[0]
			if (!dueTask) break
			const [id, task] = dueTask
			this.tasks.delete(id)
			this.currentTime = task.dueAt
			task.callback()
		}
		this.currentTime = targetTime
	}
}

function createSchedulerHarness() {
	const clock = new FakeClock()
	let flushCount = 0
	const scheduler = createBleScanListSortScheduler({
		onFlush: () => {
			flushCount += 1
		},
		now: clock.now,
		setTimer: clock.setTimer,
		clearTimer: clock.clearTimer,
	})
	return { clock, scheduler, getFlushCount: () => flushCount }
}

{
	const { clock, scheduler, getFlushCount } = createSchedulerHarness()
	scheduler.markDirty()
	clock.tick(500)
	scheduler.markDirty()
	clock.tick(1_499)
	assert(getFlushCount() === 0, 'continuous advertisements should not reorder before 2 seconds')
	clock.tick(1)
	assert(getFlushCount() === 1, 'continuous advertisements should share one 2 second reorder')
	scheduler.markDirty()
	clock.tick(1_999)
	assert(getFlushCount() === 1, 'the next reorder should also wait a full 2 seconds')
	clock.tick(1)
	assert(getFlushCount() === 2, 'the next reorder should run after the 2 second interval')
}

{
	const { clock, scheduler, getFlushCount } = createSchedulerHarness()
	scheduler.markDirty()
	clock.tick(500)
	scheduler.lockForTouch()
	clock.tick(200)
	scheduler.releaseTouch()
	clock.tick(1_299)
	assert(getFlushCount() === 0, 'an early touch release should not bypass the original 2 second interval')
	clock.tick(1)
	assert(getFlushCount() === 1, 'reorder should run when both the interval and release guard are satisfied')
}

{
	const { clock, scheduler, getFlushCount } = createSchedulerHarness()
	scheduler.markDirty()
	clock.tick(1_500)
	scheduler.lockForTouch()
	clock.tick(1_000)
	assert(getFlushCount() === 0, 'touching or scrolling should pause a due reorder')
	scheduler.releaseTouch()
	clock.tick(599)
	assert(getFlushCount() === 0, 'reorder should remain paused during the 600ms release guard')
	clock.tick(1)
	assert(getFlushCount() === 1, 'pending reorder should resume after the release guard')
}

{
	const { clock, scheduler, getFlushCount } = createSchedulerHarness()
	scheduler.markDirty()
	clock.tick(100)
	assert(scheduler.flushNow(), 'stopping a scan should be able to flush the final order immediately')
	assert(getFlushCount() === 1, 'final order should flush exactly once')
	clock.tick(5_000)
	assert(getFlushCount() === 1, 'immediate final flush should cancel the delayed timer')
}

{
	const { clock, scheduler, getFlushCount } = createSchedulerHarness()
	scheduler.markDirty()
	scheduler.cancel()
	clock.tick(5_000)
	assert(getFlushCount() === 0, 'clear, hide, unload, or session invalidation should cancel stale reorder tasks')
}

console.log('BLE scan list order policy tests passed')
