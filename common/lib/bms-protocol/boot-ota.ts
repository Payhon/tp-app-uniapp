import type { BmsRequestTransport, LoggerLike } from './types'
import { decodeAscii } from './register-view'
import { BOOT_FRAME, buildBootFrame, parseBootFrame } from './boot-frame'
import {
	clampBootPacketDelayMs,
	MOBILE_BOOT_FINALIZE_DELAY_MS,
	MOBILE_BOOT_PACKET_RETRY_DELAY_MS,
	MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS,
	MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS,
	resolveBootPageBoundaryDelayMs,
} from './boot-ota-runtime-options'

export type BootVersionInfo = {
	hardwareId: string | null
	softwareVersion: number | null
}

export type BootOtaProgress = {
	stage: 'query' | 'enter' | 'prepare' | 'transfer' | 'finalize'
	percent?: number
	packetIndex?: number
	packetIndexHex?: string
	expectedAck?: number
	expectedAckHex?: string
	packetTotal?: number
	message?: string
}

export type BootOtaResult = {
	packetSize: number
	packetTotal: number
	crc32: number
	versionInfo: BootVersionInfo | null
}

type BootOtaTransport = BmsRequestTransport & {
	writeFrame?: (frameBytes: Uint8Array, options?: { writeWithResponse?: boolean }) => Promise<void> | void
	requestWithResponse?: BmsRequestTransport['request']
}

const PACKET_SIZE_OPTIONS = [64, 128, 256, 512, 1024]

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function u32ToBytesBE(value: number): Uint8Array {
	return Uint8Array.from([
		(value >>> 24) & 0xff,
		(value >>> 16) & 0xff,
		(value >>> 8) & 0xff,
		value & 0xff,
	])
}

function u16ToBytesBE(value: number): Uint8Array {
	return Uint8Array.from([(value >>> 8) & 0xff, value & 0xff])
}

function bytesToU16BE(hi: number, lo: number): number {
	return ((hi & 0xff) << 8) | (lo & 0xff)
}

function crc32(buffer: Uint8Array): number {
	let crc = 0xffffffff
	for (let i = 0; i < buffer.length; i += 1) {
		crc ^= buffer[i]
		for (let j = 0; j < 8; j += 1) {
			const mask = -(crc & 1)
			crc = (crc >>> 1) ^ (0xedb88320 & mask)
		}
	}
	return (crc ^ 0xffffffff) >>> 0
}

function bytesToHex(bytes: Uint8Array, maxLen = 64): string {
	const len = Math.min(bytes.length, maxLen)
	let out = ''
	for (let i = 0; i < len; i += 1) {
		out += (bytes[i] & 0xff).toString(16).padStart(2, '0')
	}
	if (bytes.length > maxLen) out += '...'
	return out.toUpperCase()
}

function bytesToAscii(bytes: Uint8Array, maxLen = 64): string {
	const len = Math.min(bytes.length, maxLen)
	let out = ''
	for (let i = 0; i < len; i += 1) {
		const ch = bytes[i] & 0xff
		if (ch === 0x00) break
		out += ch >= 0x20 && ch <= 0x7e ? String.fromCharCode(ch) : '.'
	}
	if (bytes.length > maxLen) out += '...'
	return out
}

function cmdHex(cmd: number): string {
	return `0x${(cmd & 0xff).toString(16).padStart(2, '0')}`
}

function seqHex(seq: number): string {
	return `0x${(seq & 0xffff).toString(16).padStart(4, '0').toUpperCase()}`
}

function packetSeqTrace(packetIndex: number): Record<string, unknown> {
	return {
		packetIndex,
		packetIndexHex: seqHex(packetIndex),
		expectedAck: packetIndex + 1,
		expectedAckHex: seqHex(packetIndex + 1),
	}
}

function ackSeqTrace(requested: number): Record<string, unknown> {
	return {
		requested,
		requestedHex: seqHex(requested),
		ackForPacket: requested > 0 ? requested - 1 : undefined,
		ackForPacketHex: requested > 0 ? seqHex(requested - 1) : undefined,
	}
}

function formatErr(err: unknown): string {
	if (!err) return ''
	if (err instanceof Error) return err.message || String(err)
	if (typeof err === 'string') return err
	try {
		return JSON.stringify(err)
	} catch (e) {
		return String(err)
	}
}

function isTimeoutError(err: unknown): boolean {
	return formatErr(err).toLowerCase().includes('timeout')
}

