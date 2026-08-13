export type BleDiscoveryLease = {
	id: number
	owner: string
	release: () => void
}

let nextLeaseId = 0
let queueTail: Promise<void> = Promise.resolve()
let activeLease: { id: number; owner: string } | null = null

export async function acquireBleDiscoveryLease(owner: string): Promise<BleDiscoveryLease> {
	const normalizedOwner = String(owner || 'unknown')
	const id = ++nextLeaseId
	let unlock!: () => void
	const gate = new Promise<void>((resolve) => {
		unlock = resolve
	})
	const previous = queueTail.catch(() => undefined)
	queueTail = previous.then(() => gate)

	await previous
	activeLease = { id, owner: normalizedOwner }
	let released = false

	return {
		id,
		owner: normalizedOwner,
		release: () => {
			if (released) return
			released = true
			if (activeLease?.id === id) activeLease = null
			unlock()
		},
	}
}

export function getActiveBleDiscoveryOwner(): string | null {
	return activeLease?.owner ?? null
}
