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
import type { BmsParamDef, BmsRequestTransport, BmsStatus, LoggerLike } from './types'

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

function bytesToHex(bytes: Uint8Array): string {
	let out = '';
	for (let i = 0; i < bytes.length; i += 1) out += (bytes[i] & 0xff).toString(16).padStart(2, '0');
	return out.toUpperCase();
}

function allSame(bytes: Uint8Array, v: number): boolean {
	for (let i = 0; i < bytes.length; i += 1) if ((bytes[i] & 0xff) !== (v & 0xff)) return false;
	return true;
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
	private logger?: LoggerLike

	constructor({
		transport,
		targetAddress = 0x01,
		sourceAddress = BMS_FRAME.HOST_ADDR,
		maxReadRegisters = 120,
		maxWriteRegisters = 120,
		logger,
	}: {
		transport: BmsRequestTransport
		targetAddress?: number
		sourceAddress?: number
		maxReadRegisters?: number
		maxWriteRegisters?: number
		logger?: LoggerLike
	}) {
		if (!transport || typeof transport.request !== 'function') {
			throw new BmsProtocolError('transport.request(frameBytes) is required');
		}
		this.transport = transport;
		this.targetAddress = targetAddress & 0xff;
		this.sourceAddress = sourceAddress & 0xff;
		this.maxReadRegisters = maxReadRegisters;
		this.maxWriteRegisters = maxWriteRegisters;
		this.logger = logger;
	}

	private _debug(...args: unknown[]) {
		if (this.logger && this.logger.debug) this.logger.debug(...args);
	}

	private async _request(frameBytes: Uint8Array): Promise<BmsParsedFrame> {
		const respBytes = await this.transport.request(frameBytes);
		return parseFrame(respBytes);
	}

	/**
	 * 读取电池串数/电芯温度数量（0x100，高字节=S，低字节=N）
	 */
	async readSn(): Promise<{ s: number; n: number; word: number }> {
		const head = await this.readRegisters(0x100, 1);
		const word = head[0] & 0xffff;
		const s = (word >> 8) & 0xff;
		const n = word & 0xff;
		this._debug('[bms]', '[bms] SN', { s, n, word: `0x${word.toString(16)}` });
		return { s, n, word };
	}

	private _computeIdentityAddresses({ s, n }: { s: number; n: number }) {
		const cellVoltagesStart = 0x141;
		const cellTempsStart = cellVoltagesStart + s;
		const hwModelStart = cellTempsStart + n;
		const batteryGroupIdStart = hwModelStart + 16;
		const boardCodeStart = batteryGroupIdStart + 16;
		const bluetoothMacStart = boardCodeStart + 16;
		return { cellVoltagesStart, cellTempsStart, hwModelStart, batteryGroupIdStart, boardCodeStart, bluetoothMacStart };
	}

	/**
	 * 按协议“动态地址”读取设备身份信息（硬件型号/电池组编号/BMS板编码/蓝牙MAC）。
	 *
	 * 注意：这些字段位于状态寄存器的变长区，需要先读取 0x100 得到 S/N 后再计算地址。
	 * 参考：doc/oriigin/device_comm_protocol_basic.md（补充说明）
	 */
	async readIdentityInfo(): Promise<{
		s: number
		n: number
		hardwareModel: string | null
		batteryGroupId: string | null
		boardCode: string | null
		bluetoothMacHex: string | null
	}> {
		const { s, n } = await this.readSn();
		const { hwModelStart, batteryGroupIdStart, boardCodeStart, bluetoothMacStart } = this._computeIdentityAddresses({ s, n });
		this._debug('[bms]', '[bms] identity address', {
			s,
			n,
			hwModelStart: `0x${hwModelStart.toString(16)}`,
			batteryGroupIdStart: `0x${batteryGroupIdStart.toString(16)}`,
			boardCodeStart: `0x${boardCodeStart.toString(16)}`,
			bluetoothMacStart: `0x${bluetoothMacStart.toString(16)}`,
		});

		// 32B + 32B + 32B + 10B = 53 regs
		const quantity = 16 + 16 + 16 + 5;
		const regs = await this.readRegisters(hwModelStart, quantity);
		const view = new RegisterView(hwModelStart, regs);

		const hwBytes = view.bytes(hwModelStart, 32);
		const groupBytes = view.bytes(batteryGroupIdStart, 32);
		const boardBytes = view.bytes(boardCodeStart, 32);
		const macBytes10 = view.bytes(bluetoothMacStart, 10);

		const hwRaw = decodeAscii(hwBytes).trim();
		const groupRaw = decodeAscii(groupBytes).trim();
		const boardRaw = decodeAscii(boardBytes).trim();

		const hardwareModel = hwRaw ? hwRaw : null;
		const batteryGroupId = groupRaw ? groupRaw : null;
		const boardCode = boardRaw ? boardRaw : null;

		let bluetoothMacHex: string | null = null;
		if (!allSame(macBytes10, 0x00) && !allSame(macBytes10, 0xff)) {
			const mac6 = macBytes10.slice(0, 6);
			if (!allSame(mac6, 0x00) && !allSame(mac6, 0xff)) bluetoothMacHex = bytesToHex(mac6);
		}

		this._debug('[bms]', '[bms] identity raw', {
			start: `0x${hwModelStart.toString(16)}`,
			hex: bytesToHex(view.bytes(hwModelStart, quantity * 2)),
		});
		this._debug('[bms]', '[bms] identity parsed', { s, n, hardwareModel, batteryGroupId, boardCode, bluetoothMacHex });

		return { s, n, hardwareModel, batteryGroupId, boardCode, bluetoothMacHex };
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
		const { s, n } = await this.readSn();
		const cellVoltagesStart = 0x141;
		const macStart = cellVoltagesStart + s + n + 16 + 16 + 16;
		const macRegs = 5; // 10 bytes
		const lastAddr = macStart + macRegs - 1;
		const totalRegs = lastAddr - 0x100 + 1;
		const regs = await this.readRegisters(0x100, totalRegs);
		return parseStatusRegisters({ startAddress: 0x100, registers: regs });
	}

	/**
	 * 读取“蓝牙 MAC 地址”（状态区动态地址，10 bytes，通常前 6 bytes 有效）
	 * 返回 12 位 HEX（不含分隔符），便于与页面/后端字段对齐。
	 *
	 * 用途：向导页不需要读取整段 status（大包易超时），只取 MAC 做展示/扫码校验即可。
	 */
	async readBluetoothMacHex(): Promise<string | null> {
		const { s, n } = await this.readSn();
		const { bluetoothMacStart } = this._computeIdentityAddresses({ s, n });
		const regs = await this.readRegisters(bluetoothMacStart, 5);
		const view = new RegisterView(bluetoothMacStart, regs);
		const bytes10 = view.bytes(bluetoothMacStart, 10);
		if (allSame(bytes10, 0x00) || allSame(bytes10, 0xff)) return null;
		const mac6 = bytes10.slice(0, 6);
		if (allSame(mac6, 0x00) || allSame(mac6, 0xff)) return null;
		return bytesToHex(mac6);
	}

	/**
	 * 读取任意寄存器范围，并按 PARAM_DEF_BY_KEY（PARAM_DEFS）语义化解析。
	 *
	 * 返回对象的 key 使用 param-registry.ts 中定义的变量名（SCREAMING_SNAKE_CASE -> camelCase）。
	 * 只解析“完全落在请求范围内”的参数（避免半截 u32 / str 造成误读）。
	 */
	async readParamsByAddressRange(startAddress: number, quantity: number): Promise<Record<string, unknown>> {
		const regs = await this.readRegisters(startAddress, quantity);
		return this.decodeParamsByAddressRange(startAddress, regs);
	}

	decodeParamsByAddressRange(startAddress: number, registers: Uint16Array): Record<string, unknown> {
		const quantity = registers.length;
		const rangeStart = startAddress;
		const rangeEnd = startAddress + quantity - 1;
		const view = new RegisterView(startAddress, registers);
		const out: Record<string, unknown> = {};

		const defs = Object.values(PARAM_DEF_BY_KEY).filter((d) => d.valueType !== 'statusPath') as DecodableParamDef[];
		for (const def of defs) {
			if (def.valueType === 'str') {
				const start = def.startAddress;
				const end = def.startAddress + Math.ceil(def.byteLength / 2) - 1;
				if (start < rangeStart || end > rangeEnd) continue;
				out[constToCamel(def.key)] = decodeParam(def, view);
				continue;
			}
			if (def.valueType === 'u32') {
				const start = def.address;
				const end = def.address + 1;
				if (start < rangeStart || end > rangeEnd) continue;
				out[constToCamel(def.key)] = decodeParam(def, view);
				continue;
			}
			// u8 / u16
			const addr = def.address;
			if (addr < rangeStart || addr > rangeEnd) continue;
			out[constToCamel(def.key)] = decodeParam(def, view);
		}

		return out;
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
