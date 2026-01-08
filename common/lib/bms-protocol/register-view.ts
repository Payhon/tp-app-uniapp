export class RegisterView {
	startAddress: number
	registers: Uint16Array

	constructor(startAddress: number, registers: Uint16Array) {
		this.startAddress = startAddress;
		this.registers = registers;
	}

	private _indexOf(address: number): number {
		const idx = address - this.startAddress;
		if (idx < 0 || idx >= this.registers.length) {
			throw new RangeError(`Register address out of range: 0x${address.toString(16)}`);
		}
		return idx;
	}

	u16(address: number): number {
		return this.registers[this._indexOf(address)] & 0xffff;
	}

	u32(address: number): number {
		const hi = this.u16(address);
		const lo = this.u16(address + 1);
		return ((hi << 16) >>> 0) + lo;
	}

	i32(address: number): number {
		const u = this.u32(address);
		return u & 0x80000000 ? u - 0x100000000 : u;
	}

	byteH(address: number): number {
		return (this.u16(address) >> 8) & 0xff;
	}

	byteL(address: number): number {
		return this.u16(address) & 0xff;
	}

	bytes(address: number, byteLength: number): Uint8Array {
		const startIdx = this._indexOf(address);
		const regsNeeded = Math.ceil(byteLength / 2);
		if (startIdx + regsNeeded > this.registers.length) {
			throw new RangeError(`Bytes out of range: 0x${address.toString(16)} len=${byteLength}`);
		}
		const out = new Uint8Array(regsNeeded * 2);
		for (let i = 0; i < regsNeeded; i += 1) {
			const reg = this.registers[startIdx + i] & 0xffff;
			out[i * 2] = (reg >> 8) & 0xff;
			out[i * 2 + 1] = reg & 0xff;
		}
		return out.slice(0, byteLength);
	}
}

export function decodeAscii(bytes: Uint8Array): string {
	// Stop at first '\0'. Also trim trailing 0xFF padding.
	let end = bytes.length;
	for (let i = 0; i < bytes.length; i += 1) {
		if (bytes[i] === 0x00) {
			end = i;
			break;
		}
	}
	while (end > 0 && bytes[end - 1] === 0xff) end -= 1;
	let s = '';
	for (let i = 0; i < end; i += 1) s += String.fromCharCode(bytes[i]);
	return s;
}

export function encodeAsciiFixed(str: string, byteLength: number): Uint8Array {
	const out = new Uint8Array(byteLength);
	for (let i = 0; i < byteLength; i += 1) out[i] = 0x00;
	const s = String(str ?? '');
	for (let i = 0; i < Math.min(byteLength - 1, s.length); i += 1) {
		out[i] = s.charCodeAt(i) & 0xff;
	}
	// Ensure \0 termination (already zero-filled).
	return out;
}
