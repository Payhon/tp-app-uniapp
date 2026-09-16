import type { BmsRequestOptions, BmsRequestTransport, LoggerLike } from './types'
import { decodeAscii } from './register-view'
import { BOOT_FRAME, buildBootFrame, parseBootFrame } from './boot-frame'
import {
	clampBootPacketDelayMs,
	MOBILE_BOOT_FINALIZE_DELAY_MS,
	MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS,
	MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS,
	MOBILE_BOOT_RETRY_TIMEOUT_MS,
	MOBILE_BOOT_MAX_RETRIES,
	MOBILE_BOOT_FINALIZE_TIMEOUT_MS,
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
	isExplicitDisconnectError?: (error: unknown) => boolean
}

export const BOOT_PACKET_SIZE_OPTIONS = [64, 128, 256, 512, 1024] as const
export const BOOT_DATA_FRAME_OVERHEAD_BYTES = 11

export function resolveBootMaxPacketSizeForMtu(mtu: number): number {
	const attPayloadSize = Math.max(0, Math.floor(mtu) - 3)
	for (let index = BOOT_PACKET_SIZE_OPTIONS.length - 1; index >= 0; index -= 1) {
		const packetSize = BOOT_PACKET_SIZE_OPTIONS[index]
		if (packetSize + BOOT_DATA_FRAME_OVERHEAD_BYTES <= attPayloadSize) return packetSize
	}
	return 0
}

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
	return /^(ble|mqtt|socket) request timeout\b/i.test(formatErr(err))
}

function isSubmittedFinalizeDisconnectError(err: unknown): boolean {
	const extra = (err as { extra?: unknown } | null)?.extra
	if (!extra || typeof extra !== 'object') return false
	const marker = extra as { bootFrameSubmitted?: boolean; command?: number }
	return marker.bootFrameSubmitted === true && ((marker.command ?? -1) & 0xff) === 0x54
}

async function bootRequest(
	transport: BmsRequestTransport,
	frame: Uint8Array,
	{ logger, ...requestOptions }: BmsRequestOptions & { logger?: LoggerLike } = {}
) {
	try {
		logger?.debug && logger.debug('[boot] tx', { cmd: cmdHex(frame[3]), len: frame.length, hex: bytesToHex(frame) })
	} catch (e) {}
	const respBytes = await transport.request(frame, requestOptions)
	try {
		logger?.debug && logger.debug('[boot] rx', { len: respBytes.length, hex: bytesToHex(respBytes) })
	} catch (e) {}
	const resp = parseBootFrame(respBytes)
	if (resp.command !== frame[3]) {
		logger?.warn && logger.warn('[boot] unexpected response cmd', { expect: frame[3], got: resp.command })
	}
	return resp
}

