import { crc16Modbus } from './crc16modbus'

export const BMS_FRAME = Object.freeze({
	// 帧头字节 0（固定 0x7F）
	HEAD_0: 0x7f,
	// 帧头字节 1（固定 0x55）
	HEAD_1: 0x55,
	// 帧尾（固定 0xFD）
	TAIL: 0xfd,
	// 上位机地址（文档默认 0xFE）
	HOST_ADDR: 0xfe,
} as const);

export const BMS_FUNC = Object.freeze({
	// 0x03：读寄存器（寄存器查询）
	READ_HOLDING_REGISTERS: 0x03,
	// 0x10：写连续寄存器
	WRITE_MULTIPLE_REGISTERS: 0x10,
	// 0x11：写从机地址/分配地址
	ASSIGN_SLAVE_ADDR: 0x11,
	// 0xFF：获取 BMS 板 UUID（读指令扩展）
	READ_UUID: 0xff,
} as const);

export type BmsErrorFrame = {
	type: 'error'
	sourceAddress: number
	targetAddress: number
	functionCode: number
	errorCode: number
	raw: Uint8Array
}

export type BmsReadFrame = {
	type: 'read'
	sourceAddress: number
	targetAddress: number
	functionCode: number
	byteCount: number
	data: Uint8Array
	raw: Uint8Array
}

export type BmsWriteFrame = {
	type: 'write'
	sourceAddress: number
	targetAddress: number
	functionCode: number
	startAddress: number
	quantity: number
	raw: Uint8Array
}

export type BmsParsedFrame = BmsErrorFrame | BmsReadFrame | BmsWriteFrame

export class BmsProtocolError extends Error {
	extra: unknown

	constructor(message: string, extra?: unknown) {
		super(message);
		this.name = 'BmsProtocolError';
		this.extra = extra;
	}
}

function u16beToBytes(value: number): [number, number] {
	return [(value >> 8) & 0xff, value & 0xff];
}

function pushU16be(out: number[], value: number): void {
	out.push((value >> 8) & 0xff, value & 0xff);
}

function calcCrcForFrame(frameWithoutCrcAndTail: number[]): number {
	// CRC16-Modbus covers bytes from **target address** to last data byte (i.e. excludes 0x7F,0x55 and excludes source address)
	// Ref: doc/oriigin/device_comm_protocol_basic.md - "CRC值...从目标地址到CRC前面所有字节"
	const crcRegion = frameWithoutCrcAndTail.slice(3);
	return crc16Modbus(crcRegion);
}

export function buildReadFrame({
	sourceAddress = BMS_FRAME.HOST_ADDR,
	targetAddress,
	functionCode = BMS_FUNC.READ_HOLDING_REGISTERS,
	startAddress,
	quantity,
}: {
	sourceAddress?: number
	targetAddress: number
	functionCode?: number
	startAddress: number
	quantity: number
}): Uint8Array {
	if (targetAddress == null) throw new BmsProtocolError('targetAddress is required');
	if (startAddress == null) throw new BmsProtocolError('startAddress is required');
	if (quantity == null) throw new BmsProtocolError('quantity is required');
	if (quantity < 1 || quantity > 0xffff) throw new BmsProtocolError('quantity out of range');

	const bytes = [BMS_FRAME.HEAD_0, BMS_FRAME.HEAD_1, sourceAddress & 0xff, targetAddress & 0xff, functionCode & 0xff];
	pushU16be(bytes, startAddress & 0xffff);
	pushU16be(bytes, quantity & 0xffff);

	const crc = calcCrcForFrame(bytes);
	bytes.push(crc & 0xff, (crc >> 8) & 0xff, BMS_FRAME.TAIL);
	return Uint8Array.from(bytes);
}

export function buildWriteMultipleRegistersFrame({
	sourceAddress = BMS_FRAME.HOST_ADDR,
	targetAddress,
	startAddress,
	registerValues,
	functionCode = BMS_FUNC.WRITE_MULTIPLE_REGISTERS,
}: {
	sourceAddress?: number
	targetAddress: number
	startAddress: number
	registerValues: Uint16Array
	functionCode?: number
}): Uint8Array {
	if (targetAddress == null) throw new BmsProtocolError('targetAddress is required');
	if (startAddress == null) throw new BmsProtocolError('startAddress is required');
	if (!registerValues || registerValues.length < 1) throw new BmsProtocolError('registerValues must be non-empty');

	const quantity = registerValues.length;
	const byteCount = quantity * 2;
	if (quantity > 0x78) {
		// Spec says 1~120 registers
		throw new BmsProtocolError('registerValues too long (max 120 registers)');
	}

	const bytes = [BMS_FRAME.HEAD_0, BMS_FRAME.HEAD_1, sourceAddress & 0xff, targetAddress & 0xff, functionCode & 0xff];
	pushU16be(bytes, startAddress & 0xffff);
	pushU16be(bytes, quantity & 0xffff);
	bytes.push(byteCount & 0xff);
	for (let i = 0; i < registerValues.length; i += 1) {
		pushU16be(bytes, registerValues[i] & 0xffff);
	}

	const crc = calcCrcForFrame(bytes);
	bytes.push(crc & 0xff, (crc >> 8) & 0xff, BMS_FRAME.TAIL);
	return Uint8Array.from(bytes);
}

