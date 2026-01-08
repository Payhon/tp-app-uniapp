import {
	BMS_FUNC,
	BMS_FRAME,
	BmsProtocolError,
	buildReadFrame,
	buildWriteMultipleRegistersFrame,
	parseFrame,
	splitIntoRegistersBE,
} from './frame';
import {
	PARAM_CATEGORIES,
	PARAM_DEF_BY_KEY,
	constToCamel,
	normalizeParamKey,
	type ParamCategory,
} from './param-registry';
import { RegisterView, decodeAscii, encodeAsciiFixed } from './register-view';
import { parseStatusRegisters } from './status-parser';
import type { BmsParsedFrame } from './frame'
import type { BmsParamDef, BmsRequestTransport, BmsStatus } from './types'

type AddressRange = { startAddress: number; quantity: number }

function chunkRanges(startAddress: number, quantity: number, maxChunk: number): AddressRange[] {
	const ranges: AddressRange[] = [];
	let addr = startAddress;
	let remaining = quantity;
	while (remaining > 0) {
		const n = Math.min(remaining, maxChunk);
		ranges.push({ startAddress: addr, quantity: n });
		addr += n;
		remaining -= n;
	}
	return ranges;
}

function groupContiguousAddresses(addresses: number[]): AddressRange[] {
	const sorted = Array.from(new Set(addresses)).sort((a, b) => a - b);
	const ranges: AddressRange[] = [];
	let i = 0;
	while (i < sorted.length) {
		let start = sorted[i];
		let end = start;
		i += 1;
		while (i < sorted.length && sorted[i] === end + 1) {
			end = sorted[i];
			i += 1;
		}
		ranges.push({ startAddress: start, quantity: end - start + 1 });
	}
	return ranges;
}

function u16FromBytes(hi: number, lo: number): number {
	return ((hi & 0xff) << 8) | (lo & 0xff);
}

type DecodableParamDef = Extract<BmsParamDef, { valueType: 'u8' | 'u16' | 'u32' | 'str' }>

function decodeParam(def: DecodableParamDef, view: RegisterView): number | string | null {
	if (def.valueType === 'u16') {
		const scale = def.scale == null ? 1 : def.scale;
		const offset = def.offset == null ? 0 : def.offset;
		const raw = view.u16(def.address);
		if (raw === 0xffff) return null;
		return raw * scale + offset;
	}
	if (def.valueType === 'u32') {
		const scale = def.scale == null ? 1 : def.scale;
		const offset = def.offset == null ? 0 : def.offset;
		const raw = view.u32(def.address);
		if (raw === 0xffffffff) return null;
		return raw * scale + offset;
	}
	if (def.valueType === 'u8') {
		const scale = def.scale == null ? 1 : def.scale;
		const offset = def.offset == null ? 0 : def.offset;
		const rawByte = def.byte === 'H' ? view.byteH(def.address) : view.byteL(def.address);
		if (rawByte === 0xff) return null;
		return rawByte * scale + offset;
	}
		if (def.valueType === 'str') {
			const bytes = view.bytes(def.startAddress, def.byteLength);
			return decodeAscii(bytes);
		}
		const _exhaustiveCheck: never = def;
		throw new BmsProtocolError('Unsupported valueType', { def: _exhaustiveCheck });
	}

function encodeStringToRegisterWrites(startAddress: number, byteLength: number, str: string) {
	const bytes = encodeAsciiFixed(str, byteLength);
	const regs: number[] = [];
	for (let i = 0; i < Math.ceil(byteLength / 2); i += 1) {
		const hi = bytes[i * 2] ?? 0x00;
		const lo = bytes[i * 2 + 1] ?? 0x00;
		regs.push(u16FromBytes(hi, lo));
	}
	return { startAddress, registerValues: regs };
}

export class BmsClient {
	private transport: BmsRequestTransport
	private targetAddress: number
	private sourceAddress: number
	private maxReadRegisters: number
	private maxWriteRegisters: number

