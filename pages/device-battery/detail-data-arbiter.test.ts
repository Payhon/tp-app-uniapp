import {
	beginCloudTelemetryRequest,
	beginDetailDataSession,
	commitCloudTelemetryResponse,
	createDetailDataArbiterState,
	decideCloudTelemetryResponse,
	disposeDetailDataSession,
	markRealtimeStatusFailure,
	markRealtimeStatusSuccess,
	shouldUseCompleteCloudSnapshot,
} from './detail-data-arbiter'

const assert = (condition: unknown, message: string) => {
	if (!condition) throw new Error(message)
}

const startDeviceSession = (deviceId: string) =>
	beginDetailDataSession(createDetailDataArbiterState(), {
		sessionKey: `cloud:${deviceId}`,
		deviceId,
	})

{
	let state = startDeviceSession('A')
	const bootstrap = beginCloudTelemetryRequest(state, 'bootstrap')
	state = markRealtimeStatusSuccess(bootstrap.state, 1_000)
	const decision = decideCloudTelemetryResponse(state, bootstrap.token, { deviceId: 'A', lastReportTs: 900 })
	assert(
		decision.apply === false && decision.reason === 'realtime_advanced',
		'late bootstrap must not overwrite realtime status'
	)
}

{
	let state = markRealtimeStatusSuccess(startDeviceSession('A'), 1_000)
	state = markRealtimeStatusFailure(state, 6_000).state
	const secondFailure = markRealtimeStatusFailure(state, 11_000)
	assert(secondFailure.shouldFallback, 'stale realtime data should allow fallback after two failures')
	const fallback = beginCloudTelemetryRequest(secondFailure.state, 'fallback')
	state = markRealtimeStatusSuccess(fallback.state, 12_000)
	const decision = decideCloudTelemetryResponse(state, fallback.token, { deviceId: 'A', lastReportTs: 11_500 })
	assert(
		decision.apply === false && decision.reason === 'realtime_advanced',
		'late fallback must not overwrite recovered realtime status'
	)
}

{
	let state = startDeviceSession('A')
	const requestA = beginCloudTelemetryRequest(state, 'bootstrap')
	state = beginDetailDataSession(requestA.state, { sessionKey: 'cloud:B', deviceId: 'B' })
	const decision = decideCloudTelemetryResponse(state, requestA.token, { deviceId: 'A', lastReportTs: 1_000 })
	assert(
		decision.apply === false && decision.reason === 'session_changed',
		'device A response must not update device B session'
	)
}

{
	let state = startDeviceSession('A')
	const freshRequest = beginCloudTelemetryRequest(state, 'cloud_mode')
	let decision = decideCloudTelemetryResponse(freshRequest.state, freshRequest.token, {
		deviceId: 'A',
		lastReportTs: 2_000,
	})
	assert(decision.apply, 'fresh cloud response should be accepted')
	if (!decision.apply) throw new Error('fresh cloud response unexpectedly rejected')
	state = commitCloudTelemetryResponse(freshRequest.state, decision.reportTs)
	const staleRequest = beginCloudTelemetryRequest(state, 'cloud_mode')
	decision = decideCloudTelemetryResponse(staleRequest.state, staleRequest.token, {
		deviceId: 'A',
		lastReportTs: 1_000,
	})
	assert(
		decision.apply === false && decision.reason === 'cloud_report_older',
		'older cloud report must not replace newer cloud data'
	)
}

{
	let state = markRealtimeStatusSuccess(startDeviceSession('A'), 1_000)
	const singleFailure = markRealtimeStatusFailure(state, 20_000)
	assert(!singleFailure.shouldFallback, 'one realtime failure must keep the last realtime status')
	state = singleFailure.state
	assert(state.consecutiveRealtimeFailures === 1, 'single failure should be tracked for the next poll')
}

{
	const state = markRealtimeStatusSuccess(startDeviceSession('A'), 20_000)
	const fallback = beginCloudTelemetryRequest(state, 'fallback')
	const staleDecision = decideCloudTelemetryResponse(fallback.state, fallback.token, {
		deviceId: 'A',
		lastReportTs: 10_000,
	})
	assert(
		staleDecision.apply === false && staleDecision.reason === 'cloud_report_older_than_realtime',
		'fallback older than the last realtime success must preserve last-good realtime status'
	)
	const nearRealtimeDecision = decideCloudTelemetryResponse(fallback.state, fallback.token, {
		deviceId: 'A',
		lastReportTs: 16_000,
	})
	assert(nearRealtimeDecision.apply, 'fallback within the clock-skew allowance may replace stale realtime status')
}

{
	const state = startDeviceSession('A')
	const firstFailure = markRealtimeStatusFailure(state, 1_000)
	assert(firstFailure.shouldFallback, 'a session without realtime status may use cloud data immediately')
}

{
	let state = startDeviceSession('A')
	state = disposeDetailDataSession(state)
	const revived = beginDetailDataSession(state, { sessionKey: 'cloud:B', deviceId: 'B' })
	assert(revived.disposed, 'disposed arbiter must not be revived by a delayed session start')
	assert(revived.generation === state.generation, 'disposed arbiter generation must remain stable')
}

{
	assert(
		shouldUseCompleteCloudSnapshot({ hasSnapshot: true, snapshotTs: 2_000, lastReportTs: 2_000 }),
		'snapshot at the latest report timestamp should be used'
	)
	assert(
		!shouldUseCompleteCloudSnapshot({ hasSnapshot: true, snapshotTs: 1_999, lastReportTs: 2_000 }),
		'older snapshot must not replace newer per-key current telemetry'
	)
	assert(
		!shouldUseCompleteCloudSnapshot({ hasSnapshot: true, snapshotTs: undefined, lastReportTs: 2_000 }),
		'snapshot without its own timestamp must not be trusted as complete'
	)
	assert(
		!shouldUseCompleteCloudSnapshot({ hasSnapshot: false, snapshotTs: 2_000, lastReportTs: 2_000 }),
		'missing snapshot payload must not be selected'
	)
}
