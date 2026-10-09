// Run: pnpm dlx tsx common/ble/ble-time-sync.test.ts
import { BmsClient } from '../lib/bms-protocol/client'
import { crc16Modbus } from '../lib/bms-protocol/crc16modbus'
import { createUniBleBmsTransport, UniBleBmsTransport } from '../lib/bms-protocol/uni-ble-transport'
import type { BmsRequestOptions } from '../lib/bms-protocol/types'
import { adoptBleClientConnection, connectBleClient, disconnectBleClient } from './ble-client-cache'
import { syncBleBmsTimeOnce } from './ble-time-sync'

function assert(value: unknown, message: string): asserts value {
	if (!value) throw new Error(message)
}

function reply(request: Uint8Array, error = false): Uint8Array {
	const body = error ? [request[4] | 0x80, 2]
		: request[4] === 0x10 ? [...request.slice(4, 9)] : [request[4], 2, 0x12, 0x34]
	const bytes = [0x7f, 0x55, request[3], request[2], ...body]
	const crc = crc16Modbus(bytes.slice(3))
	return Uint8Array.from([...bytes, crc & 0xff, crc >>> 8, 0xfd])
}

function captureClient() {
	const requests: { frame: Uint8Array; options?: BmsRequestOptions }[] = []
	const client = new BmsClient({ transport: { request(frame, options) {
		requests.push({ frame, options })
		return reply(frame)
	} } })
	return { client, requests }
}

