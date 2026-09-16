import { bootOtaUpgrade, bootQueryVersion } from './boot-ota'
import { buildBootFrame } from './boot-frame'
import { BmsProtocolError } from './frame'
import type { BmsRequestOptions } from './types'

function assert(value: unknown, message: string): asserts value {
	if (!value) throw new Error(message)
}

// 可控时钟：真实执行状态机与超时Promise，不等待真机时长。
async function withClock(run: () => Promise<void>) {
	const original = { now: Date.now, set: globalThis.setTimeout, clear: globalThis.clearTimeout }
	let now = 0
	let id = 0
	const timers = new Map<number, { at: number; callback: () => void }>()
	Date.now = () => now
	globalThis.setTimeout = ((callback: () => void, delay = 0) => {
		timers.set(++id, { at: now + delay, callback })
		return id
	}) as typeof setTimeout
	globalThis.clearTimeout = ((key: number) => { timers.delete(key) }) as typeof clearTimeout
	let done = false
	let failure: unknown
	try {
		void run().then(() => { done = true }, (error) => { failure = error; done = true })
		for (let step = 0; step < 100000 && !done; step += 1) {
			for (let microtask = 0; microtask < 100; microtask += 1) await Promise.resolve()
			if (done) break
			const next = [...timers].sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0]
			if (next) {
				now = next[1].at
				timers.delete(next[0])
				next[1].callback()
			}
		}
		assert(done, 'test must settle without hanging')
		if (failure) throw failure
		assert(timers.size === 0, 'completion must leave no resend/ACK timers')
	} finally {
		Date.now = original.now
		globalThis.setTimeout = original.set
		globalThis.clearTimeout = original.clear
	}
}

type Tx = { cmd: number; seq: number; at: number; timeout: number; grace: number }
async function scenario(command: number, lost: number, ackDelay = 0, error?: string, dataSequence = 0) {
	const sent: Tx[] = []
	const progress: number[] = []
	let matched = 0
	const transport = {
		request(frame: Uint8Array, options: BmsRequestOptions = {}): Promise<Uint8Array> {
			const cmd = frame[3]
			const seq = cmd === 0x53 ? (frame[6] << 8) | frame[7] : -1
			const timeout = options.timeoutMs ?? -1
			sent.push({ cmd, seq, at: Date.now(), timeout, grace: options.bootAckGraceMs ?? 0 })
			const selected = cmd === command && (cmd !== 0x53 || seq === dataSequence)
			if (selected && error) return Promise.reject(new Error(error))
			const attempt = selected ? matched++ : 0
			let payload: number[] = [0]
			if (cmd === 0x52) payload = [0, 0]
			if (cmd === 0x53) payload = [attempt > 0 ? 3 : 0, (seq + 1) >> 8, (seq + 1) & 0xff]
			return new Promise((resolve, reject) => {
				let ackTimer: ReturnType<typeof setTimeout> | undefined
				const timeoutTimer = setTimeout(() => {
					clearTimeout(ackTimer)
					reject(new BmsProtocolError(`BLE request timeout after ${timeout}ms`))
				}, timeout)
				if (selected && attempt < lost) return
				ackTimer = setTimeout(() => {
					clearTimeout(timeoutTimer)
					resolve(buildBootFrame({ sourceAddress: frame[2], targetAddress: frame[1], command: cmd, payload }))
				}, selected ? ackDelay : 0)
			})
		},
	}
	let failure: unknown
	try {
		await bootOtaUpgrade({
			transport, targetAddress: 1, firmware: new Uint8Array((dataSequence + 1) * 64),
			enterBootTimeoutAsSuccess: true, requireFinalPacketAck: true,
			onProgress: (p) => { if (p.stage === 'transfer') progress.push(p.packetIndex ?? -1) },
		})
	} catch (error) { failure = error }
	return { sent, progress, failure, end: Date.now(), attempts: sent.filter((tx) => tx.cmd === command && (command !== 0x53 || tx.seq === dataSequence)) }
}

