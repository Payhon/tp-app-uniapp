import { acquireBleDiscoveryLease, getActiveBleDiscoveryOwner } from './ble-discovery-coordinator'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

async function run() {
	const first = await acquireBleDiscoveryLease('first')
	assert(getActiveBleDiscoveryOwner() === 'first', 'first owner should hold the discovery lease')

	let secondAcquired = false
	const secondPromise = acquireBleDiscoveryLease('second').then((lease) => {
		secondAcquired = true
		return lease
	})

	await Promise.resolve()
	assert(!secondAcquired, 'second owner must wait while the first lease is active')

	first.release()
	first.release()
	const second = await secondPromise
	assert(secondAcquired, 'second owner should acquire after the first lease is released')
	assert(getActiveBleDiscoveryOwner() === 'second', 'second owner should become active')

	second.release()
	assert(getActiveBleDiscoveryOwner() === null, 'no owner should remain after release')

	console.log('BLE discovery coordinator tests passed')
}

void run()
