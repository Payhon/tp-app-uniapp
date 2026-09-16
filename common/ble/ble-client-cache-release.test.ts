import {
	adoptBleClientConnection,
	closeBleClientEntry,
	connectBleClient,
	disconnectBleClient,
	getBleClientEntry,
	releaseBleClient,
	releaseBleClientAndDisconnectIfIdle,
	retainBleClient,
} from './ble-client-cache'
import { acquireBleDiscoveryLease } from './ble-discovery-coordinator'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

function createFakeConnection() {
	let disconnectCalls = 0
	return {
		client: {} as any,
		transport: {
			async disconnect() {
				disconnectCalls += 1
			},
		} as any,
		getDisconnectCalls: () => disconnectCalls,
	}
}

async function main() {
	const defaultConnection = createFakeConnection()
	await adoptBleClientConnection({
		mac: 'AC0011223344',
		deviceId: 'default-device',
		client: defaultConnection.client,
		transport: defaultConnection.transport,
	})
	retainBleClient('AC0011223344')
	releaseBleClient('AC0011223344')
	assert(!!getBleClientEntry('AC0011223344'), 'default release should preserve the cached warm connection')
	assert(defaultConnection.getDisconnectCalls() === 0, 'default release must not disconnect immediately')
	await disconnectBleClient('AC0011223344')

	const discoveryConnection = createFakeConnection()
	await adoptBleClientConnection({
		mac: 'AC5566778899',
		deviceId: 'discovery-device',
		client: discoveryConnection.client,
		transport: discoveryConnection.transport,
	})
	retainBleClient('AC5566778899')
	retainBleClient('AC5566778899')

	const sharedRelease = await releaseBleClientAndDisconnectIfIdle('AC5566778899')
	assert(!sharedRelease, 'discovery release must preserve a connection that still has another owner')
	assert(discoveryConnection.getDisconnectCalls() === 0, 'shared connection must remain connected')

	const blockingLease = await acquireBleDiscoveryLease('cache-release-test:blocker')
	const finalReleasePromise = releaseBleClientAndDisconnectIfIdle('AC5566778899')
	await Promise.resolve()
	assert(discoveryConnection.getDisconnectCalls() === 0, 'disconnect must wait behind the active discovery lease')
	blockingLease.release()

	const finalRelease = await finalReleasePromise
	assert(finalRelease, 'last discovery owner release should disconnect the BLE transport')
	assert(discoveryConnection.getDisconnectCalls() === 1, 'idle discovery connection should disconnect exactly once')
	assert(!getBleClientEntry('AC5566778899'), 'disconnected discovery entry should be removed from cache')
	const reacquired = createFakeConnection()
	await adoptBleClientConnection({ mac: 'AC1111111111', deviceId: 'reacquired', ...reacquired })
	retainBleClient('AC1111111111')
	const heldLease = await acquireBleDiscoveryLease('cache-release-test:retain-race')
	const releasing = releaseBleClientAndDisconnectIfIdle('AC1111111111')
	retainBleClient('AC1111111111')
	heldLease.release()
	assert(!(await releasing), 'new owner acquired during lease wait must keep the connection')
	assert(reacquired.getDisconnectCalls() === 0, 'lease-delayed release must recheck ref count')
	await disconnectBleClient('AC1111111111')

	const hungTransport = {
		disconnect: () => new Promise<void>(() => undefined),
	} as any
	await adoptBleClientConnection({
		mac: 'AC9988776655',
		deviceId: 'hung-disconnect-device',
		client: {} as any,
		transport: hungTransport,
	})
	retainBleClient('AC9988776655')
	const timeoutStartedAt = Date.now()
	const timeoutResult = await releaseBleClientAndDisconnectIfIdle('AC9988776655')
	assert(!timeoutResult, 'missing native disconnect callback should report a best-effort timeout')
	assert(Date.now() - timeoutStartedAt < 2_000, 'missing native callback must not permanently block later scanning')
	const postTimeoutLease = await acquireBleDiscoveryLease('cache-release-test:after-timeout')
	postTimeoutLease.release()
	assert(await connectBleClient({ mac: 'AC9988776655', force: true }) === null, 'same device remains fenced after missing close callback')

	let finishClose!: () => void
	let nativeDisconnect!: () => void
	let closeCount = 0
	const oldTransport = {
		onDisconnect(fn: () => void) { nativeDisconnect = fn; return () => {} },
		disconnect() { closeCount++; return new Promise<void>(resolve => { finishClose = resolve }) },
	} as any
	const oldEntry = await adoptBleClientConnection({ mac: 'AA0000000001', deviceId: 'meter', client: {} as any, transport: oldTransport })
	assert(oldEntry, 'old entry exists')
	retainBleClient(oldEntry.key)
	nativeDisconnect()
	assert(!getBleClientEntry(oldEntry.key), 'native disconnect invalidates cache synchronously')
	const firstClose = closeBleClientEntry(oldEntry, 5)
	const repeatedClose = closeBleClientEntry(oldEntry, 5)
	assert(!(await firstClose) && !(await repeatedClose), 'caller timeout is not close success')
	assert(closeCount === 1, 'duplicate close uses the same native operation')
	const unrelated = createFakeConnection()
	const unrelatedEntry = await adoptBleClientConnection({ mac: 'AC0000000009', deviceId: 'other', ...unrelated })
	assert(unrelatedEntry, 'another device is not blocked by this close')
	await disconnectBleClient(unrelatedEntry.key)
	finishClose()
	await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
	const replacement = createFakeConnection()
	const newEntry = await adoptBleClientConnection({ mac: oldEntry.key, deviceId: 'meter', ...replacement })
	assert(newEntry, 'late successful close releases barrier')
	retainBleClient(newEntry.key)
	nativeDisconnect()
	await closeBleClientEntry(oldEntry)
	assert(getBleClientEntry(oldEntry.key) === newEntry, 'stale listener/cleanup cannot delete new cache entry')
	assert(replacement.getDisconnectCalls() === 0, 'old cleanup cannot close new transport')
	await disconnectBleClient(newEntry.key)

	const failedEntry = await adoptBleClientConnection({ mac: 'AC0000000008', deviceId: 'failure', client: {} as any,
		transport: { disconnect: async () => { throw new Error('native close failed') } } as any })
	assert(failedEntry, 'failed-close entry exists')
	assert(!(await closeBleClientEntry(failedEntry)), 'native failure does not count as close success')
	assert(await connectBleClient({ mac: failedEntry.key, force: true }) === null, 'failed close leaves barrier intact')

	console.log('BLE client cache release tests passed')
}

void main()
