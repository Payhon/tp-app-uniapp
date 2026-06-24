import { BMS_FUNC, buildReadFrame } from './frame'
import { shouldScheduleSocketWakeupResend } from './uni-mqtt-socket-transport'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

const readFrame = buildReadFrame({
	sourceAddress: 0x01,
	targetAddress: 0x01,
	functionCode: BMS_FUNC.READ_HOLDING_REGISTERS,
	startAddress: 0x0100,
	quantity: 1,
})

const writeFrame = new Uint8Array([0x7f, 0x55, 0x01, 0x01, 0x10, 0x04, 0x00, 0x00, 0x01, 0x02, 0x03, 0xfd])
const bootFrame = new Uint8Array([0x55, 0xfe, 0x01, 0x50, 0x00, 0x00, 0x00, 0x00, 0xfd])

assert(
	shouldScheduleSocketWakeupResend(readFrame, {
		expectBoot: false,
		lastResponseAt: 0,
		now: 60_000,
		idleMs: 30_000,
		delayMs: 1200,
		timeoutMs: 10_000,
	}),
	'read query without recent response should schedule wakeup resend',
)

assert(
	!shouldScheduleSocketWakeupResend(readFrame, {
		expectBoot: false,
		lastResponseAt: 59_000,
		now: 60_000,
		idleMs: 30_000,
		delayMs: 1200,
		timeoutMs: 10_000,
	}),
	'recent response should not schedule wakeup resend',
)

assert(
	!shouldScheduleSocketWakeupResend(writeFrame, {
		expectBoot: false,
		lastResponseAt: 0,
		now: 60_000,
		idleMs: 30_000,
		delayMs: 1200,
		timeoutMs: 10_000,
	}),
	'write command should not schedule wakeup resend',
)

assert(
	!shouldScheduleSocketWakeupResend(bootFrame, {
		expectBoot: true,
		lastResponseAt: 0,
		now: 60_000,
		idleMs: 30_000,
		delayMs: 1200,
		timeoutMs: 10_000,
	}),
	'BOOT OTA command should not schedule wakeup resend',
)
