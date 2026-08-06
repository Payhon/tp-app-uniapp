import { buildBootFrame } from './boot-frame'
import { bootOtaUpgrade } from './boot-ota'
import {
	MOBILE_BOOT_FINALIZE_DELAY_MS,
	MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
	MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS,
} from './boot-ota-runtime-options'
import type { BmsRequestOptions, BmsRequestTransport } from './types'

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message)
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildResponse(frame: Uint8Array, payload: Uint8Array): Uint8Array {
	return buildBootFrame({
		sourceAddress: frame[2] & 0xff,
		targetAddress: frame[1] & 0xff,
		command: frame[3] & 0xff,
		payload,
	})
}

const txTimes = new Map<number, number[]>()
let prepareAckAt = 0
let finalPacketAckAt = 0

const transport: BmsRequestTransport = {
	request(frame: Uint8Array, _options?: BmsRequestOptions): Uint8Array {
		const command = frame[3] & 0xff
		const times = txTimes.get(command) || []
		times.push(Date.now())
		txTimes.set(command, times)

		let payload = new Uint8Array(0)
		if (command === 0x52) {
			payload = Uint8Array.from([0, 0])
			prepareAckAt = Date.now()
		} else if (command === 0x53) {
			const sequence = ((frame[6] & 0xff) << 8) | (frame[7] & 0xff)
			payload = Uint8Array.from([0, ((sequence + 1) >> 8) & 0xff, (sequence + 1) & 0xff])
			finalPacketAckAt = Date.now()
		} else if (command === 0x54) {
			payload = Uint8Array.from([0])
		}

		return buildBootFrame({
			sourceAddress: frame[2] & 0xff,
			targetAddress: frame[1] & 0xff,
			command,
			payload,
		})
	},
}

