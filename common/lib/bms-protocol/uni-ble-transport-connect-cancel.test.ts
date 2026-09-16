import { acquireBleDiscoveryLease } from '@/common/ble/ble-discovery-coordinator'
import { createUniBleBmsTransport } from './uni-ble-transport'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

let notifyListener: ((value: unknown) => void) | null = null
let connectionListener: ((value: { deviceId: string; connected: boolean }) => void) | null = null
let signalCreateConnection!: () => void
let nativeCreate: Record<string, any>
let nativeClose: Record<string, any>
let closeCalls = 0
const createConnectionCalled = new Promise<void>((resolve) => {
	signalCreateConnection = resolve
})

const succeed = (options: Record<string, any>, value: unknown = {}) => {
	options.success?.(value)
	options.complete?.(value)
}

;(globalThis as any).wx = {
	openBluetoothAdapter: (options: Record<string, any>) => succeed(options),
}
;(globalThis as any).uni = {
	openBluetoothAdapter: (options: Record<string, any>) => succeed(options),
	onBLECharacteristicValueChange: (listener: (value: unknown) => void) => {
		notifyListener = listener
	},
	onBLEConnectionStateChange: (listener: typeof connectionListener) => { connectionListener = listener },
	getSystemInfoSync: () => ({ platform: 'android' }),
	stopBluetoothDevicesDiscovery: (options: Record<string, any>) => succeed(options),
	createBLEConnection: (options: Record<string, any>) => { nativeCreate = options; signalCreateConnection() },
	closeBLEConnection: (options: Record<string, any>) => { closeCalls++; nativeClose = options },
}

async function main() {
	const transport = createUniBleBmsTransport({})
	const connectTask = transport.connect({ deviceId: 'AA:BB:CC:DD:EE:FF' })
	await createConnectionCalled

	const startedAt = Date.now()
	const closeTask = transport.disconnect()
	assert(transport.disconnect() === closeTask, 'duplicate close shares one native task')
	let connectRejected = false
	try {
		await connectTask
	} catch (error) {
		connectRejected = true
	}

	assert(connectRejected, 'disconnect should cancel a pending BLE connection')
	assert(Date.now() - startedAt < 500, 'pending connection cancellation should not wait for the native timeout')
	assert(typeof notifyListener === 'function', 'transport init should preserve the notification listener setup')
	assert(closeCalls === 0, 'close must wait for pending native create to finish')

	const lease = await acquireBleDiscoveryLease('connect-cancel-test')
	lease.release()
	succeed(nativeCreate)
	await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
	assert(Number(closeCalls) === 1, 'late create completion must be followed by exactly one close')
	let closed = false
	void closeTask.then(() => { closed = true })
	await Promise.resolve()
	assert(!closed, 'missing close callback cannot release the barrier')
	succeed(nativeClose)
	await closeTask
	assert(transport.deviceId === null, 'native close clears connection identity')

	for (const errCode of [10006, 10008]) {
		const t = createUniBleBmsTransport({})
		t.deviceId = 'old'
		;(globalThis as any).uni.closeBLEConnection = (options: Record<string, any>) => options.fail({ errCode, errMsg: 'native close result' })
		let rejected = false
		await t.disconnect().catch(() => { rejected = true })
		assert(rejected === (errCode !== 10006), 'only explicit no-connection can count as successful close')
		assert((t.getDisconnectError() as { errCode: number }).errCode === errCode, 'native close error is retained for diagnostics')
	}
	for (const method of ['request', 'requestWithResponse'] as const) {
		const t = createUniBleBmsTransport({})
		let drain!: () => void
		;(t as any)._queue = new Promise<void>(resolve => { drain = resolve })
		const request = t[method](new Uint8Array([1, 2, 3]))
		t._onConnectionStateChange(false)
		drain()
		let message = ''
		await request.catch(error => { message = error.message })
		assert(message === 'BLE connection changed', 'old queued work must not dispatch after disconnect')
	}
	const old = createUniBleBmsTransport({})
	const replacement = createUniBleBmsTransport({})
	old.deviceId = replacement.deviceId = 'same-device'
	let replacementDisconnects = 0
	replacement.onDisconnect(() => { replacementDisconnects++ })
	old._registerConnectionStateCallback()
	replacement._registerConnectionStateCallback()
	;(globalThis as any).uni.closeBLEConnection = (options: Record<string, any>) => succeed(options)
	await old.disconnect()
	assert(connectionListener, 'global native connection listener exists')
	connectionListener({ deviceId: 'same-device', connected: false })
	assert(replacementDisconnects === 1, 'old close cannot unregister replacement connection routing')

	console.log('BLE transport connect cancellation tests passed')
}

void main()
