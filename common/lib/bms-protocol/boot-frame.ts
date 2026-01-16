import { BmsProtocolError, BMS_FRAME } from './frame'
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
	return u8.length >= 4 && u8[0] === BOOT_FRAME.HEAD
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
	const out: number[] = [
		BOOT_FRAME.HEAD,
		sourceAddress & 0xff,
		targetAddress & 0xff,
		command & 0xff,
	]
	if (payload) {
		const bytes = payload instanceof Uint8Array ? payload : Uint8Array.from(payload)
		for (let i = 0; i < bytes.length; i += 1) out.push(bytes[i] & 0xff)
	}
	out.push(BOOT_FRAME.TAIL)
	return Uint8Array.from(out)
}

export function parseBootFrame(frameBytes: Uint8Array | ArrayLike<number>): BootFrame {
	const bytes = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes)
	if (!bytes || bytes.length < 5) throw new BmsProtocolError('Boot frame too short')
	if (bytes[0] !== BOOT_FRAME.HEAD) throw new BmsProtocolError('Bad boot frame header')
	if (bytes[bytes.length - 1] !== BOOT_FRAME.TAIL) throw new BmsProtocolError('Bad boot frame tail')
	const sourceAddress = bytes[1] & 0xff
	const targetAddress = bytes[2] & 0xff
	const command = bytes[3] & 0xff
	const data = bytes.slice(4, bytes.length - 1)
	return { sourceAddress, targetAddress, command, data, raw: bytes }
}
