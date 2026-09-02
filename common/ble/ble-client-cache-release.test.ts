import {
	adoptBleClientConnection,
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

	console.log('BLE client cache release tests passed')
}

void main()