async function main() {
	const { client, requests } = captureClient()
	await client.syncTime(1760674088, { timeoutMs: 123, writeApiTimeoutMs: 234, disableAlternateWriteRetry: true })
	const hex = [...requests[0].frame].map(n => n.toString(16).padStart(2, '0')).join(' ').toUpperCase()
	assert(hex === '7F 55 FE 01 10 05 7C 00 02 04 68 F1 C1 28 D7 93 FD', 'sample frame and CRC')
	assert(requests[0].options?.timeoutMs === 123 && requests[0].options?.writeApiTimeoutMs === 234 && requests[0].options?.disableAlternateWriteRetry === true, 'request options forwarded')
	for (const timestamp of [0, 0x80000000, 0xffffffff]) {
		await client.syncTime(timestamp)
		const frame = requests[requests.length - 1].frame
		assert(new DataView(frame.buffer, frame.byteOffset).getUint32(10) === timestamp, 'uint32 big endian boundary')
	}
	for (const timestamp of [-1, 1.5, NaN, Infinity, 0x100000000]) {
		const count = requests.length
		assert(await client.syncTime(timestamp).then(() => false, () => true), 'invalid timestamp rejected')
		assert(requests.length === count, 'invalid timestamp never sent')
	}
	const originalNow = Date.now
	Date.now = () => 1760674088999
	try {
		await client.syncTime()
		assert(new DataView(requests[requests.length - 1].frame.buffer).getUint32(10) === 1760674088, 'current Unix seconds without timezone shift')
	} finally { Date.now = originalNow }
	await client.writeRegisters(0x500, new Uint16Array([1]))
	assert(requests[requests.length - 1].options?.timeoutMs === undefined && requests[requests.length - 1].options?.disableAlternateWriteRetry === undefined, 'other writes keep transport defaults')

	for (const [mac, kind] of [
		['AA0011223344', 1], ['BB0011223344', 1], ['AC0011223344', 2], ['AC0011223344', 3],
		['AC0011223344', undefined], ['AC0011223344', null], ['AC0011223344', 0], ['AC', 1], [null, 1],
	] as const) {
		const skipped = captureClient()
		await syncBleBmsTimeOnce(skipped.client, mac, kind)
		assert(skipped.requests.length === 0, `ineligible ${mac}/${kind}`)
	}
	const eligible = captureClient()
	await syncBleBmsTimeOnce(eligible.client, 'AC0011223344', null)
	const first = syncBleBmsTimeOnce(eligible.client, 'ac:00:11:22:33:44', 1)
	assert(first === syncBleBmsTimeOnce(eligible.client, 'AC0011223344', 1), 'concurrent callers share promise')
	await first
	await syncBleBmsTimeOnce(eligible.client, 'AC0011223344', 1)
	assert(eligible.requests.length === 1, 'unknown can become eligible; reuse never duplicates')
	const options = eligible.requests[0].options
	assert(options?.timeoutMs === 3000 && options?.writeApiTimeoutMs === 3000 && options?.disableAlternateWriteRetry === true, 'automatic sync has bounded timeouts and no fallback retry')

	const fakeTransport = { disconnect: async () => {} } as ReturnType<typeof createUniBleBmsTransport>
	await adoptBleClientConnection({ mac: 'AC0011223344', deviceId: 'native', client: eligible.client, transport: fakeTransport })
	await connectBleClient({ mac: 'AC0011223344', bmsCommType: 1 })
	assert(eligible.requests.length === 1, 'provision handoff to cache does not resend')
	await disconnectBleClient('AC0011223344')
	const reconnected = captureClient()
	await adoptBleClientConnection({ mac: 'AC0011223344', deviceId: 'native', client: reconnected.client, transport: fakeTransport })
	await Promise.all([connectBleClient({ mac: 'AC0011223344', bmsCommType: 1 }), connectBleClient({ mac: 'AC0011223344', bmsCommType: 1 })])
	assert(reconnected.requests.length === 1, 'new client after physical reconnect syncs once')
	await disconnectBleClient('AC0011223344')
	for (const connectionMac of ['AA0011223344', null]) {
		const throughMeter = captureClient()
		await adoptBleClientConnection({ mac: 'AC0011223344', connectionMac, deviceId: 'ios-uuid', client: throughMeter.client, transport: fakeTransport })
		await connectBleClient({ mac: 'AC0011223344', bmsCommType: 1 })
		assert(throughMeter.requests.length === 0, 'identity MAC cannot replace actual connection MAC')
		await disconnectBleClient('AC0011223344')
	}
	// Run the real connection/cache orchestration, replacing only native transport operations.
	const originalConnect = UniBleBmsTransport.prototype.connect
	const originalRequest = UniBleBmsTransport.prototype.request
	const originalDisconnect = UniBleBmsTransport.prototype.disconnect
	let connects = 0
	let syncs = 0
	let cancelled = false
	let cancelDuringSync = false
	let finishSync: (() => void) | undefined
	UniBleBmsTransport.prototype.connect = async function ({ deviceId }) { connects++; this.deviceId = deviceId }
	UniBleBmsTransport.prototype.disconnect = async function () { this.deviceId = null }
	UniBleBmsTransport.prototype.request = async function (input) {
		const frame = Uint8Array.from(input)
		if (frame[4] === 0x10) {
			syncs++
			if (cancelDuringSync) cancelled = true
			else await new Promise<void>(resolve => { finishSync = resolve })
		}
		return reply(frame)
	}
	;(globalThis as any).uni = { getSystemInfoSync: () => ({ platform: 'android' }) }
	try {
		let returned = false
		const opening = connectBleClient({ mac: 'AC0011223344', bmsCommType: 1 }).then(entry => { returned = true; return entry })
		const sharing = connectBleClient({ mac: 'AC0011223344', bmsCommType: 1 })
		for (let i = 0; !finishSync && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 1))
		assert(finishSync && !returned, 'new connection waits for sync before returning to normal reads')
		finishSync()
		const [firstEntry, sharedEntry] = await Promise.all([opening, sharing])
		assert(firstEntry && firstEntry === sharedEntry && connects === 1 && syncs === 1, 'concurrent new connections share one sync')
		await disconnectBleClient('AC0011223344')
		const unknown = await connectBleClient({ mac: 'AC0011223344' })
		assert(unknown && Number(connects) === 2 && syncs === 1, 'new connection with unknown type skips sync')
		const confirming = connectBleClient({ mac: 'AC0011223344', bmsCommType: 1 })
		await Promise.resolve()
		await Promise.resolve()
		finishSync()
		assert(await confirming === unknown && Number(syncs) === 2, 'cached unknown type syncs after confirmed pure BLE')
		await disconnectBleClient('AC0011223344')
		cancelDuringSync = true
		const aborted = await connectBleClient({ mac: 'AC0011223344', bmsCommType: 1, isCancelled: () => cancelled })
		assert(aborted === null && Number(syncs) === 3, 'cancellation during sync prevents returning stale connection')
	} finally {
		UniBleBmsTransport.prototype.connect = originalConnect
		UniBleBmsTransport.prototype.request = originalRequest
		UniBleBmsTransport.prototype.disconnect = originalDisconnect
	}

	// Actual iOS request queue: timeout/rejection must not cause a second write or poison subsequent reads.
	for (const failure of ['timeout', 'reject', 'disconnect'] as const) {
		const transport = createUniBleBmsTransport({ minFrameIntervalMs: 0, logger: {} })
		Object.assign(transport, { deviceId: 'AC:00:11:22:33:44', serviceId: 'service', writeCharId: 'write', notifyCharId: 'notify', writeChunkSize: 185,
			_connected: true, _platform: 'ios', _writeSupportsResponse: true, _writeSupportsNoResponse: true })
		let writes = 0
		let closing: Promise<void> | undefined
		;(globalThis as any).uni = {
			closeBLEConnection: (opts: { success: () => void }) => opts.success(),
			writeBLECharacteristicValue: (opts: { value: ArrayBuffer; success: () => void }) => {
				const frame = new Uint8Array(opts.value)
				if (frame[4] === 0x10) writes++
				opts.success()
				if (frame[4] !== 0x10 || failure === 'reject') {
					queueMicrotask(() => transport._onNotify(reply(frame, frame[4] === 0x10).buffer as ArrayBuffer))
				} else if (failure === 'disconnect') {
					queueMicrotask(() => { closing = transport.disconnect() })
				}
			},
		}
		const nativeClient = new BmsClient({ transport })
		await syncBleBmsTimeOnce(nativeClient, 'AC0011223344', 1)
		await syncBleBmsTimeOnce(nativeClient, 'AC0011223344', 1)
		assert(writes === 1, `${failure}: no iOS fallback or same-connection retry`)
		if (failure === 'disconnect') {
			await closing
			assert(transport.deviceId === null, 'physical disconnect closes transport without unhandled sync rejection')
		} else {
			assert((await nativeClient.readRegisters(0x100, 1))[0] === 0x1234, `${failure}: queue continues reading`)
		}
	}
	console.log('ble-time-sync tests passed')
}

main().catch(error => { console.error(error); throw error })
