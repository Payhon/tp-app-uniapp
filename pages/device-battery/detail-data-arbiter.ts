export const MQTT_CLOUD_FALLBACK_FAILURE_THRESHOLD = 2
export const MQTT_REALTIME_STALE_BEFORE_FALLBACK_MS = 10_000
export const MQTT_CLOUD_REPORT_CLOCK_SKEW_MS = 5_000

export type DetailDataSessionToken = {
	generation: number
	sessionKey: string
	deviceId: string
}

export type CloudTelemetryRequestKind = 'bootstrap' | 'fallback' | 'cloud_mode'

export type CloudTelemetryRequestToken = DetailDataSessionToken & {
	requestSequence: number
	realtimeSuccessSequence: number
	kind: CloudTelemetryRequestKind
}

export type DetailDataArbiterState = DetailDataSessionToken & {
	disposed: boolean
	nextCloudRequestSequence: number
	latestCloudRequestSequence: number
	realtimeSuccessSequence: number
	hasRealtimeStatus: boolean
	consecutiveRealtimeFailures: number
	lastRealtimeSuccessAtMs: number
	lastCloudReportTs: number
}

export type CloudTelemetryResponseDecision =
	| { apply: true; reportTs: number }
	| {
			apply: false
				reason:
					| 'disposed'
					| 'session_changed'
					| 'request_superseded'
					| 'realtime_advanced'
					| 'payload_device_mismatch'
					| 'cloud_report_older_than_realtime'
					| 'cloud_report_older'
		  }

const normalizeReportTs = (value: unknown) => {
	const ts = Number(value)
	return Number.isFinite(ts) && ts > 0 ? ts : 0
}

export const createDetailDataArbiterState = (): DetailDataArbiterState => ({
	generation: 0,
	sessionKey: '',
	deviceId: '',
	disposed: false,
	nextCloudRequestSequence: 0,
	latestCloudRequestSequence: 0,
	realtimeSuccessSequence: 0,
	hasRealtimeStatus: false,
	consecutiveRealtimeFailures: 0,
	lastRealtimeSuccessAtMs: 0,
	lastCloudReportTs: 0,
})

export const beginDetailDataSession = (
	state: DetailDataArbiterState,
	input: { sessionKey: string; deviceId: string }
): DetailDataArbiterState => {
	if (state.disposed) return state
	return {
		...createDetailDataArbiterState(),
		generation: state.generation + 1,
		sessionKey: input.sessionKey,
		deviceId: input.deviceId,
		nextCloudRequestSequence: state.nextCloudRequestSequence,
	}
}

export const disposeDetailDataSession = (state: DetailDataArbiterState): DetailDataArbiterState => ({
	...state,
	generation: state.generation + 1,
	sessionKey: '',
	deviceId: '',
	disposed: true,
	latestCloudRequestSequence: state.nextCloudRequestSequence + 1,
	nextCloudRequestSequence: state.nextCloudRequestSequence + 1,
})

export const captureDetailDataSession = (state: DetailDataArbiterState): DetailDataSessionToken => ({
	generation: state.generation,
	sessionKey: state.sessionKey,
	deviceId: state.deviceId,
})

export const isDetailDataSessionCurrent = (
	state: DetailDataArbiterState,
	token: DetailDataSessionToken
): boolean => {
	return (
		!state.disposed &&
		state.generation === token.generation &&
		state.sessionKey === token.sessionKey &&
		state.deviceId === token.deviceId
	)
}

export const beginCloudTelemetryRequest = (
	state: DetailDataArbiterState,
	kind: CloudTelemetryRequestKind
): { state: DetailDataArbiterState; token: CloudTelemetryRequestToken } => {
	const requestSequence = state.nextCloudRequestSequence + 1
	const nextState = {
		...state,
		nextCloudRequestSequence: requestSequence,
		latestCloudRequestSequence: requestSequence,
	}
	return {
		state: nextState,
		token: {
			...captureDetailDataSession(nextState),
			requestSequence,
			realtimeSuccessSequence: state.realtimeSuccessSequence,
			kind,
		},
	}
}

export const markRealtimeStatusSuccess = (
	state: DetailDataArbiterState,
	nowMs: number
): DetailDataArbiterState => ({
	...state,
	realtimeSuccessSequence: state.realtimeSuccessSequence + 1,
	hasRealtimeStatus: true,
	consecutiveRealtimeFailures: 0,
	lastRealtimeSuccessAtMs: nowMs,
})

export const markRealtimeStatusFailure = (
	state: DetailDataArbiterState,
	nowMs: number
): { state: DetailDataArbiterState; shouldFallback: boolean } => {
	const consecutiveRealtimeFailures = state.consecutiveRealtimeFailures + 1
	const nextState = { ...state, consecutiveRealtimeFailures }
	const realtimeIsStale =
		state.lastRealtimeSuccessAtMs <= 0 || nowMs - state.lastRealtimeSuccessAtMs >= MQTT_REALTIME_STALE_BEFORE_FALLBACK_MS
	return {
		state: nextState,
		shouldFallback:
			!state.hasRealtimeStatus ||
			(consecutiveRealtimeFailures >= MQTT_CLOUD_FALLBACK_FAILURE_THRESHOLD && realtimeIsStale),
	}
}

export const decideCloudTelemetryResponse = (
	state: DetailDataArbiterState,
	token: CloudTelemetryRequestToken,
	payload: { deviceId: unknown; lastReportTs: unknown }
): CloudTelemetryResponseDecision => {
	if (state.disposed) return { apply: false, reason: 'disposed' }
	if (!isDetailDataSessionCurrent(state, token)) return { apply: false, reason: 'session_changed' }
	if (state.latestCloudRequestSequence !== token.requestSequence) {
		return { apply: false, reason: 'request_superseded' }
	}
	if (state.realtimeSuccessSequence !== token.realtimeSuccessSequence) {
		return { apply: false, reason: 'realtime_advanced' }
	}
	const payloadDeviceId = String(payload.deviceId || '').trim()
	if (!payloadDeviceId || payloadDeviceId !== token.deviceId) {
		return { apply: false, reason: 'payload_device_mismatch' }
	}
	const reportTs = normalizeReportTs(payload.lastReportTs)
	if (
		token.kind === 'fallback' &&
		state.hasRealtimeStatus &&
		state.lastRealtimeSuccessAtMs > 0 &&
		(reportTs === 0 || reportTs + MQTT_CLOUD_REPORT_CLOCK_SKEW_MS < state.lastRealtimeSuccessAtMs)
	) {
		return { apply: false, reason: 'cloud_report_older_than_realtime' }
	}
	if (state.lastCloudReportTs > 0 && (reportTs === 0 || reportTs < state.lastCloudReportTs)) {
		return { apply: false, reason: 'cloud_report_older' }
	}
	return { apply: true, reportTs }
}

export const commitCloudTelemetryResponse = (
	state: DetailDataArbiterState,
	reportTs: number
): DetailDataArbiterState => ({
	...state,
	lastCloudReportTs: Math.max(state.lastCloudReportTs, normalizeReportTs(reportTs)),
})

export const shouldUseCompleteCloudSnapshot = (input: {
	hasSnapshot: boolean
	snapshotTs: unknown
	lastReportTs: unknown
}): boolean => {
	if (!input.hasSnapshot) return false
	const snapshotTs = normalizeReportTs(input.snapshotTs)
	const lastReportTs = normalizeReportTs(input.lastReportTs)
	return snapshotTs > 0 && snapshotTs >= lastReportTs
}
