import { resolveMeterScanHandoffUi, shouldCollapseMeterScanPanel } from './meter-scan-handoff-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

const base = {
	sessionMode: 'instrument' as const,
	allowScanHandoff: true,
	connType: 'bluetooth' as const,
	connecting: false,
	hasBmsStatus: false,
	bmsDataLoading: false,
	instrumentPassthroughUnavailable: false,
	panelVisible: true,
	activeTab: 0,
}

const initialGuidance = resolveMeterScanHandoffUi(base)
assert(initialGuidance.available, 'instrument Bluetooth sessions must allow BMS scan handoff')
assert(initialGuidance.showPanel, 'the scan guidance panel should be visible before BMS status is ready')
assert(!initialGuidance.showTrigger, 'the collapsed trigger should stay hidden while the guidance panel is open')

assert(
	shouldCollapseMeterScanPanel({ hasBmsStatus: true, previousHasBmsStatus: false }),
	'the first successful BMS status read should collapse the guidance panel'
)
assert(
	!shouldCollapseMeterScanPanel({ hasBmsStatus: true, previousHasBmsStatus: true }),
	'an already-ready BMS status must not collapse a panel reopened by the user'
)

const readyCollapsed = resolveMeterScanHandoffUi({
	...base,
	hasBmsStatus: true,
	bmsDataLoading: true,
	panelVisible: false,
})
assert(!readyCollapsed.showPanel, 'the guidance panel should be hidden after BMS status is ready')
assert(readyCollapsed.showTrigger, 'the top scan trigger should remain visible after BMS status is ready')

const readyReopened = resolveMeterScanHandoffUi({
	...base,
	hasBmsStatus: true,
	panelVisible: true,
})
assert(readyReopened.showPanel, 'clicking the top trigger should reopen the scan guidance panel')
assert(!readyReopened.showTrigger, 'the top trigger should hide while the guidance panel is open')

const collapsedWithoutStatus = resolveMeterScanHandoffUi({ ...base, panelVisible: false })
assert(collapsedWithoutStatus.showTrigger, 'manually collapsing the initial guidance should expose the top trigger')

const loadingWithoutStatus = resolveMeterScanHandoffUi({ ...base, bmsDataLoading: true })
assert(!loadingWithoutStatus.available, 'scan guidance should wait while the first BMS status read is active')

const unavailableStates = [
	resolveMeterScanHandoffUi({ ...base, sessionMode: 'cloud' }),
	resolveMeterScanHandoffUi({ ...base, allowScanHandoff: false }),
	resolveMeterScanHandoffUi({ ...base, connType: 'mqtt' }),
	resolveMeterScanHandoffUi({ ...base, connecting: true }),
]
assert(
	unavailableStates.every((state) => !state.available && !state.showPanel && !state.showTrigger),
	'cloud, disabled, non-Bluetooth, and connecting states must hide both scan handoff surfaces'
)

console.log('meter scan handoff policy tests passed')