	constructor({
		transport,
		targetAddress = 0x01,
		sourceAddress = BMS_FRAME.HOST_ADDR,
		maxReadRegisters = 120,
		maxWriteRegisters = 120,
	}: {
		transport: BmsRequestTransport
		targetAddress?: number
		sourceAddress?: number
		maxReadRegisters?: number
		maxWriteRegisters?: number
	}) {
		if (!transport || typeof transport.request !== 'function') {
			throw new BmsProtocolError('transport.request(frameBytes) is required');
		}
		this.transport = transport;
		this.targetAddress = targetAddress & 0xff;
		this.sourceAddress = sourceAddress & 0xff;
		this.maxReadRegisters = maxReadRegisters;
		this.maxWriteRegisters = maxWriteRegisters;
	}

	private async _request(frameBytes: Uint8Array): Promise<BmsParsedFrame> {
		const respBytes = await this.transport.request(frameBytes);
		return parseFrame(respBytes);
	}

	async readRegisters(
		startAddress: number,
		quantity: number,
		{ functionCode = BMS_FUNC.READ_HOLDING_REGISTERS }: { functionCode?: number } = {}
	): Promise<Uint16Array> {
		const ranges = chunkRanges(startAddress, quantity, this.maxReadRegisters);
		const out = new Uint16Array(quantity);
		let offset = 0;
		for (const r of ranges) {
			const req = buildReadFrame({
				sourceAddress: this.sourceAddress,
				targetAddress: this.targetAddress,
				functionCode,
				startAddress: r.startAddress,
				quantity: r.quantity,
			});
			const resp = await this._request(req);
			if (resp.type === 'error') throw new BmsProtocolError('BMS error response', resp);
			if (resp.type !== 'read') throw new BmsProtocolError('Unexpected response type', resp);
			const regs = splitIntoRegistersBE(resp.data);
			out.set(regs, offset);
			offset += regs.length;
		}
		return out;
	}

	async writeRegisters(
		startAddress: number,
		registerValues: Uint16Array,
		{ functionCode = BMS_FUNC.WRITE_MULTIPLE_REGISTERS }: { functionCode?: number } = {}
	): Promise<void> {
		const ranges = chunkRanges(startAddress, registerValues.length, this.maxWriteRegisters);
		let offset = 0;
		for (const r of ranges) {
			const chunk = registerValues.slice(offset, offset + r.quantity);
			const req = buildWriteMultipleRegistersFrame({
				sourceAddress: this.sourceAddress,
				targetAddress: this.targetAddress,
				functionCode,
				startAddress: r.startAddress,
				registerValues: chunk,
			});
			const resp = await this._request(req);
			if (resp.type === 'error') throw new BmsProtocolError('BMS error response', resp);
			if (resp.type !== 'write') throw new BmsProtocolError('Unexpected response type', resp);
			offset += r.quantity;
		}
	}

	async readUuid(): Promise<string> {
		const req = buildReadFrame({
			sourceAddress: this.sourceAddress,
			targetAddress: this.targetAddress,
			functionCode: BMS_FUNC.READ_UUID,
			startAddress: 0x0000,
			quantity: 0x0008,
		});
		const resp = await this._request(req);
		if (resp.type === 'error') throw new BmsProtocolError('BMS error response', resp);
		if (resp.type !== 'read') throw new BmsProtocolError('Unexpected response type', resp);
		// 16 bytes UUID
		let hex = '';
		for (let i = 0; i < resp.data.length; i += 1) hex += resp.data[i].toString(16).padStart(2, '0');
		return hex;
	}

	async syncTime(timestampSeconds = Math.floor(Date.now() / 1000)): Promise<void> {
		const raw = timestampSeconds >>> 0;
		const regs = new Uint16Array([(raw >>> 16) & 0xffff, raw & 0xffff]);
		await this.writeRegisters(0x57c, regs);
	}

	async readAllStatus(): Promise<BmsStatus> {
		const head = await this.readRegisters(0x100, 1);
		const s = (head[0] >> 8) & 0xff;
		const n = head[0] & 0xff;
		const cellVoltagesStart = 0x141;
		const macStart = cellVoltagesStart + s + n + 16 + 16 + 16;
		const macRegs = 5; // 10 bytes
		const lastAddr = macStart + macRegs - 1;
		const totalRegs = lastAddr - 0x100 + 1;
		const regs = await this.readRegisters(0x100, totalRegs);
		return parseStatusRegisters({ startAddress: 0x100, registers: regs });
	}

