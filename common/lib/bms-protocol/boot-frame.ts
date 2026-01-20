import { BmsProtocolError, BMS_FRAME } from './frame'
import { crc16Modbus } from './crc16modbus'
import type { ByteArrayLike } from './types'

export const BOOT_FRAME = Object.freeze({
	HEAD: 0x55,
	TAIL: 0xfd,
	HOST_ADDR: BMS_FRAME.HOST_ADDR,
} as const)

export type BootFrame = {
	sourceAddress: number
	targetAddress: number
	command: number
	data: Uint8Array
	raw: Uint8Array
}

export function isBootFrameBytes(bytes: Uint8Array | ArrayLike<number>): boolean {
	const u8 = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
	return u8.length >= 9 && u8[0] === BOOT_FRAME.HEAD
}

function calcBootCrc(frameWithoutCrcAndTail: number[]): number {
	// CRC16-Modbus covers bytes from source address to last data byte (excludes head 0x55 and excludes CRC/tail)
	const crcRegion = frameWithoutCrcAndTail.slice(1)
	return crc16Modbus(crcRegion)
}

export function buildBootFrame({
	sourceAddress = BOOT_FRAME.HOST_ADDR,
	targetAddress,
	command,
	payload,
}: {
	sourceAddress?: number
	targetAddress: number
	command: number
	payload?: ByteArrayLike | Uint8Array
}): Uint8Array {
	if (targetAddress == null) throw new BmsProtocolError('targetAddress is required')
	if (command == null) throw new BmsProtocolError('command is required')
	const bytes = payload instanceof Uint8Array ? payload : payload ? Uint8Array.from(payload) : new Uint8Array(0)
	const dataLen = bytes.length & 0xffff
	const out: number[] = [
		BOOT_FRAME.HEAD,
		sourceAddress & 0xff,
		targetAddress & 0xff,
		command & 0xff,
		(dataLen >> 8) & 0xff,
		dataLen & 0xff,
	]
	for (let i = 0; i < bytes.length; i += 1) out.push(bytes[i] & 0xff)
	const crc = calcBootCrc(out)
	out.push(crc & 0xff, (crc >> 8) & 0xff, BOOT_FRAME.TAIL)
	return Uint8Array.from(out)
}

export function parseBootFrame(frameBytes: Uint8Array | ArrayLike<number>): BootFrame {
	const bytes = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes)
	if (!bytes || bytes.length < 9) throw new BmsProtocolError('Boot frame too short')
	if (bytes[0] !== BOOT_FRAME.HEAD) throw new BmsProtocolError('Bad boot frame header')
	if (bytes[bytes.length - 1] !== BOOT_FRAME.TAIL) throw new BmsProtocolError('Bad boot frame tail')
	const sourceAddress = bytes[1] & 0xff
	const targetAddress = bytes[2] & 0xff
	const command = bytes[3] & 0xff
	const dataLen = ((bytes[4] & 0xff) << 8) | (bytes[5] & 0xff)
	const expectedLen = 1 + 1 + 1 + 1 + 2 + dataLen + 2 + 1
	if (bytes.length !== expectedLen) throw new BmsProtocolError('Boot frame length mismatch')
	const dataEnd = 6 + dataLen
	const data = bytes.slice(6, dataEnd)
	const crcLo = bytes[dataEnd]
	const crcHi = bytes[dataEnd + 1]
	const crc = ((crcHi & 0xff) << 8) | (crcLo & 0xff)
	const calc = calcBootCrc(Array.from(bytes.slice(0, dataEnd)))
	if ((crc & 0xffff) !== (calc & 0xffff)) throw new BmsProtocolError('Boot frame CRC mismatch')
	return { sourceAddress, targetAddress, command, data, raw: bytes }
}
