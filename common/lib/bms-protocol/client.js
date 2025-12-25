import {
	BMS_FUNC,
	BMS_FRAME,
	BmsProtocolError,
	buildReadFrame,
	buildWriteMultipleRegistersFrame,
	parseFrame,
	splitIntoRegistersBE,
} from './frame.js';
import {
	PARAM_CATEGORIES,
	PARAM_DEF_BY_KEY,
	constToCamel,
	normalizeParamKey,
} from './param-registry.js';
import { RegisterView, decodeAscii, encodeAsciiFixed } from './register-view.js';
import { parseStatusRegisters } from './status-parser.js';

function chunkRanges(startAddress, quantity, maxChunk) {
	const ranges = [];
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

function groupContiguousAddresses(addresses) {
	const sorted = Array.from(new Set(addresses)).sort((a, b) => a - b);
	const ranges = [];
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

function u16FromBytes(hi, lo) {
	return ((hi & 0xff) << 8) | (lo & 0xff);
}

function decodeParam(def, view) {
	const scale = def.scale == null ? 1 : def.scale;
	const offset = def.offset == null ? 0 : def.offset;

	if (def.valueType === 'u16') {
		const raw = view.u16(def.address);
		if (raw === 0xffff) return null;
		return raw * scale + offset;
	}
	if (def.valueType === 'u32') {
		const raw = view.u32(def.address);
		if (raw === 0xffffffff) return null;
		return raw * scale + offset;
	}
	if (def.valueType === 'u8') {
		const rawByte = def.byte === 'H' ? view.byteH(def.address) : view.byteL(def.address);
		if (rawByte === 0xff) return null;
		return rawByte * scale + offset;
	}
	if (def.valueType === 'str') {
		const bytes = view.bytes(def.startAddress, def.byteLength);
		return decodeAscii(bytes);
	}
	throw new BmsProtocolError(`Unsupported valueType: ${def.valueType}`, { def });
}

function encodeStringToRegisterWrites(startAddress, byteLength, str) {
	const bytes = encodeAsciiFixed(str, byteLength);
	const regs = [];
	for (let i = 0; i < Math.ceil(byteLength / 2); i += 1) {
		const hi = bytes[i * 2] ?? 0x00;
		const lo = bytes[i * 2 + 1] ?? 0x00;
		regs.push(u16FromBytes(hi, lo));
	}
	return { startAddress, registerValues: regs };
}

export class BmsClient {
	constructor({
		transport,
		targetAddress = 0x01,
		sourceAddress = BMS_FRAME.HOST_ADDR,
		maxReadRegisters = 120,
		maxWriteRegisters = 120,
	} = {}) {
		if (!transport || typeof transport.request !== 'function') {
			throw new BmsProtocolError('transport.request(frameBytes) is required');
		}
		this.transport = transport;
		this.targetAddress = targetAddress & 0xff;
		this.sourceAddress = sourceAddress & 0xff;
		this.maxReadRegisters = maxReadRegisters;
		this.maxWriteRegisters = maxWriteRegisters;
	}

	async _request(frameBytes) {
		const respBytes = await this.transport.request(frameBytes);
		return parseFrame(respBytes);
	}

	async readRegisters(startAddress, quantity, { functionCode = BMS_FUNC.READ_HOLDING_REGISTERS } = {}) {
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

	async writeRegisters(startAddress, registerValues, { functionCode = BMS_FUNC.WRITE_MULTIPLE_REGISTERS } = {}) {
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

	async readUuid() {
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

	async syncTime(timestampSeconds = Math.floor(Date.now() / 1000)) {
		const raw = timestampSeconds >>> 0;
		const regs = new Uint16Array([(raw >>> 16) & 0xffff, raw & 0xffff]);
		await this.writeRegisters(0x57c, regs);
	}

	async readAllStatus() {
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

	async readRoParam(paramKey) {
		const key = normalizeParamKey(paramKey);
		if (!key) throw new BmsProtocolError(`Unknown parameter key: ${paramKey}`);
		const def = PARAM_DEF_BY_KEY[key];
		if (def.access !== 'R') throw new BmsProtocolError(`Not a read-only parameter: ${key}`, { def });
		if (def.valueType !== 'statusPath') throw new BmsProtocolError(`Unsupported read-only valueType: ${def.valueType}`, { def });
		const status = await this.readAllStatus();
		return getByPath(status, def.path);
	}

	async readParam(paramKey) {
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

	async writeParam(paramKey, value, { preserveOtherByte = true } = {}) {
		const key = normalizeParamKey(paramKey);
		if (!key) throw new BmsProtocolError(`Unknown parameter key: ${paramKey}`);
		const def = PARAM_DEF_BY_KEY[key];
		if (def.access === 'R') throw new BmsProtocolError(`Read-only parameter cannot be written: ${key}`, { def });
		if (def.valueType === 'statusPath') throw new BmsProtocolError(`Read-only parameter cannot be written: ${key}`, { def });

		if (def.valueType === 'str') {
			const { startAddress, registerValues } = encodeStringToRegisterWrites(def.startAddress, def.byteLength, value);
			await this.writeRegisters(startAddress, new Uint16Array(registerValues));
			return;
		}

		if (def.valueType === 'u32') {
			const scale = def.scale == null ? 1 : def.scale;
			const offset = def.offset == null ? 0 : def.offset;
			const raw = Math.round((value - offset) / scale) >>> 0;
			const regs = new Uint16Array([(raw >>> 16) & 0xffff, raw & 0xffff]);
			await this.writeRegisters(def.address, regs);
			return;
		}

		if (def.valueType === 'u16') {
			const scale = def.scale == null ? 1 : def.scale;
			const offset = def.offset == null ? 0 : def.offset;
			const raw = Math.round((value - offset) / scale) & 0xffff;
			await this.writeRegisters(def.address, new Uint16Array([raw]));
			return;
		}

		if (def.valueType === 'u8') {
			const scale = def.scale == null ? 1 : def.scale;
			const offset = def.offset == null ? 0 : def.offset;
			const rawByte = Math.round((value - offset) / scale) & 0xff;
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

		throw new BmsProtocolError(`Unsupported valueType: ${def.valueType}`, { def });
	}

	async _getParamsByCategory(category) {
		const defs = Object.values(PARAM_DEF_BY_KEY).filter((d) => d.category === category);
		const numericDefs = defs.filter((d) => d.valueType !== 'str');
		const out = {};

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

	async _setParamsByCategory(category, values, { preserveOtherByte = true } = {}) {
		if (!values || typeof values !== 'object') throw new BmsProtocolError('values must be an object');

		const normalized = [];
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
		const regWrites = new Map(); // address -> u16
		const byteWrites = new Map(); // address -> { H?:u8, L?:u8 }
		const needRead = new Set();

		for (const { def, value } of normalized.filter((x) => x.def.valueType !== 'str')) {
			if (def.valueType === 'u16') {
				const scale = def.scale == null ? 1 : def.scale;
				const offset = def.offset == null ? 0 : def.offset;
				regWrites.set(def.address, Math.round((value - offset) / scale) & 0xffff);
			} else if (def.valueType === 'u32') {
				const scale = def.scale == null ? 1 : def.scale;
				const offset = def.offset == null ? 0 : def.offset;
				const raw = Math.round((value - offset) / scale) >>> 0;
				regWrites.set(def.address, (raw >>> 16) & 0xffff);
				regWrites.set(def.address + 1, raw & 0xffff);
			} else if (def.valueType === 'u8') {
				const scale = def.scale == null ? 1 : def.scale;
				const offset = def.offset == null ? 0 : def.offset;
				const rawByte = Math.round((value - offset) / scale) & 0xff;
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
			const regs = [];
			for (let addr = start; addr <= end; addr += 1) regs.push(regWrites.get(addr));
			await this.writeRegisters(start, new Uint16Array(regs));
		}
	}

	getVoltageParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.VOLTAGE);
	}

	setVoltageParams(values, opts) {
		return this._setParamsByCategory(PARAM_CATEGORIES.VOLTAGE, values, opts);
	}

	getCurrentParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.CURRENT);
	}

	setCurrentParams(values, opts) {
		return this._setParamsByCategory(PARAM_CATEGORIES.CURRENT, values, opts);
	}

	getTemperatureParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.TEMPERATURE);
	}

	setTemperatureParams(values, opts) {
		return this._setParamsByCategory(PARAM_CATEGORIES.TEMPERATURE, values, opts);
	}

	getOtherParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.OTHER);
	}

	setOtherParams(values, opts) {
		return this._setParamsByCategory(PARAM_CATEGORIES.OTHER, values, opts);
	}

	getSystemParams() {
		return this._getParamsByCategory(PARAM_CATEGORIES.SYSTEM);
	}

	setSystemParams(values, opts) {
		return this._setParamsByCategory(PARAM_CATEGORIES.SYSTEM, values, opts);
	}

	async configureMeterMac({ meterAddress = 0xfc, mac }) {
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

function getByPath(obj, path) {
	if (!path) return obj;
	const parts = String(path).split('.').filter(Boolean);
	let cur = obj;
	for (const p of parts) {
		if (cur == null) return undefined;
		cur = cur[p];
	}
	return cur;
}

function parseMac6(mac) {
	if (mac instanceof Uint8Array) {
		if (mac.length !== 6) throw new BmsProtocolError('mac must be 6 bytes');
		return mac;
	}
	if (Array.isArray(mac)) {
		if (mac.length !== 6) throw new BmsProtocolError('mac must be 6 bytes');
		return Uint8Array.from(mac.map((b) => b & 0xff));
	}
	const s = String(mac || '').trim();
	const parts = s.split(/[:-]/).filter(Boolean);
	if (parts.length !== 6) throw new BmsProtocolError('mac must be 6 bytes or "AA:BB:CC:DD:EE:FF"');
	return Uint8Array.from(parts.map((p) => parseInt(p, 16) & 0xff));
}
