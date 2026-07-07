import { crc16Modbus } from './crc16modbus'
import { BMS_FUNC, BMS_FRAME, registersToBytesBE } from './frame'
import { BMS_STATUS_READ_CANCELED_MESSAGE, BmsClient } from './client'
import type { BmsRequestOptions } from './types'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

function buildReadResponse(registers: number[]): Uint8Array {
	const data = registersToBytesBE(Uint16Array.from(registers))
	const bytes = [BMS_FRAME.HEAD_0, BMS_FRAME.HEAD_1, 0x01, 0xfe, BMS_FUNC.READ_HOLDING_REGISTERS, data.length]
	for (const byte of data) bytes.push(byte)
	const crc = crc16Modbus(bytes.slice(3))
	bytes.push(crc & 0xff, (crc >> 8) & 0xff, BMS_FRAME.TAIL)
	return Uint8Array.from(bytes)
}

async function main(): Promise<void> {
	let capturedOptions: BmsRequestOptions | undefined
	const shortClient = new BmsClient({
		transport: {
			request: (_frameBytes: Uint8Array, options?: BmsRequestOptions) => {
				capturedOptions = options
				return buildReadResponse([0x1802])
			},
		},
	})

	let mismatchThrown = false
	try {
		await shortClient.readRegisters(0x0100, 2)
	} catch (e) {
		mismatchThrown = e instanceof Error && e.message.includes('quantity mismatch')
	}
	assert(mismatchThrown, 'readRegisters should reject a response with fewer registers than requested')
	assert(capturedOptions?.expectedReadQuantity === 2, 'readRegisters should pass expectedReadQuantity to transport')
	assert(capturedOptions?.expectedReadByteCount === 4, 'readRegisters should pass expectedReadByteCount to transport')

	const okClient = new BmsClient({
		transport: {
			request: () => buildReadResponse([0x1234, 0x5678]),
		},
	})
	const regs = await okClient.readRegisters(0x0100, 2)
	assert(regs.length === 2, 'readRegisters should return requested register count')
	assert(regs[0] === 0x1234 && regs[1] === 0x5678, 'readRegisters should preserve register values')

	let paramOptions: BmsRequestOptions | undefined
	const paramClient = new BmsClient({
		transport: {
			request: (_frameBytes: Uint8Array, options?: BmsRequestOptions) => {
				paramOptions = options
				return buildReadResponse([0x00c8])
			},
		},
	})
	const paramValues = await paramClient.readParamsByKeys(['FUNCTION_CONFIG'], { timeoutMs: 4321 })
	assert(paramOptions?.timeoutMs === 4321, 'readParamsByKeys should pass timeoutMs to transport')
	assert(paramValues.FUNCTION_CONFIG === 0x00c8, 'readParamsByKeys should decode function config')

	const statusTimeouts: Array<number | undefined> = []
	const statusTimeoutClient = new BmsClient({
		transport: {
			request: (frameBytes: Uint8Array, options?: BmsRequestOptions) => {
				statusTimeouts.push(options?.timeoutMs)
				const startAddress = ((frameBytes[5] & 0xff) << 8) | (frameBytes[6] & 0xff)
				const quantity = ((frameBytes[7] & 0xff) << 8) | (frameBytes[8] & 0xff)
				const registers = new Array(quantity).fill(0)
				if (startAddress <= 0x0100 && 0x0100 < startAddress + quantity) {
					registers[0x0100 - startAddress] = 0x0200
				}
				return buildReadResponse(registers)
			},
		},
	})
	await statusTimeoutClient.readAllStatus({ timeoutMs: 2468 })
	assert(statusTimeouts.length > 1, 'readAllStatus should issue multiple register reads')
	assert(statusTimeouts.every((value) => value === 2468), 'readAllStatus should pass timeoutMs to status sub-reads')

	const singleSectionKeys = [
		'CELL_OV_ALARM_V',
		'CELL_OC_PROTECT_V',
		'CELL_OC_ALARM_DELAY_S',
		'CELL_OC_PROTECT_DELAY_S',
		'FEEDBACK_OC_PROTECT_DELAY_S',
		'CELL_OV_PROTECT_RELEASE_V',
		'CELL_OC_ALARM_RELEASE_DELTA_V',
		'CELL_OV_ALARM_RELEASE_DELAY_S',
		'CELL_OV_PROTECT_RELEASE_DELAY_S',
		'NORMAL_CELL_UV_ALARM_V',
		'NORMAL_CELL_UV_PROTECT_V',
		'LOW_TEMP_CELL_UV_ALARM_V',
		'LOW_TEMP_CELL_UV_PROTECT_V',
		'CELL_UV_ALARM_DELAY_S',
		'CELL_UV_PROTECT_DELAY_S',
		'CELL_UV_ALARM_RELEASE_V',
		'CELL_UV_PROTECT_RELEASE_V',
		'CELL_UV_ALARM_RELEASE_DELAY_S',
		'CELL_UV_PROTECT_RELEASE_DELAY_S',
	]
	const singleReadRanges: string[] = []
	const singleRangeClient = new BmsClient({
		transport: {
			request: (frameBytes: Uint8Array) => {
				const startAddress = ((frameBytes[5] & 0xff) << 8) | (frameBytes[6] & 0xff)
				const quantity = ((frameBytes[7] & 0xff) << 8) | (frameBytes[8] & 0xff)
				singleReadRanges.push(`${startAddress.toString(16).padStart(4, '0')}:${quantity}`)
				return buildReadResponse(new Array(quantity).fill(0x1234))
			},
		},
	})
	await singleRangeClient.readParamsByKeys(singleSectionKeys, { timeoutMs: 5000 })
	assert(singleReadRanges.includes('0400:6'), 'single cell params should read the first contiguous range')
	assert(singleReadRanges.includes('0408:9'), 'single cell params should read 0x0408-0x0410 as one contiguous range')
	assert(!singleReadRanges.includes('040d:4'), 'single cell params should not split out 0x040D as a separate request')

	let statusRequestCount = 0
	const cancelClient = new BmsClient({
		transport: {
			request: () => {
				statusRequestCount += 1
				return buildReadResponse([0x1802])
			},
		},
	})
	let cancelThrown = false
	try {
		await cancelClient.readAllStatus({ shouldContinue: () => statusRequestCount === 0 })
	} catch (e) {
		cancelThrown = e instanceof Error && e.message === BMS_STATUS_READ_CANCELED_MESSAGE
	}
	assert(cancelThrown, 'readAllStatus should throw canceled error when shouldContinue returns false')
	assert(statusRequestCount === 1, 'readAllStatus should not enqueue more status sub-requests after cancellation')

	let wakeupFrame: Uint8Array | undefined
	let wakeupOptions: BmsRequestOptions | undefined
	const wakeupClient = new BmsClient({
		transport: {
			request: (frameBytes: Uint8Array, options?: BmsRequestOptions) => {
				wakeupFrame = frameBytes
				wakeupOptions = options
				throw new Error('sleeping')
			},
		},
	})
	const wakeupOk = await wakeupClient.wakeupReadLink({ timeoutMs: 2345 })
	assert(!wakeupOk, 'wakeupReadLink should swallow probe timeout/errors')
	assert(wakeupFrame?.[4] === BMS_FUNC.READ_HOLDING_REGISTERS, 'wakeupReadLink should send a read query')
	assert(wakeupFrame?.[5] === 0x01 && wakeupFrame?.[6] === 0x00, 'wakeupReadLink should probe 0x0100 by default')
	assert(wakeupFrame?.[7] === 0x00 && wakeupFrame?.[8] === 0x01, 'wakeupReadLink should read one register by default')
	assert(wakeupOptions?.timeoutMs === 2345, 'wakeupReadLink should pass timeoutMs to transport')
}

void main().catch((err) => {
	setTimeout(() => {
		throw err
	}, 0)
})