// OTA控制命令的超时重试；不改变面板独立版本查询的等待策略。
async function bootControlRequest(transport: BmsRequestTransport, frame: Uint8Array, options: BmsRequestOptions = {}) {
	for (let retry = 0; ; retry += 1) {
		try {
			return await transport.request(frame, {
				...options,
				timeoutMs: retry === 0 ? MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS : MOBILE_BOOT_RETRY_TIMEOUT_MS,
				bootAckGraceMs: 0,
			})
		} catch (error) {
			if (!isTimeoutError(error) || retry >= MOBILE_BOOT_MAX_RETRIES) throw error
		}
	}
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
	sourceAddress = BOOT_FRAME.HOST_ADDR,
	onProgress,
	logger,
	maxPacketSize,
	skipEnterBoot,
	prepareBaudRate,
	enterBootTimeoutAsSuccess,
	packetDelayMs,
	pageBoundaryDelayMs,
	finalizeDelayMs,
	finalizeTimeoutMs,
	finalizeMaxAttempts,
	finalizeDisableAlternateWriteRetry,
	allowPostFinalizeBleDisconnectSuccess,
	requireFinalPacketAck,
	tracePacketTiming,
}: {
	transport: BootOtaTransport
	firmware: Uint8Array
	targetAddress: number
	queryTargetAddress?: number
	dataTargetAddress?: number
	sourceAddress?: number
	onProgress?: (p: BootOtaProgress) => void
	logger?: LoggerLike
	maxPacketSize?: number
	skipEnterBoot?: boolean
	prepareBaudRate?: number
	enterBootTimeoutAsSuccess?: boolean
	packetDelayMs?: number
	pageBoundaryDelayMs?: number
	finalizeDelayMs?: number
	finalizeTimeoutMs?: number
	finalizeMaxAttempts?: number
	finalizeDisableAlternateWriteRetry?: boolean
	allowPostFinalizeBleDisconnectSuccess?: boolean
	requireFinalPacketAck?: boolean
	tracePacketTiming?: boolean
}): Promise<BootOtaResult> {
	if (!firmware || firmware.length === 0) throw new Error('Firmware data is empty')
	const totalSize = firmware.length

	let versionInfo: BootVersionInfo | null = null
	const controlTransport: BmsRequestTransport = {
		request: (frame, options) => bootControlRequest(transport, frame, options),
	}
	try {
		onProgress?.({ stage: 'query', message: 'query' })
		const queryTarget = queryTargetAddress ?? targetAddress
		versionInfo = await bootQueryVersion({ transport: controlTransport, targetAddress: queryTarget, sourceAddress, logger })
		logger?.info && logger.info('[boot] version', versionInfo)
	} catch (e) {
		if (!isTimeoutError(e)) throw e
		logger?.warn && logger.warn('[boot] query version failed, continue', e)
	}

	if (!skipEnterBoot) {
		onProgress?.({ stage: 'enter', message: 'enter' })
		try {
			const enterResp = await bootRequest(controlTransport, buildBootFrame({ sourceAddress, targetAddress, command: 0x51 }), { logger })
			if (enterResp.command !== 0x51 || enterResp.data.length < 1 || enterResp.data[0] !== 0) {
				throw new Error(`Boot enter rejected: status=${enterResp.data[0]}`)
			}
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
		controlTransport,
		buildBootFrame({ sourceAddress, targetAddress, command: 0x52, payload: preparePayload }),
		{ logger }
	)
	const prepareData = prepareResp.data
	if (prepareResp.command !== 0x52 || prepareData.length !== 2) throw new Error('Invalid Boot prepare response')
	if ((prepareData[0] & 0xff) !== 0) throw new Error('Boot prepare failed')
	const optionIdx = prepareData[1] & 0xff
	const packetSize = BOOT_PACKET_SIZE_OPTIONS[optionIdx]
	if (!packetSize) throw new Error(`Boot prepare invalid packet size: ${optionIdx}`)
	if (maxPacketSize != null && packetSize > maxPacketSize) {
		// 0x52 是设备指定包长，不是主机可单方面改小的建议值。
		throw new Error(`boot_ble_frame_exceeds_mtu:${packetSize + BOOT_DATA_FRAME_OVERHEAD_BYTES}`)
	}
	logger?.info && logger.info('[boot] prepare ok', { totalSize, optionIdx, packetSize })
	// 旧版收到准备 ACK 后立即发首包，不额外占用设备等待窗口。
	if (MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS > 0) await sleep(MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS)

	// Use data length = packetSize, payload = 2 bytes seq + data => payload length = packetSize + 2
	const dataPacketSize = Math.max(1, packetSize)
	const payloadLen = dataPacketSize + 2
	logger?.info && logger.info('[boot] data packet size', { dataPacketSize, packetSize, payloadLen })
	const packetTotal = Math.ceil(totalSize / dataPacketSize)
	if (packetTotal > 0xffff) throw new Error('Boot firmware exceeds packet sequence range')
	if (tracePacketTiming) {
		logger?.info &&
			logger.info('[boot] transfer timing config', {
				totalSize,
				packetTotal,
				dataPacketSize,
				payloadLen,
				packetDelayMs: packetDelayMs ?? 0,
				pageBoundaryDelayMs: pageBoundaryDelayMs ?? MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS,
			})
	}
	let packetIndex = 0
	let recoveryCount = 0
	const maxRecoveryCount = MOBILE_BOOT_MAX_RETRIES
	const activeWriteTarget = dataTargetAddress ?? targetAddress
	let highestRequested = 0
	let finalizeAttempt = 0
	let lastCrc = 0
	const currentPacketDelayMs = clampBootPacketDelayMs(packetDelayMs)
	const currentPageBoundaryDelayMs = Math.max(
		0,
		pageBoundaryDelayMs ?? MOBILE_BOOT_PAGE_BOUNDARY_DELAY_MS
	)

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

			let resp: ReturnType<typeof parseBootFrame>
			let packetRttMs = 0
			let packetRetry = 0
			while (true) {
				const packetAttemptStartedAt = Date.now()
				try {
					resp = await bootRequest(
						transport,
						buildBootFrame({ sourceAddress, targetAddress: activeWriteTarget, command: 0x53, payload }),
						{ logger, timeoutMs: packetRetry === 0 ? MOBILE_BOOT_NON_FINALIZE_TIMEOUT_MS : MOBILE_BOOT_RETRY_TIMEOUT_MS, bootAckGraceMs: 0 }
					)
					packetRttMs = Date.now() - packetAttemptStartedAt
					break
				} catch (e) {
					// 只有设备 ACK 超时可恢复；写入、断连和取消错误必须立即失败。
					if (!isTimeoutError(e)) throw e
					const elapsedMs = Date.now() - packetAttemptStartedAt
					if (recoveryCount >= maxRecoveryCount) {
						logger?.error?.('[boot] packet ACK retries exhausted', {
							...packetSeqTrace(packetIndex), packetRetry, recoveryCount, maxRecoveryCount, elapsedMs, err: formatErr(e),
						})
						throw new Error(`boot_packet_no_ack:${packetIndex}`)
					}
					packetRetry += 1
					recoveryCount += 1
					logger?.warn?.('[boot] packet ACK timeout, retry same packet', {
						...packetSeqTrace(packetIndex), packetRetry, recoveryCount, maxRecoveryCount, elapsedMs, err: formatErr(e),
					})
				}
			}

			if (resp.command !== 0x53 || resp.data.length !== 3) throw new Error('Invalid Boot packet response')
			const status = resp.data[0] & 0xff
			const requested = bytesToU16BE(resp.data[1] & 0xff, resp.data[2] & 0xff)
			if (status === 0 && requested !== packetIndex + 1) {
				throw new Error(`Boot unexpected packet ACK: ${requested}, expected ${packetIndex + 1}`)
			}
			const seqTrace = packetSeqTrace(packetIndex)
			const ackTrace = ackSeqTrace(requested)
			logger?.debug && logger.debug('[boot] packet ack', {
				...seqTrace, status, ...ackTrace, rttMs: packetRttMs, packetRetry, recoveryCount, frameLen: payload.length + 9,
			})
			if (tracePacketTiming) {
				logger?.info &&
					logger.info('[boot] packet timing', {
						...seqTrace,
						packetTotal,
						status,
						...ackTrace,
						packetRetry,
						recoveryCount,
						rttMs: packetRttMs,
						dataPacketSize,
						packetDelayMs: currentPacketDelayMs,
						pageBoundaryDelayMs: currentPageBoundaryDelayMs,
					})
			}

			if (status === 0 || (status === 3 && requested === packetIndex + 1)) {
				if (requested > 0) {
					const acknowledgedPacketIndex = Math.min(requested, packetTotal) - 1
					onProgress?.({
						stage: 'transfer',
						...(packetSeqTrace(acknowledgedPacketIndex) as {
							packetIndex: number
							packetIndexHex: string
							expectedAck: number
							expectedAckHex: string
						}),
						packetTotal,
						percent: Math.min(99, Math.floor((Math.min(requested, packetTotal) / packetTotal) * 100)),
					})
				}
				packetIndex = requested
				if (requested > highestRequested) {
					highestRequested = requested
					recoveryCount = 0
				}
				if (currentPacketDelayMs > 0) await sleep(currentPacketDelayMs)
				continue
			}

			// status: 1=not initialized, 2=write error, 3=sequence mismatch
			if (status === 1 && recoveryCount < maxRecoveryCount) {
				recoveryCount += 1
				// Re-send prepare, then restart from packet zero.
				const reprepare = await bootRequest(
					controlTransport,
					buildBootFrame({ sourceAddress, targetAddress, command: 0x52, payload: preparePayload }),
					{ logger }
				)
				if (reprepare.command !== 0x52 || reprepare.data.length !== 2 || reprepare.data[0] !== 0 || reprepare.data[1] !== optionIdx) {
					throw new Error('Boot reprepare failed or packet size changed')
				}
				if (MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS > 0) await sleep(MOBILE_BOOT_PREPARE_TO_DATA_DELAY_MS)
				packetIndex = 0
				onProgress?.({ stage: 'transfer', packetIndex: -1, packetTotal, percent: 0 })
				continue
			}
			if (status === 3 && requested <= packetIndex && requested < packetTotal && recoveryCount < maxRecoveryCount) {
				recoveryCount += 1
				packetIndex = requested
				onProgress?.({
					stage: 'transfer',
					packetIndex: requested - 1,
					packetTotal,
					percent: Math.floor((requested / packetTotal) * 100),
				})
				continue
			}
			if (status === 5) {
				throw new Error('boot_firmware_size_mismatch')
			}
			throw new Error(`Boot packet failed: status=${status}`)
		}

		if (requireFinalPacketAck && packetIndex < packetTotal) {
			throw new Error(`boot_transfer_incomplete:${packetIndex}/${packetTotal}`)
		}
		if (packetIndex < packetTotal) {
			logger?.warn?.('[boot] data ACKs incomplete, require real finalize ACK', { requested: packetIndex, packetTotal })
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
					requested: packetIndex,
					requestedHex: seqHex(packetIndex),
					packetTotal,
				})
			await sleep(beforeFinalizeDelayMs)
		}
		let finalizeOk = false
		const maxFinalizeAttempts = Math.min(MOBILE_BOOT_MAX_RETRIES + 1, Math.max(1, Math.floor(finalizeMaxAttempts ?? MOBILE_BOOT_MAX_RETRIES + 1)))
		for (finalizeAttempt = 1; finalizeAttempt <= maxFinalizeAttempts; finalizeAttempt += 1) {
			const attemptTimeoutMs = finalizeAttempt === 1 ? finalizeTimeoutMs ?? MOBILE_BOOT_FINALIZE_TIMEOUT_MS : MOBILE_BOOT_RETRY_TIMEOUT_MS
			let finishResp: ReturnType<typeof parseBootFrame> | null = null
			try {
				const requestWithResponse = transport.requestWithResponse
				if (typeof requestWithResponse === 'function') {
					logger?.debug &&
						logger.debug('[boot] tx', { cmd: cmdHex(0x54), len: finishFrame.length, hex: bytesToHex(finishFrame) })
					const respBytes = await requestWithResponse(finishFrame, {
						timeoutMs: attemptTimeoutMs,
						bootAckGraceMs: 0,
						disableAlternateWriteRetry: finalizeDisableAlternateWriteRetry,
					})
					logger?.debug && logger.debug('[boot] rx', { len: respBytes.length, hex: bytesToHex(respBytes) })
					finishResp = parseBootFrame(respBytes)
				} else {
					try {
						logger?.debug &&
							logger.debug('[boot] tx', { cmd: cmdHex(0x54), len: finishFrame.length, hex: bytesToHex(finishFrame) })
					} catch (e) {}
					const respBytes = await transport.request(finishFrame, {
						timeoutMs: attemptTimeoutMs,
						bootAckGraceMs: 0,
						disableAlternateWriteRetry: finalizeDisableAlternateWriteRetry,
					})
					try {
						logger?.debug && logger.debug('[boot] rx', { len: respBytes.length, hex: bytesToHex(respBytes) })
					} catch (e) {}
					finishResp = parseBootFrame(respBytes)
				}
			} catch (e) {
				if (
					allowPostFinalizeBleDisconnectSuccess &&
					packetIndex >= packetTotal &&
					isSubmittedFinalizeDisconnectError(e) &&
					transport.isExplicitDisconnectError?.(e)
				) {
					logger?.info && logger.info('[boot] finalize accepted after explicit BLE disconnect', { finalizeAttempt })
					finalizeOk = true
					break
				}
				if (!isTimeoutError(e)) throw e
				logger?.warn && logger.warn('[boot] finalize attempt failed', { finalizeAttempt, err: e })
				continue
			}

			if (!finishResp) continue
			if (finishResp.command !== 0x54 || finishResp.data.length < 1) {
				throw new Error('Boot finalize failed: invalid response')
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
