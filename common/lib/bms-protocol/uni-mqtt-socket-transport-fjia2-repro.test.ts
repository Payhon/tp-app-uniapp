import { BmsClient } from './client'
import { createUniMqttSocketBmsTransport } from './uni-mqtt-socket-transport'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

const SINGLE_SECTION_KEYS = [
	'CELL_OV_ALARM_V',
	'CELL_OC_PROTECT_V',
	'CELL_OC_ALARM_DELAY_S',
	'CELL_OC_PROTECT_DELAY_S',
	'FEEDBACK_OC_PROTECT_DELAY_S',
	'CELL_OV_PROTECT_RELEASE_V',
	'CELL_OC_ALARM_RELEASE_DELTA_V',
	'CELL_OV_ALARM_RELEASE_DELAY_S',
	'CELL_OV_PROTECT_RELEASE_DELAY_S',
	'NORMAL_CELL_UV_ALARM_V',
	'NORMAL_CELL_UV_PROTECT_V',
	'LOW_TEMP_CELL_UV_ALARM_V',
	'LOW_TEMP_CELL_UV_PROTECT_V',
	'CELL_UV_ALARM_DELAY_S',
	'CELL_UV_PROTECT_DELAY_S',
	'CELL_UV_ALARM_RELEASE_V',
	'CELL_UV_PROTECT_RELEASE_V',
	'CELL_UV_ALARM_RELEASE_DELAY_S',
	'CELL_UV_PROTECT_RELEASE_DELAY_S',
]

const RESPONSE_BY_REQUEST: Record<string, string> = {
	'7F55FE01030100000185F6FD': '7F5501FE030218022791FD',
	'7F55FE010304000006C4F8FD': '7F5501FE030C0E420E42141400140D480D483029FD',
	'7F55FE010304080009053EFD': '7F5501FE031214140AF008FC09C407D014140B540960321466F0FD',
}

async function main(): Promise<void> {
	const handlers: Record<string, Function> = {}
	const sent: string[] = []
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
			const hex = String(data)
			sent.push(hex)
			success && success({})
			const response = RESPONSE_BY_REQUEST[hex]
			if (response) {
				setTimeout(() => {
					handlers.message && handlers.message({ data: JSON.stringify({ hex }) })
				}, 10)
				setTimeout(() => {
					handlers.message && handlers.message({ data: JSON.stringify({ hex: response }) })
				}, 20)
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
			sleepWakeupResendDelayMs: 200,
			logger: {},
		})
		const connectPromise = transport.connect()
		handlers.open && handlers.open()
		handlers.message && handlers.message({ data: JSON.stringify({ type: 'socket_ready' }) })
		await connectPromise
		const client = new BmsClient({ transport })
		const wakeupOk = await client.wakeupReadLink({ timeoutMs: 1000 })
		assert(wakeupOk, 'fjia2 wakeup probe should consume the 0x0100 response')
		const values = await client.readParamsByKeys(SINGLE_SECTION_KEYS, { timeoutMs: 1000 })
		assert(values.CELL_OV_ALARM_V === 3.65, 'fjia2 single-cell section should decode first group values')
		assert(values.NORMAL_CELL_UV_PROTECT_V === 2.3000000000000003, 'fjia2 single-cell section should decode second group values')
		assert(sent.filter((hex) => hex === '7F55FE010304000006C4F8FD').length === 1, '0x0400 read should not need a wakeup resend')
		assert(sent.filter((hex) => hex === '7F55FE010304080009053EFD').length === 1, '0x0408 read should not need a wakeup resend')
		await transport.disconnect()
	} finally {
		;(globalThis as any).uni = prevUni
	}
}

void main().catch((err) => {
	setTimeout(() => {
		throw err
	}, 0)
})