async function run(): Promise<void> {
	await bootOtaUpgrade({
		transport,
		firmware: Uint8Array.from([0x01]),
		targetAddress: 0x01,
		skipEnterBoot: true,
		finalizeDelayMs: MOBILE_BOOT_FINALIZE_DELAY_MS,
		finalizeTimeoutMs: MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
		finalizeMaxAttempts: 1,
		requireFinalPacketAck: true,
	})

	const firstDataTxAt = txTimes.get(0x53)?.[0] || 0
	const finalizeTxAt = txTimes.get(0x54)?.[0] || 0
	const prepareToDataMs = firstDataTxAt - prepareAckAt
	const dataToFinalizeMs = finalizeTxAt - finalPacketAckAt

	assert(prepareAckAt > 0 && firstDataTxAt > 0, '0x52 ACK and first 0x53 TX must both be recorded')
	assert(
		prepareToDataMs >= MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS - 20 && prepareToDataMs <= 700,
		`0x52 ACK to first 0x53 must stay within the 300-700ms window, got ${prepareToDataMs}ms`
	)
	assert(finalPacketAckAt > 0 && finalizeTxAt > 0, 'final 0x53 ACK and 0x54 TX must both be recorded')
	assert(
		dataToFinalizeMs >= MOBILE_BOOT_FINALIZE_DELAY_MS - 20 && dataToFinalizeMs <= 700,
		`final 0x53 ACK to 0x54 must stay within the 300-700ms window, got ${dataToFinalizeMs}ms`
	)

	let prepareCount = 0
	let dataCount = 0
	let reprepareAckAt = 0
	let retriedDataTxAt = 0
	const reprepareTransport: BmsRequestTransport = {
		request(frame: Uint8Array): Uint8Array {
			const command = frame[3] & 0xff
			let payload = new Uint8Array(0)
			if (command === 0x52) {
				prepareCount += 1
				payload = Uint8Array.from([0, 0])
				if (prepareCount === 2) reprepareAckAt = Date.now()
			} else if (command === 0x53) {
				dataCount += 1
				if (dataCount === 1) {
					payload = Uint8Array.from([1, 0, 0])
				} else {
					retriedDataTxAt = Date.now()
					payload = Uint8Array.from([0, 0, 1])
				}
			} else if (command === 0x54) {
				payload = Uint8Array.from([0])
			}
			return buildBootFrame({
				sourceAddress: frame[2] & 0xff,
				targetAddress: frame[1] & 0xff,
				command,
				payload,
			})
		},
	}

	await bootOtaUpgrade({
		transport: reprepareTransport,
		firmware: Uint8Array.from([0x01]),
		targetAddress: 0x01,
		skipEnterBoot: true,
		finalizeDelayMs: MOBILE_BOOT_FINALIZE_DELAY_MS,
		finalizeTimeoutMs: MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
		finalizeMaxAttempts: 1,
		requireFinalPacketAck: true,
	})

	const reprepareToDataMs = retriedDataTxAt - reprepareAckAt
	assert(prepareCount === 2 && dataCount === 2, 'status=1 must trigger one reprepare and retry the requested packet')
	assert(
		reprepareToDataMs >= MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS - 20 && reprepareToDataMs <= 700,
		`reprepare 0x52 ACK to retried 0x53 must stay within the 300-700ms window, got ${reprepareToDataMs}ms`
	)

	const scaledBurstIntervalsMs = [10, 20, 30, 40, 50, 60, 70]
	const runFinalizeScenario = async ({
		status,
		responseDelayMs,
	}: {
		status?: number
		responseDelayMs?: number
	}): Promise<{ finalizeRequestCount: number; finalizeWriteCount: number; error: Error | null }> => {
		let finalizeRequestCount = 0
		let finalizeWriteCount = 0
		const scenarioTransport = {
			request(frame: Uint8Array, options?: BmsRequestOptions): Promise<Uint8Array> | Uint8Array {
				const command = frame[3] & 0xff
				if (command === 0x52) return buildResponse(frame, Uint8Array.from([0, 0]))
				if (command === 0x53) return buildResponse(frame, Uint8Array.from([0, 0, 1]))
				if (command !== 0x54) return buildResponse(frame, new Uint8Array(0))
				finalizeRequestCount += 1
				return new Promise((resolve, reject) => {
					if (responseDelayMs != null && status != null) {
						setTimeout(() => resolve(buildResponse(frame, Uint8Array.from([status]))), responseDelayMs)
						return
					}
					setTimeout(() => reject(new Error('ble request timeout')), options?.timeoutMs ?? 90)
				})
			},
			writeFrame(frame: Uint8Array): void {
				if ((frame[3] & 0xff) === 0x54) finalizeWriteCount += 1
			},
		}

		let error: Error | null = null
		try {
			await bootOtaUpgrade({
				transport: scenarioTransport,
				firmware: Uint8Array.from([0x01]),
				targetAddress: 0x01,
				skipEnterBoot: true,
				finalizeDelayMs: 0,
				finalizeTimeoutMs: 90,
				finalizeMaxAttempts: 1,
				finalizeDisableAlternateWriteRetry: true,
				finalizeBurstIntervalsMs: scaledBurstIntervalsMs,
				requireFinalPacketAck: true,
			})
		} catch (caught) {
			error = caught instanceof Error ? caught : new Error(String(caught))
		}
		await wait(90)
		return { finalizeRequestCount, finalizeWriteCount, error }
	}

	const timeoutScenario = await runFinalizeScenario({})
	assert(timeoutScenario.error?.message === 'Boot finalize timeout', 'missing 0x54 ACK must end as finalize timeout')
	assert(timeoutScenario.finalizeRequestCount === 1, '0x54 timeout must not start a second finalize request window')
	assert(
		timeoutScenario.finalizeRequestCount + timeoutScenario.finalizeWriteCount === 8,
		'initial 0x54 plus seven scheduled resends must total eight sends'
	)

	const successScenario = await runFinalizeScenario({ status: 0, responseDelayMs: 1 })
	assert(successScenario.error === null, '0x54 status=0 must complete OTA successfully')
	assert(
		successScenario.finalizeRequestCount === 1 && successScenario.finalizeWriteCount === 0,
		'early valid 0x54 ACK must cancel all remaining scheduled sends'
	)

	const rejectedScenario = await runFinalizeScenario({ status: 2, responseDelayMs: 1 })
	assert(rejectedScenario.error?.message === 'Boot finalize failed: status=2', 'nonzero 0x54 status must fail immediately')
	assert(
		rejectedScenario.finalizeRequestCount === 1 && rejectedScenario.finalizeWriteCount === 0,
		'nonzero 0x54 status must cancel all remaining scheduled sends'
	)

	console.log('boot OTA timing tests passed')
}

void run()
