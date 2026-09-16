import { buildBootFrame } from './boot-frame'
import { bootOtaUpgrade, resolveBootMaxPacketSizeForMtu } from './boot-ota'
import { BmsProtocolError } from './frame'
import {
	MOBILE_BOOT_FINALIZE_DELAY_MS,
	MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
	MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS,
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
	assert(resolveBootMaxPacketSizeForMtu(512) === 256, 'MTU 512 must fit a single 256-byte OTA data frame')
	assert(resolveBootMaxPacketSizeForMtu(78) === 64, 'MTU 78 must fit the minimum 64-byte OTA data frame')
	assert(resolveBootMaxPacketSizeForMtu(77) === 0, 'MTU below 78 must reject OTA before boot')

	let releaseDataAck!: () => void
	let acknowledgedProgress = 0
	const delayedAck = new Promise<void>((resolve) => {
		releaseDataAck = resolve
	})
	const delayedAckTransport: BmsRequestTransport = {
		async request(frame: Uint8Array): Promise<Uint8Array> {
			const command = frame[3] & 0xff
			if (command === 0x52) return buildResponse(frame, Uint8Array.from([0, 0]))
			if (command === 0x53) {
				await delayedAck
				return buildResponse(frame, Uint8Array.from([0, 0, 1]))
			}
			return buildResponse(frame, Uint8Array.from([0]))
		},
	}
	const delayedUpgrade = bootOtaUpgrade({
		transport: delayedAckTransport,
		firmware: Uint8Array.from([0x01]),
		targetAddress: 0x01,
		skipEnterBoot: true,
		finalizeDelayMs: 0,
		finalizeTimeoutMs: MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
		finalizeMaxAttempts: 1,
		requireFinalPacketAck: true,
		onProgress: (progress) => {
			if (progress.stage === 'transfer') acknowledgedProgress += 1
		},
	})
	await wait(MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS + 20)
	assert(acknowledgedProgress === 0, 'transfer progress must not advance before the 0x53 ACK')
	releaseDataAck()
	await delayedUpgrade
	assert(Number(acknowledgedProgress) === 1, 'transfer progress must advance after the valid 0x53 ACK')

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
		prepareToDataMs >= 0 && prepareToDataMs < 100,
		`0x52 ACK must immediately start the first 0x53, got ${prepareToDataMs}ms`
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
		reprepareToDataMs >= 0 && reprepareToDataMs < 100,
		`reprepare 0x52 ACK must immediately restart 0x53, got ${reprepareToDataMs}ms`
	)

	const runFinalizeScenario = async ({
		status,
		responseDelayMs,
		disconnectKind,
		allowPostFinalizeBleDisconnectSuccess = false,
	}: {
		status?: number
		responseDelayMs?: number
		disconnectKind?: 'preflight' | 'submitted'
		allowPostFinalizeBleDisconnectSuccess?: boolean
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
				if (disconnectKind === 'preflight') return Promise.reject(new Error('BLE is not connected'))
				if (disconnectKind === 'submitted') {
					return Promise.reject(new BmsProtocolError('BLE connection disconnected after Boot frame submission', {
						bootFrameSubmitted: true,
						command: 0x54,
					}))
				}
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
			isExplicitDisconnectError(error: unknown): boolean {
				return error instanceof Error && /not connected|connection disconnected/i.test(error.message)
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
				allowPostFinalizeBleDisconnectSuccess,
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
		timeoutScenario.finalizeRequestCount + timeoutScenario.finalizeWriteCount === 1,
		'no scheduled duplicate writes may escape the configured request attempts'
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

	const rejectedDisconnect = await runFinalizeScenario({ disconnectKind: 'submitted' })
	assert(rejectedDisconnect.error?.message === 'BLE connection disconnected after Boot frame submission', 'a disconnect must fail unless the caller explicitly allows it')
	assert(rejectedDisconnect.finalizeRequestCount === 1, 'the explicit disconnect must occur after one real 0x54 send')
	const preflightDisconnect = await runFinalizeScenario({
		disconnectKind: 'preflight',
		allowPostFinalizeBleDisconnectSuccess: true,
	})
	assert(preflightDisconnect.error?.message === 'BLE is not connected', 'a preflight disconnect without a native 0x54 submission marker must fail')
	const acceptedDisconnect = await runFinalizeScenario({
		disconnectKind: 'submitted',
		allowPostFinalizeBleDisconnectSuccess: true,
	})
	assert(acceptedDisconnect.error === null, 'an explicitly classified BLE disconnect after confirmed data and 0x54 TX may complete OTA')
	assert(
		acceptedDisconnect.finalizeRequestCount === 1 && acceptedDisconnect.finalizeWriteCount === 0,
		'accepted disconnect must cancel the remaining 0x54 burst timers'
	)

	const sequenceScenario = async (
		dataAck: (index: number, call: number) => number[] | Promise<number[]>,
		options: { maxPacketSize?: number; packetOption?: number; firmwareSize?: number; pageBoundaryDelayMs?: number; finalizePayload?: number[] } = {}
	) => {
		const sent: number[] = []
		const confirmed: number[] = []
		const times: number[] = []
		const dataRequestOptions: Array<BmsRequestOptions | undefined> = []
		let finalized = false
		let error: Error | null = null
		try {
			await bootOtaUpgrade({
				transport: {
					async request(frame: Uint8Array, requestOptions?: BmsRequestOptions): Promise<Uint8Array> {
						if (frame[3] === 0x52) return buildResponse(frame, Uint8Array.from([0, options.packetOption ?? 0]))
						if (frame[3] === 0x53) {
							const index = (frame[6] << 8) | frame[7]
							sent.push(index)
							times.push(Date.now())
							dataRequestOptions.push(requestOptions)
							return buildResponse(frame, Uint8Array.from(await dataAck(index, sent.length)))
						}
						if (frame[3] === 0x54) finalized = true
						return buildResponse(frame, Uint8Array.from(options.finalizePayload ?? [0]))
					},
				},
				firmware: new Uint8Array(options.firmwareSize ?? 256), targetAddress: 0x01, skipEnterBoot: true,
				maxPacketSize: options.maxPacketSize, pageBoundaryDelayMs: options.pageBoundaryDelayMs,
				requireFinalPacketAck: true, finalizeMaxAttempts: 1, finalizeDelayMs: 0,
				onProgress: (p) => { if (p.stage === 'transfer') confirmed.push(p.packetIndex!) },
			})
		} catch (caught) { error = caught as Error }
		return { sent, confirmed, times, dataRequestOptions, finalized, error }
	}
	const nextAck = (index: number) => [0, (index + 1) >> 8, (index + 1) & 0xff]
	const stale = await sequenceScenario((index, call) => index === 2 && call === 3 ? [0, 0, 1] : nextAck(index))
	assert(stale.error?.message.startsWith('Boot unexpected packet ACK') && stale.sent.join(',') === '0,1,2', 'an invalid response leaking through a transport must not be mistaken for ACK timeout')
	assert(stale.confirmed.join(',') === '0,1', 'invalid ACK must not advance or duplicate progress')
	const alreadyReceived = await sequenceScenario(index => [3, (index + 1) >> 8, (index + 1) & 0xff])
	assert(alreadyReceived.error === null && alreadyReceived.sent.join(',') === '0,1,2,3', 'status=3 with next cursor must advance, including the terminal cursor')
	assert(alreadyReceived.confirmed.join(',') === '0,1,2,3', 'explicit next cursor confirms progress without replaying the packet')
	const rollback = await sequenceScenario((index, call) => index === 2 && call === 3 ? [3, 0, 1] : nextAck(index))
	assert(rollback.error === null && rollback.sent.join(',') === '0,1,2,1,2,3', 'explicit sequence error must allow bounded rollback')
	const stuck = await sequenceScenario((index) => index === 2 ? [3, 0, 1] : nextAck(index))
	assert(stuck.error !== null && !stuck.finalized && stuck.sent.length <= 14, 'replaying confirmed packets must not reset the recovery budget indefinitely')
	const invalidAck = await sequenceScenario(() => [0, 0xff, 0xff])
	assert(invalidAck.error !== null && invalidAck.confirmed.length === 0 && !invalidAck.finalized, 'out-of-range success ACK must never complete transfer')
	const invalidRecovery = await sequenceScenario(() => [3, 0xff, 0xff])
	assert(invalidRecovery.error !== null && invalidRecovery.sent.length === 1, 'invalid recovery sequence must fail immediately')
	for (const message of ['writeBLECharacteristicValue timeout', 'Socket send timeout', 'BLE is not connected', 'BLE OTA session ended']) {
		const failedWrite = await sequenceScenario(() => { throw new Error(message) })
		assert(failedWrite.error?.message === message && failedWrite.sent.length === 1 && !failedWrite.finalized, 'native write timeout, disconnect and cancel errors must stop immediately')
	}
	let retryInjected = false
	const retrySamePacket = await sequenceScenario((index) => {
		if (index === 1 && !retryInjected) {
			retryInjected = true
			throw new BmsProtocolError('BLE request timeout after 800ms + 0ms grace', {
				bootAckGraceMs: 0,
			})
		}
		return nextAck(index)
	})
	assert(retrySamePacket.error === null && retrySamePacket.sent.join(',') === '0,1,1,2,3', 'an ACK timeout must retry the same sequence before advancing')
	assert(retrySamePacket.confirmed.join(',') === '0,1,2,3', 'a timed-out attempt must not advance confirmed progress')
	assert(
		retrySamePacket.dataRequestOptions.every((value) => value?.bootAckGraceMs === 0),
		'every 0x53 request must disable the old grace window'
	)
	const exhausted = await sequenceScenario((index) => {
		if (index !== 1) return nextAck(index)
		throw new BmsProtocolError('BLE request timeout after 800ms + 0ms grace', {
			bootAckGraceMs: 0,
		})
	})
	assert(exhausted.sent.join(',') === '0,1,1,1,1', 'a packet must use one initial attempt plus at most three retransmits')
	assert(exhausted.error?.message === 'boot_packet_no_ack:1' && !exhausted.finalized, 'exhausted retries must expose the stable packet-index error and never finalize')
	let rollbackStarted = false
	let replayPacketOneTimedOut = false
	const sharedRecoveryBudget = await sequenceScenario((index) => {
		if (index === 2 && !rollbackStarted) {
			rollbackStarted = true
			return [3, 0, 1]
		}
		if (rollbackStarted && index === 1 && !replayPacketOneTimedOut) {
			replayPacketOneTimedOut = true
			throw new BmsProtocolError('BLE request timeout after 800ms + 0ms grace', {
				bootAckGraceMs: 0,
			})
		}
		if (rollbackStarted && index === 2) {
			throw new BmsProtocolError('BLE request timeout after 800ms + 0ms grace', {
				bootAckGraceMs: 0,
			})
		}
		return nextAck(index)
	})
	assert(
		sharedRecoveryBudget.sent.join(',') === '0,1,2,1,1,2,2' && sharedRecoveryBudget.error?.message === 'boot_packet_no_ack:2',
		'timeout and sequence rollback must share one three-event budget until requested passes the historical high-water mark'
	)
	let reprepareStarted = false
	const sharedReprepareBudget = await sequenceScenario((index) => {
		if (index === 2 && !reprepareStarted) {
			reprepareStarted = true
			return [1, 0, 0]
		}
		if (reprepareStarted && index === 2) {
			throw new BmsProtocolError('BLE request timeout after 800ms + 0ms grace', {
				bootAckGraceMs: 0,
			})
		}
		return nextAck(index)
	})
	assert(
		sharedReprepareBudget.sent.join(',') === '0,1,2,0,1,2,2,2' && sharedReprepareBudget.error?.message === 'boot_packet_no_ack:2',
		'timeout and status=1 reprepare must share one three-event budget until requested passes the historical high-water mark'
	)
	let mqttTimeoutInjected = false
	const mqttRetry = await sequenceScenario(async (index) => {
		if (!mqttTimeoutInjected) {
			mqttTimeoutInjected = true
			await wait(800)
			throw new BmsProtocolError('MQTT request timeout after 800ms')
		}
		return nextAck(index)
	}, { firmwareSize: 1 })
	const mqttRetryDelay = mqttRetry.times[1] - mqttRetry.times[0]
	assert(mqttRetry.sent.join(',') === '0,0' && mqttRetry.error === null, 'MQTT ACK timeout must also retry the same packet')
	assert(mqttRetryDelay >= 780 && mqttRetryDelay < 1000, `800ms timeout must retry immediately without grace, got ${mqttRetryDelay}ms`)
	const capacityMismatch = await sequenceScenario(nextAck, { packetOption: 2, maxPacketSize: 64 })
	assert(capacityMismatch.error?.message.startsWith('boot_ble_frame_exceeds_mtu') && capacityMismatch.sent.length === 0, 'device packet size must not be silently reduced to fit local MTU')
	const invalidSize = await sequenceScenario(nextAck, { packetOption: 9 })
	assert(invalidSize.error !== null && invalidSize.sent.length === 0, 'unknown packet size option must not fall back to 64 bytes')
	for (const [packetOption, packetSize] of [64, 128, 256, 512, 1024].entries()) {
		const pageStartIndex = 4096 / packetSize
		const pageBoundary = await sequenceScenario(nextAck, {
			packetOption,
			firmwareSize: 4096 + packetSize,
		})
		const delayMs = pageBoundary.times[pageStartIndex] - pageBoundary.times[pageStartIndex - 1]
		assert(
			pageBoundary.error === null && delayMs >= MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS - 20 && delayMs < 700,
			`${packetSize}-byte packets must wait 300ms before the first packet across a confirmed 4KB boundary`
		)
	}
	let boundaryTimeoutInjected = false
	const boundary = await sequenceScenario((index) => {
		if (index === 64 && !boundaryTimeoutInjected) {
			boundaryTimeoutInjected = true
			throw new BmsProtocolError('BLE request timeout after 800ms + 0ms grace', {
				bootAckGraceMs: 0,
			})
		}
		return nextAck(index)
	}, { firmwareSize: 4160 })
	const boundaryDelay = boundary.times[64] - boundary.times[63]
	const boundaryRetryDelay = boundary.times[65] - boundary.times[64]
	assert(boundary.error === null && boundaryDelay >= MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS - 20 && boundaryDelay < 700, 'a confirmed 4KB boundary must wait 300ms before its first send')
	assert(boundary.sent.slice(-2).join(',') === '64,64' && boundaryRetryDelay < 100, 'same-packet timeout retry must not repeat the 4KB boundary wait')
	let boundaryRollbackInjected = false
	const boundaryRollback = await sequenceScenario((index) => {
		if (index === 64 && !boundaryRollbackInjected) {
			boundaryRollbackInjected = true
			return [3, 0, 63]
		}
		return nextAck(index)
	}, { firmwareSize: 4160 })
	const recrossDelay = boundaryRollback.times[66] - boundaryRollback.times[65]
	assert(
		boundaryRollback.error === null && boundaryRollback.sent.slice(-3).join(',') === '64,63,64' &&
			recrossDelay >= MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS - 20 && recrossDelay < 700,
		'device rollback must apply the 300ms guard again when crossing the same 4KB boundary'
	)
	const emptyFinish = await sequenceScenario(nextAck, { finalizePayload: [] })
	assert(emptyFinish.error?.message === 'Boot finalize failed: invalid response', 'empty 0x54 payload must not be interpreted as status=0')

	console.log('boot OTA timing tests passed')
}

void run()