function errorText(err: unknown): string {
	if (!err) return ''
	if (err instanceof Error) return err.message || String(err)
	if (typeof err === 'string') return err
	try {
		const value = err as any
		return String(value?.errMsg || value?.message || JSON.stringify(value) || value)
	} catch (e) {
		return String(err)
	}
}

function errorCode(err: unknown): number | null {
	const value = err as any
	const raw = value?.errCode ?? value?.code ?? value?.errno
	const n = Number(raw)
	return Number.isFinite(n) ? n : null
}

function isBleTerminalWriteError(err: unknown): boolean {
	const code = errorCode(err)
	const msg = errorText(err).toLowerCase()
	return (
		code === 10004 ||
		code === 10006 ||
		code === 1509003 ||
		msg.includes('writevaluetocharacteristics') ||
		msg.includes('writeblecharacteristicvalue:fail') ||
		msg.includes('no connection') ||
		msg.includes('no device') ||
		msg.includes('not connected') ||
		msg.includes('device not found')
	)
}

async function bootRequest(
	transport: BmsRequestTransport,
	frame: Uint8Array,
	{ logger }: { logger?: LoggerLike } = {}
) {
	try {
		logger?.debug && logger.debug('[boot] tx', { cmd: cmdHex(frame[3]), len: frame.length, hex: bytesToHex(frame) })
	} catch (e) {}
	const respBytes = await transport.request(frame)
	try {
		logger?.debug && logger.debug('[boot] rx', { len: respBytes.length, hex: bytesToHex(respBytes) })
	} catch (e) {}
	const resp = parseBootFrame(respBytes)
	if (resp.command !== frame[3]) {
		logger?.warn && logger.warn('[boot] unexpected response cmd', { expect: frame[3], got: resp.command })
	}
	return resp
}

export async function bootQueryVersion({
	transport,
	targetAddress,
	sourceAddress = BOOT_FRAME.HOST_ADDR,
	logger,
}: {
	transport: BmsRequestTransport
	targetAddress: number
	sourceAddress?: number
	logger?: LoggerLike
}): Promise<BootVersionInfo> {
	const req = buildBootFrame({ sourceAddress, targetAddress, command: 0x50 })
	const resp = await bootRequest(transport, req, { logger })
	const data = resp.data
	let hardwareId: string | null = null
	let softwareVersion: number | null = null
	if (data.length >= 33) {
		const hwBytes = data.slice(0, 32)
		hardwareId = decodeAscii(hwBytes).trim() || null
		softwareVersion = data[32] ?? null
	}
	return { hardwareId, softwareVersion }
}

