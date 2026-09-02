export const INSTRUMENT_PASSTHROUGH_WAIT_TIMEOUT_MS = 10_000
export const INSTRUMENT_WARMUP_POLL_INTERVAL_MS = 1_200
export const INSTRUMENT_WAITING_POLL_INTERVAL_MS = 3_000

export const resolveInstrumentPollDelay = (options: {
	hasStatus: boolean
	waitExpired: boolean
	normalIntervalMs: number
}): number => options.hasStatus
	? options.normalIntervalMs
	: options.waitExpired ? INSTRUMENT_WAITING_POLL_INTERVAL_MS : INSTRUMENT_WARMUP_POLL_INTERVAL_MS

export const shouldExpireInstrumentPassthroughWait = (options: {
	elapsedMs: number
	sessionMode: 'cloud' | 'instrument'
	connType: 'bluetooth' | 'mqtt' | 'offline'
	hasStatus: boolean
	alreadyUnavailable: boolean
}): boolean =>
	options.sessionMode === 'instrument' &&
	options.connType === 'bluetooth' &&
	!options.hasStatus &&
	!options.alreadyUnavailable &&
	options.elapsedMs >= INSTRUMENT_PASSTHROUGH_WAIT_TIMEOUT_MS