async function run() {
	for (const command of [0x50, 0x51, 0x52, 0x53, 0x54]) {
		await withClock(async () => {
			const result = await scenario(command, 4)
			const first = command === 0x54 ? 5000 : 800
			assert(result.attempts.map((tx) => tx.timeout).join() === `${first},450,450,450`, `${command}: initial/retry timeout`)
			const start = result.attempts[0].at
			assert(result.attempts.map((tx) => tx.at - start).join() === `0,${first},${first + 450},${first + 900}`, `${command}: no grace or hidden retries`)
			assert(result.attempts.every((tx) => tx.grace === 0), 'zero grace')
			if (command <= 0x51) assert(!result.failure, 'version/4G enter timeout compatibility must continue after four attempts')
			else {
				assert(result.failure && result.end - start === first + 1350, 'exhaustion must fail at exact deadline')
				if (command !== 0x54) assert(!result.sent.some((tx) => tx.cmd === 0x54), 'unconfirmed data cannot finalize')
			}
		})
		for (const lost of [0, 1, 3]) await withClock(async () => {
			const delay = lost > 0 ? 449 : command === 0x54 ? 4999 : 799
			const result = await scenario(command, lost, delay)
			assert(!result.failure && result.attempts.length === lost + 1, 'ACK before deadline must stop retries')
			assert(result.progress.length === 1, 'only acknowledged packet advances progress, including status=3')
		})
		for (const error of ['writeBLECharacteristicValue timeout', 'Socket send timeout', 'BLE is not connected', 'BLE OTA session ended']) {
			await withClock(async () => {
				const result = await scenario(command, 0, 0, error)
				assert(result.failure instanceof Error && result.failure.message === error && result.attempts.length === 1, 'non-ACK errors must fail without retry or query compatibility')
			})
		}
	}
	await withClock(async () => {
		const result = await scenario(0x53, 1, 0, undefined, 1152)
		const lastPageAck = result.sent.find((tx) => tx.cmd === 0x53 && tx.seq === 1151)!
		assert(!result.failure && result.attempts[0].at - lastPageAck.at === 300, '1151 ACK must protect next flash page')
		assert(result.attempts[1].seq === 1152 && result.attempts[1].at - result.attempts[0].at === 800, 'lost page-first ACK retries 1152, no extra page delay')
	})
	await withClock(async () => {
		const prepares: number[] = []
		let packets = 0
		await bootOtaUpgrade({
			targetAddress: 1, firmware: new Uint8Array(64), skipEnterBoot: true,
			transport: { request: (frame, options) => {
				let payload = [0]
				if (frame[3] === 0x52) {
					prepares.push(options?.timeoutMs ?? -1)
					if (prepares.length >= 2 && prepares.length <= 4) {
						return new Promise<Uint8Array>((_resolve, reject) => setTimeout(
							() => reject(new Error('Socket request timeout')), options?.timeoutMs
						))
					}
					payload = [0, 0]
				}
				if (frame[3] === 0x53) payload = packets++ === 0 ? [1, 0, 0] : [0, 0, 1]
				return buildBootFrame({ sourceAddress: frame[2], targetAddress: frame[1], command: frame[3], payload })
			} },
		})
		assert(prepares.join() === '800,800,450,450,450' && packets === 2, 'status=1 reprepare must use the same bounded control retries, without extra data sends')
	})
	let optionsSeen: BmsRequestOptions | undefined
	await bootQueryVersion({ targetAddress: 0xfc, transport: { request: (frame, options) => {
		optionsSeen = options
		return buildBootFrame({ sourceAddress: frame[2], targetAddress: frame[1], command: 0x50 })
	} } })
	assert(optionsSeen?.timeoutMs === undefined, 'standalone post-OTA version query must retain caller timeout')
	console.log('boot OTA dynamic timeout tests passed')
}
void run()
