import { acquireBleDiscoveryLease } from '@/common/ble/ble-discovery-coordinator'
import { createUniBleBmsTransport } from './uni-ble-transport'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

let notifyListener: ((value: unknown) => void) | null = null
let signalCreateConnection!: () => void
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
	getSystemInfoSync: () => ({ platform: 'android' }),
	stopBluetoothDevicesDiscovery: (options: Record<string, any>) => succeed(options),
	createBLEConnection: () => signalCreateConnection(),
	closeBLEConnection: (options: Record<string, any>) => succeed(options),
}

async function main() {
	const transport = createUniBleBmsTransport({})
	const connectTask = transport.connect({ deviceId: 'AA:BB:CC:DD:EE:FF' })
	await createConnectionCalled

	const startedAt = Date.now()
	await transport.disconnect()
	let connectRejected = false
	try {
		await connectTask
	} catch (error) {
		connectRejected = true
	}

	assert(connectRejected, 'disconnect should cancel a pending BLE connection')
	assert(Date.now() - startedAt < 500, 'pending connection cancellation should not wait for the native timeout')
	assert(typeof notifyListener === 'function', 'transport init should preserve the notification listener setup')

	const lease = await acquireBleDiscoveryLease('connect-cancel-test')
	lease.release()

	console.log('BLE transport connect cancellation tests passed')
}

void main()
