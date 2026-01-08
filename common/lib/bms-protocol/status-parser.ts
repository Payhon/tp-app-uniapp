import { RegisterView, decodeAscii } from './register-view'
import type { BmsStatus } from './types'

function decodeTempCFromOffset(rawByte: number, offset = -40): number | null {
	if (rawByte === 0xff) return null;
	return rawByte + offset;
}

function decodeBmsCellTempCFromKelvin10(rawU16: number): number | null {
	// Doc: 25°C => 250 + 2731 (i.e. (C*10) + 2731)
	if (rawU16 === 0xffff) return null;
	return (rawU16 - 2731) / 10;
}

function bytesToHex(bytes: Uint8Array, sep = ''): string {
	let s = '';
	for (let i = 0; i < bytes.length; i += 1) {
		const b = bytes[i] & 0xff;
		s += b.toString(16).padStart(2, '0');
		if (sep && i !== bytes.length - 1) s += sep;
	}
	return s;
}

function allSame(bytes: Uint8Array, v: number): boolean {
	for (let i = 0; i < bytes.length; i += 1) if (bytes[i] !== v) return false;
	return true;
}

function decodeBitField32(u32: number, mapping: Record<number, string>): Record<string, boolean> {
	const out: Record<string, boolean> = {};
	for (const [bit, name] of Object.entries(mapping)) {
		out[name] = !!(u32 & (1 << Number(bit)));
	}
	return out;
}

const PROTECTION_BITS = Object.freeze({
	0: 'chargeMosFault',
	1: 'dischargeMosFault',
	2: 'poleTempOverTempProtection',
	3: 'antiReverseMosFault',
	4: 'chargeOverCurrentProtectionLv1',
	5: 'dischargeOverCurrentProtectionLv1',
	6: 'shortCircuitProtection',
	7: 'insulationProtection',
	8: 'cellOverVoltageProtectionLv2',
	9: 'cellUnderVoltageProtectionLv2',
	14: 'ambientNtcInvalid',
	18: 'chargeLowTempProtectionCell',
	19: 'dischargeLowTempProtectionCell',
	20: 'cellUnderTempProtection',
	21: 'cellOverTempProtection',
	23: 'dischargeMosOverTempProtection',
	24: 'chargeMosOverTempProtection',
	25: 'fullChargeProtection',
	26: 'deltaVProtection',
	27: 'tempDiffProtection',
	28: 'heatingFilmTempProtection',
	29: 'packUnderVoltageProtection',
	30: 'packOverVoltageProtection',
});

const INDICATOR_BITS = Object.freeze({
	0: 'discharging',
	1: 'charging',
	3: 'feedbackCharging',
	4: 'chargeCurrentLimited',
	5: 'dischargeCurrentLimited',
	6: 'chargeFetOn',
	7: 'dischargeFetOn',
	8: 'prechargeFetOn',
	9: 'antiReverseFetOn',
	12: 'commDcdcOutputOn',
	13: 'vibrationSensorOn',
	16: 'chargerDeltaVDetectOn',
	17: 'gpsPowerOn',
	18: 'heatingFilmOn',
	19: 'chargeHandshakeOk',
	20: 'dischargeHandshakeOk',
	23: 'cinPlusConnected',
	26: 'dtedConnected',
	28: 'boardRegistered',
	29: 'voltageCalibrating',
	30: 'zeroCurrentCalibrating',
	31: 'multiCurrentCalibrating',
});

const ALARM_BITS = Object.freeze({
	0: 'chargeHighTempAlarmCell',
	1: 'dischargeOrIdleHighTempAlarmCell',
	2: 'chargeLowTempAlarmCell',
	3: 'dischargeOrIdleLowTempAlarmCell',
	4: 'thermalRunawayAlarm',
	5: 'ambientHighTempAlarm',
	6: 'ambientLowTempAlarm',
	7: 'dischargeMosHighTempAlarm',
	8: 'chargeMosHighTempAlarm',
	9: 'lowSocAlarm',
	10: 'cellOverVoltageAlarm',
	11: 'cellUnderVoltageAlarm',
	12: 'packOverVoltageAlarm',
	13: 'packUnderVoltageAlarm',
	14: 'chargeOverCurrentAlarm',
	15: 'dischargeOverCurrentAlarm',
	16: 'deltaVAlarm',
	17: 'tempDiffAlarm',
	18: 'insulationAlarm',
});