	async readRoParam(paramKey: string): Promise<unknown> {
		const key = normalizeParamKey(paramKey);
		if (!key) throw new BmsProtocolError(`Unknown parameter key: ${paramKey}`);
		const def = PARAM_DEF_BY_KEY[key];
		if (def.access !== 'R') throw new BmsProtocolError(`Not a read-only parameter: ${key}`, { def });
		if (def.valueType !== 'statusPath') throw new BmsProtocolError(`Unsupported read-only valueType: ${def.valueType}`, { def });
		const status = await this.readAllStatus();
		return getByPath(status, def.path);
	}

	async readParam(paramKey: string): Promise<unknown> {
		const key = normalizeParamKey(paramKey);
		if (!key) throw new BmsProtocolError(`Unknown parameter key: ${paramKey}`);
		const def = PARAM_DEF_BY_KEY[key];

		if (def.valueType === 'statusPath') {
			const status = await this.readAllStatus();
			return getByPath(status, def.path);
		}

		if (def.valueType === 'str') {
			const regs = await this.readRegisters(def.startAddress, Math.ceil(def.byteLength / 2));
			const view = new RegisterView(def.startAddress, regs);
			return decodeParam(def, view);
		}

		const quantity = def.valueType === 'u32' ? 2 : 1;
		const regs = await this.readRegisters(def.address, quantity);
		const view = new RegisterView(def.address, regs);
		return decodeParam(def, view);
	}

	async writeParam(paramKey: string, value: unknown, { preserveOtherByte = true }: { preserveOtherByte?: boolean } = {}): Promise<void> {
		const key = normalizeParamKey(paramKey);
		if (!key) throw new BmsProtocolError(`Unknown parameter key: ${paramKey}`);
		const def = PARAM_DEF_BY_KEY[key];
		if (def.valueType === 'statusPath') throw new BmsProtocolError(`Read-only parameter cannot be written: ${key}`, { def });
		if (def.access === 'R') throw new BmsProtocolError(`Read-only parameter cannot be written: ${key}`, { def });

		if (def.valueType === 'str') {
			const { startAddress, registerValues } = encodeStringToRegisterWrites(def.startAddress, def.byteLength, String(value ?? ''));
			await this.writeRegisters(startAddress, new Uint16Array(registerValues));
			return;
		}

		if (def.valueType === 'u32') {
			const scale = def.scale == null ? 1 : def.scale;
			const offset = def.offset == null ? 0 : def.offset;
			const raw = Math.round(((value as number) - offset) / scale) >>> 0;
			const regs = new Uint16Array([(raw >>> 16) & 0xffff, raw & 0xffff]);
			await this.writeRegisters(def.address, regs);
			return;
		}

		if (def.valueType === 'u16') {
			const scale = def.scale == null ? 1 : def.scale;
			const offset = def.offset == null ? 0 : def.offset;
			const raw = Math.round(((value as number) - offset) / scale) & 0xffff;
			await this.writeRegisters(def.address, new Uint16Array([raw]));
			return;
		}

		if (def.valueType === 'u8') {
			const scale = def.scale == null ? 1 : def.scale;
			const offset = def.offset == null ? 0 : def.offset;
			const rawByte = Math.round(((value as number) - offset) / scale) & 0xff;
			let existing = 0x0000;
			if (preserveOtherByte) {
				const reg = await this.readRegisters(def.address, 1);
				existing = reg[0] & 0xffff;
			}
			const hi = (existing >> 8) & 0xff;
			const lo = existing & 0xff;
			const newHi = def.byte === 'H' ? rawByte : hi;
			const newLo = def.byte === 'L' ? rawByte : lo;
			await this.writeRegisters(def.address, new Uint16Array([u16FromBytes(newHi, newLo)]));
			return;
		}

			const _exhaustiveCheck: never = def;
			throw new BmsProtocolError('Unsupported valueType', { def: _exhaustiveCheck });
		}

