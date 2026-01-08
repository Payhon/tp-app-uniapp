import type { ByteArrayLike } from './types'

export function crc16Modbus(bytes: ByteArrayLike): number {
	let crc = 0xffff;
	for (let i = 0; i < bytes.length; i += 1) {
		crc ^= bytes[i] & 0xff;
		for (let bit = 0; bit < 8; bit += 1) {
			if (crc & 0x0001) {
				crc = (crc >> 1) ^ 0xa001;
			} else {
				crc >>= 1;
			}
		}
	}
	return crc & 0xffff;
}

export function crc16ModbusBytesLE(bytes: ByteArrayLike): Uint8Array {
	const crc = crc16Modbus(bytes);
	return new Uint8Array([crc & 0xff, (crc >> 8) & 0xff]);
}
