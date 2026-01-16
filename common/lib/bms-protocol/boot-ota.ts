import type { BmsRequestTransport, LoggerLike } from './types'
import { decodeAscii } from './register-view'
import { BOOT_FRAME, buildBootFrame, parseBootFrame } from './boot-frame'

export type BootVersionInfo = {
	hardwareId: string | null
	softwareVersion: number | null
}

export type BootOtaProgress = {
	stage: 'query' | 'enter' | 'prepare' | 'transfer' | 'finalize'
	percent?: number
	packetIndex?: number
	packetTotal?: number
	message?: string
}

export type BootOtaResult = {
	packetSize: number
	packetTotal: number
	crc32: number
	versionInfo: BootVersionInfo | null
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

async function bootRequest(
	transport: BmsRequestTransport,
	frame: Uint8Array,
	{ logger }: { logger?: LoggerLike } = {}
) {
	const respBytes = await transport.request(frame)
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
	sourceAddress = BOOT_FRAME.HOST_ADDR,
	onProgress,
	logger,
	maxPacketSize,
}: {
	transport: BmsRequestTransport
	firmware: Uint8Array
	targetAddress: number
	sourceAddress?: number
	onProgress?: (p: BootOtaProgress) => void
	logger?: LoggerLike
	maxPacketSize?: number
}): Promise<BootOtaResult> {
	if (!firmware || firmware.length === 0) throw new Error('Firmware data is empty')
	const totalSize = firmware.length

	let versionInfo: BootVersionInfo | null = null
	try {
		onProgress?.({ stage: 'query', message: 'query' })
		versionInfo = await bootQueryVersion({ transport, targetAddress, sourceAddress, logger })
	} catch (e) {
		logger?.warn && logger.warn('[boot] query version failed, continue', e)
	}

	onProgress?.({ stage: 'enter', message: 'enter' })
	await bootRequest(transport, buildBootFrame({ sourceAddress, targetAddress, command: 0x51 }), { logger })
	// Doc suggests waiting 200ms after entering bootloader.
	await sleep(200)

	onProgress?.({ stage: 'prepare', message: 'prepare' })
	const sizePayload = u32ToBytesBE(totalSize >>> 0)
	const prepareResp = await bootRequest(transport, buildBootFrame({ sourceAddress, targetAddress, command: 0x52, payload: sizePayload }), { logger })
	const prepareData = prepareResp.data
	if (prepareData.length < 2) throw new Error('Boot prepare response too short')
	if ((prepareData[0] & 0xff) !== 0) throw new Error('Boot prepare failed')
	const optionIdx = prepareData[1] & 0xff
	let packetSize = PACKET_SIZE_OPTIONS[optionIdx] || PACKET_SIZE_OPTIONS[0]
	if (maxPacketSize && packetSize > maxPacketSize) {
		packetSize = PACKET_SIZE_OPTIONS.find((n) => n <= maxPacketSize) || packetSize
	}

	const packetTotal = Math.ceil(totalSize / packetSize)
	let packetIndex = 0
	let retry = 0
	const maxRetry = 5

	while (packetIndex < packetTotal) {
		const start = packetIndex * packetSize
		const end = Math.min(start + packetSize, totalSize)
		const chunk = firmware.slice(start, end)
		const payload = new Uint8Array(2 + chunk.length)
		payload.set(u16ToBytesBE(packetIndex), 0)
		payload.set(chunk, 2)

		onProgress?.({
			stage: 'transfer',
			packetIndex,
			packetTotal,
			percent: Math.min(99, Math.floor((packetIndex / packetTotal) * 100)),
		})

		const resp = await bootRequest(
			transport,
			buildBootFrame({ sourceAddress, targetAddress, command: 0x53, payload }),
			{ logger }
		)

		if (resp.data.length < 3) throw new Error('Boot packet response too short')
		const status = resp.data[0] & 0xff
		const requested = bytesToU16BE(resp.data[1] & 0xff, resp.data[2] & 0xff)

		if (status === 0) {
			packetIndex += 1
			retry = 0
			continue
		}

		// status: 1=not initialized, 2=write error, 3=sequence mismatch
		if (status === 1 && retry < maxRetry) {
			retry += 1
			// Re-send prepare then retry requested packet index
			await bootRequest(
				transport,
				buildBootFrame({ sourceAddress, targetAddress, command: 0x52, payload: sizePayload }),
				{ logger }
			)
			packetIndex = Math.min(requested, packetTotal - 1)
			continue
		}
		if (status === 3 && requested < packetTotal && retry < maxRetry) {
			retry += 1
			packetIndex = requested
			continue
		}
		throw new Error(`Boot packet failed: status=${status}`)
	}

	const crc = crc32(firmware)
	const finishPayload = u32ToBytesBE(crc)
	const finishResp = await bootRequest(
		transport,
		buildBootFrame({ sourceAddress, targetAddress, command: 0x54, payload: finishPayload }),
		{ logger }
	)
	const finishStatus = finishResp.data[0] & 0xff
	if (finishStatus !== 0) throw new Error('Boot finalize failed')

	onProgress?.({ stage: 'finalize', percent: 100 })
	return { packetSize, packetTotal, crc32: crc >>> 0, versionInfo }
}

export { crc32 }