export function parseFrame(frameBytes: Uint8Array | ArrayLike<number>): BmsParsedFrame {
	if (!frameBytes || frameBytes.length < 6) throw new BmsProtocolError('Frame too short');
	const bytes = frameBytes instanceof Uint8Array ? frameBytes : Uint8Array.from(frameBytes);
	if (bytes[0] !== BMS_FRAME.HEAD_0 || bytes[1] !== BMS_FRAME.HEAD_1) throw new BmsProtocolError('Bad frame header');
	if (bytes[bytes.length - 1] !== BMS_FRAME.TAIL) throw new BmsProtocolError('Bad frame tail');

	const declaredCrcLo = bytes[bytes.length - 3];
	const declaredCrcHi = bytes[bytes.length - 2];
	const declaredCrc = (declaredCrcHi << 8) | declaredCrcLo;
	const bodyWithoutCrcAndTail = bytes.slice(0, bytes.length - 3);
	const calcCrc = calcCrcForFrame(Array.from(bodyWithoutCrcAndTail));
	if (declaredCrc !== calcCrc) {
		throw new BmsProtocolError('CRC mismatch', { declaredCrc, calcCrc });
	}

	const sourceAddress = bytes[2];
	const targetAddress = bytes[3];
	const functionCode = bytes[4];

	// Error response: functionCode = req + 0x80, then 1 byte errorCode
	if (bytes.length === 9 && (functionCode & 0x80)) {
		return {
			type: 'error',
			sourceAddress,
			targetAddress,
			functionCode,
			errorCode: bytes[5],
			raw: bytes,
		};
	}

	// Read response: [.., func, byteCount, data..., crcLo, crcHi, tail]
	if (bytes.length >= 10 && (functionCode === BMS_FUNC.READ_HOLDING_REGISTERS || functionCode === BMS_FUNC.READ_UUID)) {
		const byteCount = bytes[5];
		const expectedLength = 2 + 3 + 1 + byteCount + 2 + 1; // head2 + (src,dst,func) + byteCount + data + crc2 + tail
		if (bytes.length !== expectedLength) {
			throw new BmsProtocolError('Read response length mismatch', { byteCount, length: bytes.length });
		}
		const data = bytes.slice(6, 6 + byteCount);
		return {
			type: 'read',
			sourceAddress,
			targetAddress,
			functionCode,
			byteCount,
			data,
			raw: bytes,
		};
	}

	// Write response: [.., func, addrHi, addrLo, qtyHi, qtyLo, crcLo, crcHi, tail]
	if (bytes.length === 12 && (functionCode === BMS_FUNC.WRITE_MULTIPLE_REGISTERS || functionCode === BMS_FUNC.ASSIGN_SLAVE_ADDR)) {
		const startAddress = (bytes[5] << 8) | bytes[6];
		const quantity = (bytes[7] << 8) | bytes[8];
		return {
			type: 'write',
			sourceAddress,
			targetAddress,
			functionCode,
			startAddress,
			quantity,
			raw: bytes,
		};
	}

	throw new BmsProtocolError('Unknown frame type', { functionCode, length: bytes.length });
}

export function splitIntoRegistersBE(dataBytes: Uint8Array): Uint16Array {
	if (dataBytes.length % 2 !== 0) throw new BmsProtocolError('Register data length must be even');
	const regs = new Uint16Array(dataBytes.length / 2);
	for (let i = 0; i < regs.length; i += 1) {
		const hi = dataBytes[i * 2];
		const lo = dataBytes[i * 2 + 1];
		regs[i] = (hi << 8) | lo;
	}
	return regs;
}

export function registersToBytesBE(registerValues: Uint16Array): Uint8Array {
	const out = new Uint8Array(registerValues.length * 2);
	for (let i = 0; i < registerValues.length; i += 1) {
		const [hi, lo] = u16beToBytes(registerValues[i] & 0xffff);
		out[i * 2] = hi;
		out[i * 2 + 1] = lo;
	}
	return out;
}