	async _getParamsByCategory(category: ParamCategory): Promise<Record<string, unknown>> {
		const defs = Object.values(PARAM_DEF_BY_KEY).filter((d) => d.category === category);
		const numericDefs = defs.filter((d) => d.valueType === 'u8' || d.valueType === 'u16' || d.valueType === 'u32');
		const out: Record<string, unknown> = {};

		if (numericDefs.length) {
			const minAddr = Math.min(...numericDefs.map((d) => d.address));
			const maxAddr = Math.max(...numericDefs.map((d) => (d.valueType === 'u32' ? d.address + 1 : d.address)));
			const regs = await this.readRegisters(minAddr, maxAddr - minAddr + 1);
			const view = new RegisterView(minAddr, regs);
			for (const d of numericDefs) {
				out[constToCamel(d.key)] = decodeParam(d, view);
			}
		}

		for (const d of defs.filter((x) => x.valueType === 'str')) {
			out[constToCamel(d.key)] = await this.readParam(d.key);
		}

		return out;
	}

	async _setParamsByCategory(
		category: ParamCategory,
		values: Record<string, unknown>,
		{ preserveOtherByte = true }: { preserveOtherByte?: boolean } = {}
	): Promise<void> {
		if (!values || typeof values !== 'object') throw new BmsProtocolError('values must be an object');

		const normalized: Array<{ def: BmsParamDef; key: string; value: unknown }> = [];
		for (const [k, v] of Object.entries(values)) {
			const key = normalizeParamKey(k);
			if (!key) throw new BmsProtocolError(`Unknown parameter key: ${k}`);
			const def = PARAM_DEF_BY_KEY[key];
			if (def.category !== category) throw new BmsProtocolError(`Parameter ${key} not in category ${category}`);
			normalized.push({ def, key, value: v });
		}

		// Handle string params directly.
		for (const item of normalized.filter((x) => x.def.valueType === 'str')) {
			await this.writeParam(item.key, item.value);
		}

		// Build register writes for numeric params.
		const regWrites = new Map<number, number>(); // address -> u16
		const byteWrites = new Map<number, { H?: number; L?: number }>(); // address -> { H?:u8, L?:u8 }
		const needRead = new Set<number>();

		for (const { def, value } of normalized.filter((x) => x.def.valueType !== 'str' && x.def.valueType !== 'statusPath')) {
			if (def.valueType === 'u16') {
				const scale = def.scale == null ? 1 : def.scale;
				const offset = def.offset == null ? 0 : def.offset;
				regWrites.set(def.address, Math.round(((value as number) - offset) / scale) & 0xffff);
			} else if (def.valueType === 'u32') {
				const scale = def.scale == null ? 1 : def.scale;
				const offset = def.offset == null ? 0 : def.offset;
				const raw = Math.round(((value as number) - offset) / scale) >>> 0;
				regWrites.set(def.address, (raw >>> 16) & 0xffff);
				regWrites.set(def.address + 1, raw & 0xffff);
			} else if (def.valueType === 'u8') {
				const scale = def.scale == null ? 1 : def.scale;
				const offset = def.offset == null ? 0 : def.offset;
				const rawByte = Math.round(((value as number) - offset) / scale) & 0xff;
				const entry = byteWrites.get(def.address) || {};
				entry[def.byte] = rawByte;
				byteWrites.set(def.address, entry);
				if (preserveOtherByte && (entry.H == null || entry.L == null)) needRead.add(def.address);
			}
		}

		if (needRead.size) {
			const ranges = groupContiguousAddresses(Array.from(needRead));
			for (const r of ranges) {
				const regs = await this.readRegisters(r.startAddress, r.quantity);
				for (let i = 0; i < regs.length; i += 1) {
					const addr = r.startAddress + i;
					const existing = regs[i] & 0xffff;
					const bytes = byteWrites.get(addr);
					if (!bytes) continue;
					if (bytes.H == null) bytes.H = (existing >> 8) & 0xff;
					if (bytes.L == null) bytes.L = existing & 0xff;
					byteWrites.set(addr, bytes);
				}
			}
		} else if (!preserveOtherByte) {
			for (const [addr, bytes] of byteWrites.entries()) {
				if (bytes.H == null) bytes.H = 0x00;
				if (bytes.L == null) bytes.L = 0x00;
				byteWrites.set(addr, bytes);
			}
		}

		for (const [addr, bytes] of byteWrites.entries()) {
			const hi = bytes.H == null ? 0x00 : bytes.H;
			const lo = bytes.L == null ? 0x00 : bytes.L;
			regWrites.set(addr, u16FromBytes(hi, lo));
		}

		if (!regWrites.size) return;

		const sortedAddrs = Array.from(regWrites.keys()).sort((a, b) => a - b);
		let i = 0;
			while (i < sortedAddrs.length) {
				let start = sortedAddrs[i];
				let end = start;
			i += 1;
			while (i < sortedAddrs.length && sortedAddrs[i] === end + 1) {
				end = sortedAddrs[i];
				i += 1;
			}
				const regs: number[] = [];
				for (let addr = start; addr <= end; addr += 1) regs.push(regWrites.get(addr) ?? 0);
				await this.writeRegisters(start, new Uint16Array(regs));
			}
		}

	getVoltageParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.VOLTAGE);
	}

	setVoltageParams(values: Record<string, unknown>, opts?: { preserveOtherByte?: boolean }) {
		return this._setParamsByCategory(PARAM_CATEGORIES.VOLTAGE, values, opts);
	}

	getCurrentParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.CURRENT);
	}

	setCurrentParams(values: Record<string, unknown>, opts?: { preserveOtherByte?: boolean }) {
		return this._setParamsByCategory(PARAM_CATEGORIES.CURRENT, values, opts);
	}

	getTemperatureParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.TEMPERATURE);
	}

	setTemperatureParams(values: Record<string, unknown>, opts?: { preserveOtherByte?: boolean }) {
		return this._setParamsByCategory(PARAM_CATEGORIES.TEMPERATURE, values, opts);
	}

	getOtherParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.OTHER);
	}

	setOtherParams(values: Record<string, unknown>, opts?: { preserveOtherByte?: boolean }) {
		return this._setParamsByCategory(PARAM_CATEGORIES.OTHER, values, opts);
	}

	getSystemParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.SYSTEM);
	}

	setSystemParams(values: Record<string, unknown>, opts?: { preserveOtherByte?: boolean }) {
		return this._setParamsByCategory(PARAM_CATEGORIES.SYSTEM, values, opts);
	}

	async configureMeterMac({ meterAddress = 0xfc, mac }: { meterAddress?: number; mac: string | Uint8Array | number[] }): Promise<void> {
		const bytes = parseMac6(mac);
		const regs = new Uint16Array([u16FromBytes(bytes[0], bytes[1]), u16FromBytes(bytes[2], bytes[3]), u16FromBytes(bytes[4], bytes[5])]);
		const req = buildWriteMultipleRegistersFrame({
			sourceAddress: this.sourceAddress,
			targetAddress: meterAddress & 0xff,
			startAddress: 0x0000,
			registerValues: regs,
		});
		const resp = await this._request(req);
		if (resp.type === 'error') throw new BmsProtocolError('BMS error response', resp);
		if (resp.type !== 'write') throw new BmsProtocolError('Unexpected response type', resp);
	}
}

function getByPath(obj: unknown, path: string): unknown {
	if (!path) return obj;
	const parts = String(path).split('.').filter(Boolean);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let cur: any = obj; // NOTE: 运行时 path 解析，无法静态约束结构
	for (const p of parts) {
		if (cur == null) return undefined;
		cur = cur[p];
	}
	return cur;
}

function parseMac6(mac: string | Uint8Array | number[]): Uint8Array {
	if (mac instanceof Uint8Array) {
		if (mac.length !== 6) throw new BmsProtocolError('mac must be 6 bytes');
		return mac;
	}
	if (Array.isArray(mac)) {
		if (mac.length !== 6) throw new BmsProtocolError('mac must be 6 bytes');
		return Uint8Array.from(mac.map((b: number) => b & 0xff));
	}
	const s = String(mac || '').trim();
	const parts = s.split(/[:-]/).filter(Boolean);
	if (parts.length !== 6) throw new BmsProtocolError('mac must be 6 bytes or "AA:BB:CC:DD:EE:FF"');
	return Uint8Array.from(parts.map((p) => parseInt(p, 16) & 0xff));
}