export async function bootOtaUpgrade({
	transport,
	firmware,
	targetAddress,
	queryTargetAddress,
	dataTargetAddress,
	fallbackDataTargetAddress,
	sourceAddress = BOOT_FRAME.HOST_ADDR,
	onProgress,
	logger,
	maxPacketSize,
	skipEnterBoot,
	prepareBaudRate,
	enterBootTimeoutAsSuccess,
	packetDelayMs,
	pageBoundaryDelayMs,
	adaptiveSlowdownOnPacketTimeout,
	adaptivePacketDelayMs,
	adaptivePageBoundaryDelayMs,
	finalizeDelayMs,
	finalizeTimeoutMs,
	finalizeAssumeSuccessOnTimeout,
	finalizeMaxAttempts,
	finalizeDisableAlternateWriteRetry,
	terminalPacketWriteErrorAsComplete,
	requireFinalPacketAck,
	finalizeBurstIntervalsMs,
	tracePacketTiming,
}: {
	transport: BootOtaTransport
	firmware: Uint8Array
	targetAddress: number
	queryTargetAddress?: number
	dataTargetAddress?: number
	fallbackDataTargetAddress?: number
	sourceAddress?: number
	onProgress?: (p: BootOtaProgress) => void
	logger?: LoggerLike
	maxPacketSize?: number
	skipEnterBoot?: boolean
	prepareBaudRate?: number
	enterBootTimeoutAsSuccess?: boolean
	packetDelayMs?: number
	pageBoundaryDelayMs?: number
	adaptiveSlowdownOnPacketTimeout?: boolean
	adaptivePacketDelayMs?: number
	adaptivePageBoundaryDelayMs?: number
	finalizeDelayMs?: number
	finalizeTimeoutMs?: number
	finalizeAssumeSuccessOnTimeout?: boolean
	finalizeMaxAttempts?: number
	finalizeDisableAlternateWriteRetry?: boolean
	terminalPacketWriteErrorAsComplete?: boolean
	requireFinalPacketAck?: boolean
	finalizeBurstIntervalsMs?: number[]
	tracePacketTiming?: boolean
}): Promise<BootOtaResult> {
	if (!firmware || firmware.length === 0) throw new Error('Firmware data is empty')
	const totalSize = firmware.length

	let versionInfo: BootVersionInfo | null = null
	try {
		onProgress?.({ stage: 'query', message: 'query' })
		const queryTarget = queryTargetAddress ?? targetAddress
		try {
			versionInfo = await bootQueryVersion({ transport, targetAddress: queryTarget, sourceAddress, logger })
		} catch (e) {
			// retry once to match double-query behavior
			versionInfo = await bootQueryVersion({ transport, targetAddress: queryTarget, sourceAddress, logger })
		}
		logger?.info && logger.info('[boot] version', versionInfo)
	} catch (e) {
		logger?.warn && logger.warn('[boot] query version failed, continue', e)
	}

	if (!skipEnterBoot) {
		onProgress?.({ stage: 'enter', message: 'enter' })
		try {
			await bootRequest(transport, buildBootFrame({ sourceAddress, targetAddress, command: 0x51 }), { logger })
		} catch (e) {
			if (!enterBootTimeoutAsSuccess || !isTimeoutError(e)) throw e
			logger?.warn && logger.warn('[boot] enter boot timeout, continue', { err: formatErr(e) })
		}
		// Doc suggests waiting 200ms after entering bootloader.
		await sleep(200)
	}

	onProgress?.({ stage: 'prepare', message: 'prepare' })
	const sizePayload = u32ToBytesBE(totalSize >>> 0)
	const baudPayload = u32ToBytesBE((prepareBaudRate ?? 9600) >>> 0)
	const preparePayload = new Uint8Array(8)
	preparePayload.set(sizePayload, 0)
	preparePayload.set(baudPayload, 4)
	const prepareResp = await bootRequest(
		transport,
		buildBootFrame({ sourceAddress, targetAddress, command: 0x52, payload: preparePayload }),
		{ logger }
	)
	const prepareData = prepareResp.data
	if (prepareData.length < 2) throw new Error('Boot prepare response too short')
	if ((prepareData[0] & 0xff) !== 0) throw new Error('Boot prepare failed')
	const optionIdx = prepareData[1] & 0xff
	let packetSize = PACKET_SIZE_OPTIONS[optionIdx] || PACKET_SIZE_OPTIONS[0]
	if (maxPacketSize && packetSize > maxPacketSize) {
		packetSize = PACKET_SIZE_OPTIONS.find((n) => n <= maxPacketSize) || packetSize
	}
	logger?.info && logger.info('[boot] prepare ok', { totalSize, optionIdx, packetSize })
	// Hardware requires the first data packet within 700ms after the prepare ACK.
	await sleep(MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS)

	// Use data length = packetSize, payload = 2 bytes seq + data => payload length = packetSize + 2
	const dataPacketSize = Math.max(1, packetSize)
	const payloadLen = dataPacketSize + 2
	logger?.info && logger.info('[boot] data packet size', { dataPacketSize, packetSize, payloadLen })
	const packetTotal = Math.ceil(totalSize / dataPacketSize)
	if (tracePacketTiming) {
		logger?.info &&
			logger.info('[boot] transfer timing config', {
				totalSize,
				packetTotal,
				dataPacketSize,
				payloadLen,
				packetDelayMs: packetDelayMs ?? 0,
				pageBoundaryDelayMs: pageBoundaryDelayMs ?? 0,
				adaptiveSlowdownOnPacketTimeout: !!adaptiveSlowdownOnPacketTimeout,
				adaptivePacketDelayMs,
				adaptivePageBoundaryDelayMs,
			})
	}
	let packetIndex = 0
	let retry = 0
	const maxRetry = 5
	const maxPacketRetry = 3
	const primaryWriteTarget = dataTargetAddress ?? targetAddress
	const fallbackWriteTarget =
		fallbackDataTargetAddress != null && (fallbackDataTargetAddress & 0xff) !== (primaryWriteTarget & 0xff)
			? (fallbackDataTargetAddress & 0xff)
			: null
	let activeWriteTarget = primaryWriteTarget
	let lastRequested = -1
	let finalizeAttempt = 0
	let lastCrc = 0
	let finalizeAlreadyOk = false
	let currentPacketDelayMs = clampBootPacketDelayMs(packetDelayMs)
	let currentPageBoundaryDelayMs = Math.max(0, pageBoundaryDelayMs ?? 0)

	while (true) {
		while (packetIndex < packetTotal) {
			const start = packetIndex * dataPacketSize
			const end = Math.min(start + dataPacketSize, totalSize)
			const chunk = firmware.slice(start, end)
			const payload = new Uint8Array(2 + chunk.length)
			payload.set(u16ToBytesBE(packetIndex), 0)
			payload.set(chunk, 2)
			if (packetIndex === 0) {
				logger?.info &&
					logger.info('[boot] first packet preview', {
						ascii: bytesToAscii(chunk),
						hex: bytesToHex(chunk),
						size: chunk.length,
					})
			}

			onProgress?.({
				stage: 'transfer',
				...(packetSeqTrace(packetIndex) as {
					packetIndex: number
					packetIndexHex: string
					expectedAck: number
					expectedAckHex: string
				}),
				packetTotal,
				percent: Math.min(99, Math.floor((packetIndex / packetTotal) * 100)),
			})
			if (currentPageBoundaryDelayMs > 0 && packetIndex > 0 && start > 0 && start % 4096 === 0) {
				const effectivePageBoundaryDelayMs = resolveBootPageBoundaryDelayMs(
					currentPacketDelayMs,
					currentPageBoundaryDelayMs
				)
				logger?.info &&
					logger.info('[boot] page boundary delay', {
						...packetSeqTrace(packetIndex),
						offset: start,
						delayMs: effectivePageBoundaryDelayMs,
						configuredDelayMs: currentPageBoundaryDelayMs,
						postAckDelayBudgetMs: currentPacketDelayMs + effectivePageBoundaryDelayMs,
					})
				if (effectivePageBoundaryDelayMs > 0) await sleep(effectivePageBoundaryDelayMs)
			}

			let resp: ReturnType<typeof parseBootFrame> | null = null
			let packetRttMs = 0
			let packetRetry = 0
			let terminalPacketAssumedComplete = false
			while (true) {
				const packetAttemptStartedAt = Date.now()
				try {
					resp = await bootRequest(
						transport,
						buildBootFrame({ sourceAddress, targetAddress: activeWriteTarget, command: 0x53, payload }),
						{ logger }
					)
					packetRttMs = Date.now() - packetAttemptStartedAt
					break
				} catch (e) {
					const elapsedMs = Date.now() - packetAttemptStartedAt
					if (
						terminalPacketWriteErrorAsComplete &&
						packetIndex >= packetTotal - 1 &&
						isBleTerminalWriteError(e)
					) {
						lastRequested = packetTotal
						packetIndex = packetTotal
						terminalPacketAssumedComplete = true
						logger?.warn &&
							logger.warn('[boot] terminal packet write error, continue finalize', {
								...packetSeqTrace(packetTotal - 1),
								packetTotal,
								elapsedMs,
								err: formatErr(e),
							})
						break
					}
					packetRetry += 1
					if (adaptiveSlowdownOnPacketTimeout) {
						const nextPacketDelayMs = clampBootPacketDelayMs(
							Math.max(currentPacketDelayMs, adaptivePacketDelayMs ?? 100)
						)
						const nextPageBoundaryDelayMs = Math.max(currentPageBoundaryDelayMs, adaptivePageBoundaryDelayMs ?? 1500)
						if (nextPacketDelayMs !== currentPacketDelayMs || nextPageBoundaryDelayMs !== currentPageBoundaryDelayMs) {
							currentPacketDelayMs = nextPacketDelayMs
							currentPageBoundaryDelayMs = nextPageBoundaryDelayMs
							logger?.warn &&
								logger.warn('[boot] adaptive slowdown enabled', {
									...packetSeqTrace(packetIndex),
									packetDelayMs: currentPacketDelayMs,
									pageBoundaryDelayMs: currentPageBoundaryDelayMs,
								})
						}
					}
					logger?.warn &&
						logger.warn('[boot] packet timeout, retry', {
							...packetSeqTrace(packetIndex),
							packetRetry,
							attempt: packetRetry,
							maxPacketRetry,
							elapsedMs,
							err: formatErr(e),
						})
					if (packetRetry >= maxPacketRetry) {
						if (fallbackWriteTarget != null && activeWriteTarget !== fallbackWriteTarget) {
							activeWriteTarget = fallbackWriteTarget
							packetRetry = 0
							logger?.warn &&
								logger.warn('[boot] switch data target', {
									...packetSeqTrace(packetIndex),
									target: activeWriteTarget,
								})
							await sleep(MOBILE_BOOT_PACKET_RETRY_DELAY_MS)
							continue
						}
						if (packetIndex === 0) {
							throw new Error('boot_packet0_no_ack')
						}
						throw e
					}
					await sleep(MOBILE_BOOT_PACKET_RETRY_DELAY_MS)
				}
			}
			if (terminalPacketAssumedComplete) break
			if (!resp) throw new Error('Boot packet response is empty')

			if (terminalPacketWriteErrorAsComplete && (resp.command & 0xff) === 0x54) {
				const finishStatus = resp.data[0] & 0xff
				if (finishStatus !== 0) throw new Error(`Boot finalize failed: status=${finishStatus}`)
				lastRequested = packetTotal
				packetIndex = packetTotal
				lastCrc = crc32(firmware)
				finalizeAlreadyOk = true
				logger?.info && logger.info('[boot] finalize ok during data transfer', { packetTotal })
				break
			}

			if (resp.data.length < 3) throw new Error('Boot packet response too short')
			const status = resp.data[0] & 0xff
			const requested = bytesToU16BE(resp.data[1] & 0xff, resp.data[2] & 0xff)
			lastRequested = requested
			const seqTrace = packetSeqTrace(packetIndex)
			const ackTrace = ackSeqTrace(requested)
			logger?.debug && logger.debug('[boot] packet ack', { ...seqTrace, status, ...ackTrace })
			if (tracePacketTiming) {
				logger?.info &&
					logger.info('[boot] packet timing', {
						...seqTrace,
						packetTotal,
						status,
						...ackTrace,
						attempt: packetRetry + 1,
						rttMs: packetRttMs,
						dataPacketSize,
						packetDelayMs: currentPacketDelayMs,
						pageBoundaryDelayMs: currentPageBoundaryDelayMs,
					})
			}

			if (status === 0) {
				if (requested >= 0 && requested < packetTotal && requested !== packetIndex + 1) {
					packetIndex = requested
					retry = 0
					continue
				}
				packetIndex += 1
				retry = 0
				if (currentPacketDelayMs > 0) await sleep(currentPacketDelayMs)
				continue
			}

			// status: 1=not initialized, 2=write error, 3=sequence mismatch
			if (status === 1 && retry < maxRetry) {
				retry += 1
				// Re-send prepare then retry requested packet index
				await bootRequest(
					transport,
					buildBootFrame({ sourceAddress, targetAddress, command: 0x52, payload: preparePayload }),
					{ logger }
				)
				await sleep(MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS)
				packetIndex = Math.min(requested, packetTotal - 1)
				continue
			}
			if (status === 3 && requested < packetTotal && retry < maxRetry) {
				retry += 1
				packetIndex = requested
				continue
			}
			if (status === 5) {
				throw new Error('boot_firmware_size_mismatch')
			}
			throw new Error(`Boot packet failed: status=${status}`)
		}

		if (finalizeAlreadyOk) break
		if (requireFinalPacketAck && lastRequested < packetTotal) {
			throw new Error(`boot_transfer_incomplete:${lastRequested}/${packetTotal}`)
		}

		lastCrc = crc32(firmware)
		const finishPayload = u32ToBytesBE(lastCrc)
		const finishFrame = buildBootFrame({
			sourceAddress,
			targetAddress: activeWriteTarget,
			command: 0x54,
			payload: finishPayload,
		})

		const beforeFinalizeDelayMs = Math.min(
			MOBILE_BOOT_POST_ACK_DELAY_BUDGET_MS,
			Math.max(0, finalizeDelayMs ?? MOBILE_BOOT_FINALIZE_DELAY_MS)
		)
		if (beforeFinalizeDelayMs > 0) {
			logger?.info &&
				logger.info('[boot] finalize delay before 0x54', {
					delayMs: beforeFinalizeDelayMs,
					lastRequested,
					lastRequestedHex: seqHex(lastRequested),
					packetTotal,
				})
			await sleep(beforeFinalizeDelayMs)
		}
		let finalizeOk = false
		const maxFinalizeAttempts = Math.max(1, Math.floor(finalizeMaxAttempts ?? 3))
		for (finalizeAttempt = 1; finalizeAttempt <= maxFinalizeAttempts; finalizeAttempt += 1) {
			if (finalizeAttempt > 1) await sleep(300)
			let finishResp: ReturnType<typeof parseBootFrame> | null = null
			const duplicateFinalizeTimers: ReturnType<typeof setTimeout>[] = []
			try {
				const scheduleFinalizeBurst = () => {
					if (finalizeAttempt !== 1 || typeof transport.writeFrame !== 'function') return
					const intervals = (finalizeBurstIntervalsMs || []).filter((ms) => Number.isFinite(ms) && ms > 0)
					for (const delayMs of intervals) {
						const timer = setTimeout(() => {
							void (async () => {
								try {
									logger?.debug &&
										logger.debug('[boot] tx duplicate', {
											cmd: cmdHex(0x54),
											delayMs,
											len: finishFrame.length,
											hex: bytesToHex(finishFrame),
										})
									await transport.writeFrame?.(finishFrame, { writeWithResponse: false })
								} catch (e) {
									logger?.warn && logger.warn('[boot] finalize duplicate write failed', { delayMs, err: e })
								}
							})()
						}, delayMs)
						duplicateFinalizeTimers.push(timer)
					}
				}
				const requestWithResponse = transport.requestWithResponse
				if (typeof requestWithResponse === 'function') {
					logger?.debug &&
						logger.debug('[boot] tx', { cmd: cmdHex(0x54), len: finishFrame.length, hex: bytesToHex(finishFrame) })
					scheduleFinalizeBurst()
					const respBytes = await requestWithResponse(finishFrame, {
						timeoutMs: finalizeTimeoutMs,
						suppressTimeoutLog: finalizeAssumeSuccessOnTimeout && lastRequested >= packetTotal,
						disableAlternateWriteRetry: finalizeDisableAlternateWriteRetry,
					})
					logger?.debug && logger.debug('[boot] rx', { len: respBytes.length, hex: bytesToHex(respBytes) })
					finishResp = parseBootFrame(respBytes)
				} else {
					try {
						logger?.debug &&
							logger.debug('[boot] tx', { cmd: cmdHex(0x54), len: finishFrame.length, hex: bytesToHex(finishFrame) })
					} catch (e) {}
					scheduleFinalizeBurst()
					const respBytes = await transport.request(finishFrame, {
						timeoutMs: finalizeTimeoutMs,
						suppressTimeoutLog: finalizeAssumeSuccessOnTimeout && lastRequested >= packetTotal,
						disableAlternateWriteRetry: finalizeDisableAlternateWriteRetry,
					})
					try {
						logger?.debug && logger.debug('[boot] rx', { len: respBytes.length, hex: bytesToHex(respBytes) })
					} catch (e) {}
					finishResp = parseBootFrame(respBytes)
				}
			} catch (e: any) {
				const msg = String(e?.errMsg || e?.message || e || '').toLowerCase()
				if (finalizeAssumeSuccessOnTimeout && msg.includes('ble request timeout') && lastRequested >= packetTotal) {
					logger?.info && logger.info('[boot] finalize assume success after timeout', { finalizeAttempt })
					finalizeOk = true
					break
				}
				logger?.warn && logger.warn('[boot] finalize attempt failed', { finalizeAttempt, err: e })
				continue
			} finally {
				for (const timer of duplicateFinalizeTimers) clearTimeout(timer)
			}

			if (!finishResp) continue
			if ((finishResp.command & 0xff) === 0x53) {
				if (finishResp.data.length >= 3) {
					const status = finishResp.data[0] & 0xff
					const requested = bytesToU16BE(finishResp.data[1] & 0xff, finishResp.data[2] & 0xff)
					lastRequested = requested
					logger?.warn && logger.warn('[boot] finalize got data ack', { status, ...ackSeqTrace(requested) })
				}
				continue
			}
			const finishStatus = finishResp.data[0] & 0xff
			if (finishStatus !== 0) {
				logger?.warn && logger.warn('[boot] finalize failed', { finalizeAttempt, status: finishStatus })
				throw new Error(`Boot finalize failed: status=${finishStatus}`)
			}
			logger?.info && logger.info('[boot] finalize ok', { crc32: lastCrc >>> 0 })
			finalizeOk = true
			break
		}

		if (!finalizeOk) {
			throw new Error('Boot finalize timeout')
		}
		break
	}
	onProgress?.({ stage: 'finalize', percent: 100 })
	return { packetSize, packetTotal, crc32: lastCrc >>> 0, versionInfo }
}

export { crc32 }
