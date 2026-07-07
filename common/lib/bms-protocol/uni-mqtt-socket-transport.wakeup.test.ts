import { BMS_FUNC, buildReadFrame } from './frame'
import { BmsClient } from './client'
import {
	DEFAULT_SOCKET_SLEEP_WAKEUP_IDLE_MS,
	createUniMqttSocketBmsTransport,
	shouldRunSocketWakeupProbe,
	shouldScheduleSocketWakeupResend,
	socketMessageToText,
} from './uni-mqtt-socket-transport'

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
const socketJsonText = '{"hex":"7F5501FE030218022791FD"}'
const socketJsonBytes = Uint8Array.from(Array.from(socketJsonText).map((ch) => ch.charCodeAt(0)))

assert(socketMessageToText(socketJsonBytes.buffer) === socketJsonText, 'socket onMessage should decode ArrayBuffer data')
assert(socketMessageToText(socketJsonBytes) === socketJsonText, 'socket onMessage should decode Uint8Array data')

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

assert(DEFAULT_SOCKET_SLEEP_WAKEUP_IDLE_MS === 180_000, '4G MQTT sleep wakeup idle threshold should model 3 minutes')

assert(
	shouldRunSocketWakeupProbe({ lastResponseAt: 0, now: 200_000, idleMs: DEFAULT_SOCKET_SLEEP_WAKEUP_IDLE_MS }),
	'never received response should run wakeup probe',
)

assert(
	!shouldRunSocketWakeupProbe({ lastResponseAt: 80_000, now: 200_000, idleMs: DEFAULT_SOCKET_SLEEP_WAKEUP_IDLE_MS }),
	'recent response should skip wakeup probe',
)

assert(
	shouldRunSocketWakeupProbe({ lastResponseAt: 10_000, now: 200_000, idleMs: DEFAULT_SOCKET_SLEEP_WAKEUP_IDLE_MS }),
	'response older than sleep threshold should run wakeup probe',
)

async function assertSocketTransportKeepsValidFrameWithTrailingBytes(): Promise<void> {
	const sent: string[] = []
	const handlers: Record<string, Function> = {}
	const fakeTask = {
		onOpen(cb: Function) {
			handlers.open = cb
		},
		onClose(cb: Function) {
			handlers.close = cb
		},
		onError(cb: Function) {
			handlers.error = cb
		},
		onMessage(cb: Function) {
			handlers.message = cb
		},
		send({ data, success }: { data: string; success?: Function }) {
			sent.push(String(data))
			success && success({})
			if (String(data).includes('0304080009')) {
				setTimeout(() => {
					handlers.message &&
						handlers.message({
							data: JSON.stringify({
								hex: '7F5501FE031214140AF008FC09C407D014140B540960321466F0FD150C130C130C140C',
							}),
						})
				}, 10)
			}
		},
		close() {},
	}
	const prevUni = (globalThis as any).uni
	;(globalThis as any).uni = {
		connectSocket() {
			return fakeTask
		},
	}
	try {
		const transport = createUniMqttSocketBmsTransport({
			wsUrl: 'wss://example.invalid/socket',
			deviceId: 'device-id',
			token: 'token',
			requestTimeoutMs: 1000,
			minFrameIntervalMs: 0,
			logger: {},
		})
		const connectPromise = transport.connect()
		handlers.open && handlers.open()
		handlers.message && handlers.message({ data: JSON.stringify({ type: 'socket_ready' }) })
		await connectPromise
		const client = new BmsClient({ transport })
		const regs = await client.readRegisters(0x0408, 9, { timeoutMs: 1000 })
		assert(regs.length === 9, 'socket transport should return registers from a valid frame with trailing bytes')
		assert(regs[0] === 0x1414 && regs[8] === 0x3214, 'socket transport should preserve 0x0408 response registers')
		await transport.disconnect()
	} finally {
		;(globalThis as any).uni = prevUni
	}
}

void assertSocketTransportKeepsValidFrameWithTrailingBytes().catch((err) => {
	setTimeout(() => {
		throw err
	}, 0)
})
