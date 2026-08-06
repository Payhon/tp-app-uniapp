import {
	INSTRUMENT_PASSTHROUGH_WAIT_TIMEOUT_MS,
	shouldExpireInstrumentPassthroughWait,
} from './instrument-passthrough-policy'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

const base = {
	sessionMode: 'instrument' as const,
	connType: 'bluetooth' as const,
	hasStatus: false,
	alreadyUnavailable: false,
}

assert(INSTRUMENT_PASSTHROUGH_WAIT_TIMEOUT_MS === 10_000, 'instrument passthrough wait must be 10 seconds')
assert(
	!shouldExpireInstrumentPassthroughWait({ ...base, elapsedMs: 9_999 }),
	'instrument passthrough wait must remain active before 10 seconds'
)
assert(
	shouldExpireInstrumentPassthroughWait({ ...base, elapsedMs: 10_000 }),
	'instrument passthrough wait must expire at 10 seconds'
)
assert(
	!shouldExpireInstrumentPassthroughWait({ ...base, elapsedMs: 10_000, hasStatus: true }),
	'a successful status read must win before the deadline'
)
assert(
	!shouldExpireInstrumentPassthroughWait({ ...base, elapsedMs: 10_000, sessionMode: 'cloud' }),
	'cloud sessions must not use the instrument passthrough deadline'
)
assert(
	!shouldExpireInstrumentPassthroughWait({ ...base, elapsedMs: 10_000, connType: 'mqtt' }),
	'non-Bluetooth connections must not use the instrument passthrough deadline'
)
assert(
	!shouldExpireInstrumentPassthroughWait({ ...base, elapsedMs: 10_000, alreadyUnavailable: true }),
	'an expired instrument session must not expire twice'
)

console.log('instrument passthrough policy tests passed')
