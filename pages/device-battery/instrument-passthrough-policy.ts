export const INSTRUMENT_PASSTHROUGH_WAIT_TIMEOUT_MS = 10_000

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