export function parseStatusRegisters({
	startAddress = 0x100,
	registers,
}: {
	startAddress?: number
	registers: Uint16Array
}): BmsStatus {
	const view = new RegisterView(startAddress, registers);
	const s = view.byteH(0x100);
	const n = view.byteL(0x100);

	const hwVersionRaw = view.byteH(0x101);
	const swVersionRaw = view.byteL(0x101);

	const packCurrentA = view.i32(0x119) * 0.0001; // 0.1mA/bit

	const highestTemp = {
		index: view.byteH(0x126),
		valueC: decodeTempCFromOffset(view.byteL(0x126)),
	};
	const lowestTemp = {
		index: view.byteH(0x127),
		valueC: decodeTempCFromOffset(view.byteL(0x127)),
	};

	const cellVoltageIndex = {
		highest: view.byteH(0x128),
		lowest: view.byteL(0x128),
	};

	const protectionStatus = decodeBitField32(view.u32(0x12d), PROTECTION_BITS);
	const indicatorStatus = decodeBitField32(view.u32(0x132), INDICATOR_BITS);
	const alarmStatus = decodeBitField32(view.u32(0x134), ALARM_BITS);

	const productionDateRaw = view.u16(0x138);
	const productionDate = {
		raw: productionDateRaw,
		year: (productionDateRaw >> 9) & 0x7f,
		month: (productionDateRaw >> 5) & 0x0f,
		day: productionDateRaw & 0x1f,
	};

	// Fixed region ends at 0x140 (customParams[8] occupies 0x139~0x140)
		const customParams: number[] = [];
		for (let i = 0; i < 8; i += 1) customParams.push(view.u16(0x139 + i));

	const cellVoltagesStart = 0x141;
	const cellTempsStart = cellVoltagesStart + s;
	const hwModelStart = cellTempsStart + n;
	const batteryGroupIdStart = hwModelStart + 16;
	const boardCodeStart = batteryGroupIdStart + 16;
	const macStart = boardCodeStart + 16;

		const cellVoltagesMv: number[] = [];
		for (let i = 0; i < s; i += 1) cellVoltagesMv.push(view.u16(cellVoltagesStart + i));

		const cellTempsC: Array<number | null> = [];
		for (let i = 0; i < n; i += 1) cellTempsC.push(decodeBmsCellTempCFromKelvin10(view.u16(cellTempsStart + i)));

	const hwModel = decodeAscii(view.bytes(hwModelStart, 32));
	const batteryGroupId = decodeAscii(view.bytes(batteryGroupIdStart, 32));
	const boardCode = decodeAscii(view.bytes(boardCodeStart, 32));

	const macBytes = view.bytes(macStart, 10);
	const bluetoothMac = allSame(macBytes, 0x00) || allSame(macBytes, 0xff) ? null : bytesToHex(macBytes, ':');

	const balanceWord1 = view.u16(0x11b);
	const balanceWord2 = view.u16(0x11c);
		const balanceBits: boolean[] = [];
		for (let i = 0; i < 16; i += 1) balanceBits[i] = !!(balanceWord1 & (1 << i));
		for (let i = 0; i < 16; i += 1) balanceBits[i + 16] = !!(balanceWord2 & (1 << i));

	return {
		meta: {
			seriesCount: s,
			cellTempCount: n,
			hardwareVersion: hwVersionRaw / 10,
			softwareVersion: swVersionRaw / 10,
			specialId: view.byteH(0x102),
			protocolVersion: view.byteL(0x102),
			productionDate,
		},
		energy: {
			designCapacityMah: view.u32(0x103),
			remainingCapacityMah: view.u32(0x105),
			fullCapacityMah: view.u32(0x107),
			fullWh: view.u32(0x109) * 0.1,
			remainingWh: view.u32(0x10b) * 0.1,
			socPct: view.byteH(0x10d) * 0.5,
			sohPct: view.byteL(0x10d) * 1,
			cycleCount: view.u16(0x10e),
			totalChargeCapacityRaw: view.u32(0x12b),
		},
		timing: {
			maxChargeIntervalHours: view.u16(0x10f),
			currentChargeIntervalHours: view.u16(0x110),
			dischargeRemainingMin: view.u16(0x111),
			chargeRemainingMin: view.u16(0x112),
			chargeCount: view.u16(0x113),
			dischargeCount: view.u16(0x114),
			bmsTimestamp: view.u32(0x120),
			powerOnWorkHours: view.u32(0x129),
		},
		electrical: {
			packCellSumVoltageV: view.u16(0x115) * 0.1,
			vBatV: view.u16(0x116) * 0.1,
			vPackV: view.u16(0x117) * 0.1,
			vLoadV: view.u16(0x118) * 0.1,
			currentA: packCurrentA,
			highestCellVoltageMv: view.u16(0x122),
			lowestCellVoltageMv: view.u16(0x123),
			avgCellVoltageMv: view.u16(0x124),
			maxCellVoltageDiffMv: view.u16(0x125),
			cellVoltageIndex,
		},
		temperature: {
			chargeMosC: decodeTempCFromOffset(view.byteH(0x11d)),
			dischargeMosC: decodeTempCFromOffset(view.byteL(0x11d)),
			prechargeMosC: decodeTempCFromOffset(view.byteH(0x11e)),
			ambientC: decodeTempCFromOffset(view.byteL(0x11e)),
			heatingFilmC: decodeTempCFromOffset(view.byteH(0x11f)),
			poleC: decodeTempCFromOffset(view.byteL(0x11f)),
			highestTemp,
			lowestTemp,
			cellTempsC,
		},
		cell: {
			voltagesMv: cellVoltagesMv,
			balancing: balanceBits.slice(0, Math.min(32, s)),
		},
		status: {
			protectionStatus,
			indicatorStatus,
			alarmStatus,
			customStatus: view.u32(0x136),
		},
		identity: {
			hardwareModel: hwModel,
			batteryGroupId,
			boardCode,
			bluetoothMac,
		},
		customParams,
	};
}
