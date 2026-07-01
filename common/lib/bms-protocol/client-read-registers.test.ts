import { crc16Modbus } from './crc16modbus'
import { BMS_FUNC, BMS_FRAME, registersToBytesBE } from './frame'
import { BmsClient } from './client'
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
}

void main().catch((err) => {
	setTimeout(() => {
		throw err
	}, 0)
})
