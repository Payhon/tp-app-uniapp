import { BmsProtocolError } from './frame'
import type { BmsHistoryProtectionCounters, BmsHistoryStatusFlagMap, BmsHistoryStatusFlags, BmsHistoryStatusRecord } from './types'

function readU16BE(bytes: Uint8Array, offset: number): number {
	return ((bytes[offset] & 0xff) << 8) | (bytes[offset + 1] & 0xff)
}

function readI16BE(bytes: Uint8Array, offset: number): number {
	const raw = readU16BE(bytes, offset)
	return raw & 0x8000 ? raw - 0x10000 : raw
}

function readU32BE(bytes: Uint8Array, offset: number): number {
	return (
		((bytes[offset] & 0xff) * 0x1000000) +
		((bytes[offset + 1] & 0xff) << 16) +
		((bytes[offset + 2] & 0xff) << 8) +
		(bytes[offset + 3] & 0xff)
	)
}

function bcdToInt(v: number): number {
	return ((v >> 4) & 0x0f) * 10 + (v & 0x0f)
}

function decodeTempC(raw: number): number | null {
	if (raw === 0xff) return null
	return raw - 40
}

function decodeBitField8(v: number, mapping: Record<number, string>): BmsHistoryStatusFlagMap {
	const out: BmsHistoryStatusFlagMap = {}
	for (const [bit, name] of Object.entries(mapping)) {
		out[name] = !!(v & (1 << Number(bit)))
	}
	return out
}

const HISTORY_VOLTAGE_BITS = Object.freeze({
	0: 'packUnderVoltageRecovery',
	1: 'cellUnderVoltageRecovery',
	2: 'packOverVoltageRecovery',
	3: 'cellOverVoltageRecovery',
	4: 'packUnderVoltageProtection',
	5: 'cellUnderVoltageProtection',
	6: 'packOverVoltageProtection',
	7: 'cellOverVoltageProtection',
})

const HISTORY_CURRENT_BITS = Object.freeze({
	2: 'shortCircuitRecovery',
	3: 'dischargeOverCurrentRecovery',
	4: 'chargeOverCurrentRecovery',
	5: 'shortCircuitProtection',
	6: 'dischargeOverCurrentProtection',
	7: 'chargeOverCurrentProtection',
})

const HISTORY_TEMPERATURE_BITS = Object.freeze({
	0: 'fullChargeRecovery',
	1: 'fullChargeProtection',
	2: 'mosOverTempRecovery',
	3: 'mosOverTempProtection',
	4: 'dischargeOverTempRecovery',
	5: 'chargeOverTempRecovery',
	6: 'dischargeOverTempProtection',
	7: 'chargeOverTempProtection',
})

const HISTORY_CHARGE_DISCHARGE_BITS = Object.freeze({
	6: 'discharging',
	7: 'charging',
})

export function parseHistoryProtectionPayload(data: Uint8Array): BmsHistoryProtectionCounters | null {
	if (data.length === 1 && data[0] === 0xff) return null
	if (data.length < 53) {
		throw new BmsProtocolError('History protection payload length mismatch', { length: data.length })
	}
	const protocolVersion = data[0] & 0xff
	const payload = data.slice(1)
	return {
		protocolVersion,
		currentRecordAddress: readU16BE(payload, 0),
		currentRecordCount: readU16BE(payload, 2),
		chargeHighTempCount: readU16BE(payload, 4),
		chargeLowTempCount: readU16BE(payload, 6),
		dischargeHighTempCount: readU16BE(payload, 8),
		dischargeLowTempCount: readU16BE(payload, 10),
		mosHighTempCount: readU16BE(payload, 12),
		softOverChargeCount: readU16BE(payload, 14),
		softOverDischargeCount: readU16BE(payload, 16),
		packOverVoltageCount: readU16BE(payload, 18),
		packOverDischargeCount: readU16BE(payload, 20),
		fullChargeCount: readU16BE(payload, 22),
		hardOverChargeCount: readU16BE(payload, 24),
		hardOverDischargeCount: readU16BE(payload, 26),
		softChargeOverCurrentCount: readU16BE(payload, 28),
		softDischargeOverCurrentCount: readU16BE(payload, 30),
		hardOverCurrentCount: readU16BE(payload, 32),
		hardShortCircuitCount: readU16BE(payload, 34),
		lowVoltagePowerOffCount: readU16BE(payload, 36),
		autoPowerOffCount: readU16BE(payload, 38),
		keyPowerOffCount: readU16BE(payload, 40),
		resetCount: readU16BE(payload, 42),
		totalDischargeSeconds: readU32BE(payload, 44),
		totalChargeSeconds: readU32BE(payload, 48),
	}
}

function parseHistoryStatusFlags(bytes: Uint8Array): BmsHistoryStatusFlags {
	return {
		voltage: decodeBitField8(bytes[23] & 0xff, HISTORY_VOLTAGE_BITS),
		current: decodeBitField8(bytes[24] & 0xff, HISTORY_CURRENT_BITS),
		temperature: decodeBitField8(bytes[25] & 0xff, HISTORY_TEMPERATURE_BITS),
		chargeDischarge: decodeBitField8(bytes[26] & 0xff, HISTORY_CHARGE_DISCHARGE_BITS),
	}
}

function parseHistoryStatusRecord(bytes: Uint8Array, protocolVersion: number, index: number): BmsHistoryStatusRecord {
	if (bytes.length !== 32) {
		throw new BmsProtocolError('History status record length mismatch', { length: bytes.length })
	}
	const year = 2000 + bcdToInt(bytes[0] & 0xff)
	const month = bcdToInt(bytes[1] & 0xff)
	const day = bcdToInt(bytes[2] & 0xff)
	const hour = bcdToInt(bytes[3] & 0xff)
	const minute = bcdToInt(bytes[4] & 0xff)
	const second = bcdToInt(bytes[5] & 0xff)
	return {
		protocolVersion,
		index,
		time: {
			year,
			month,
			day,
			hour,
			minute,
			second,
		},
		totalVoltageV: readU16BE(bytes, 6) * 0.01,
		lowestVoltageMv: readU16BE(bytes, 8),
		highestVoltageMv: readU16BE(bytes, 10),
		currentA: readI16BE(bytes, 12) * 0.01,
		lowestCellTempC: decodeTempC(bytes[14] & 0xff),
		highestCellTempC: decodeTempC(bytes[15] & 0xff),
		socPct: bytes[16] & 0xff,
		remainingCapacityMah: readU32BE(bytes, 17),
		cycleCount: readU16BE(bytes, 21),
		flags: parseHistoryStatusFlags(bytes),
		logCode: bytes[27] & 0xff,
		sohPct: bytes[28] & 0xff,
		mosTempC: decodeTempC(bytes[29] & 0xff),
		lowestVoltageCellIndex: bytes[30] & 0xff,
		highestVoltageCellIndex: bytes[31] & 0xff,
	}
}

export function parseHistoryStatusPayload(data: Uint8Array, startIndex: number): BmsHistoryStatusRecord[] | null {
	if (data.length === 1 && data[0] === 0xff) return null
	if (data.length < 1) throw new BmsProtocolError('History status payload empty')
	const protocolVersion = data[0] & 0xff
	const payload = data.slice(1)
	if (payload.length % 32 !== 0) {
		throw new BmsProtocolError('History status payload length mismatch', { length: payload.length })
	}
	const out: BmsHistoryStatusRecord[] = []
	for (let offset = 0; offset < payload.length; offset += 32) {
		out.push(parseHistoryStatusRecord(payload.slice(offset, offset + 32), protocolVersion, startIndex + offset / 32))
	}
	return out
}
