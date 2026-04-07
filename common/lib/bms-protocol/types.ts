export type Byte = number
export type ByteArrayLike = ArrayLike<Byte>
export type ByteArray = Uint8Array | ByteArrayLike

export type AccessMode = 'R' | 'RW'

export type ParamValueType = 'u8' | 'u16' | 'u32' | 'str' | 'statusPath'
export type ByteSelector = 'H' | 'L'

export type LoggerLike = {
	debug?: (...args: unknown[]) => void
	info?: (...args: unknown[]) => void
	warn?: (...args: unknown[]) => void
	error?: (...args: unknown[]) => void
}

export type BmsRequestOptions = {
	timeoutMs?: number
}

export type BmsTransportRequest = (frameBytes: Uint8Array, options?: BmsRequestOptions) => Promise<Uint8Array> | Uint8Array

export interface BmsRequestTransport {
	request: BmsTransportRequest
}

export type BmsParamDefBase = {
	key: string
	category: string
	label: string
	access: AccessMode
	unit?: string
	functionCode?: number
	targetAddress?: number
}

export type BmsStatusPathParamDef = BmsParamDefBase & {
	valueType: 'statusPath'
	path: string
	access: 'R'
}

export type BmsU16ParamDef = BmsParamDefBase & {
	valueType: 'u16'
	address: number
	scale?: number
	offset?: number
}

export type BmsU32ParamDef = BmsParamDefBase & {
	valueType: 'u32'
	address: number
	scale?: number
	offset?: number
}

export type BmsU8ParamDef = BmsParamDefBase & {
	valueType: 'u8'
	address: number
	byte: ByteSelector
	scale?: number
	offset?: number
}

export type BmsStrParamDef = BmsParamDefBase & {
	valueType: 'str'
	startAddress: number
	byteLength: number
	encoding?: 'ascii'
}

export type BmsParamDef = BmsStatusPathParamDef | BmsU16ParamDef | BmsU32ParamDef | BmsU8ParamDef | BmsStrParamDef

export type BmsStatus = {
	meta: {
		seriesCount: number
		cellTempCount: number
		hardwareVersion: number
		softwareVersion: number
		specialId: number
		protocolVersion: number
		productionDate: {
			raw: number
			year: number
			month: number
			day: number
		}
	}
	energy: {
		designCapacityMah: number
		remainingCapacityMah: number
		fullCapacityMah: number
		fullWh: number
		remainingWh: number
		socPct: number
		sohPct: number
		cycleCount: number
		totalChargeCapacityRaw: number
		totalDischargeCapacityRaw: number
	}
	timing: {
		maxChargeIntervalHours: number
		currentChargeIntervalHours: number
		dischargeRemainingMin: number
		chargeRemainingMin: number
		chargeCount: number
		dischargeCount: number
		bmsTimestamp: number
		powerOnWorkHours: number
	}
	electrical: {
		packCellSumVoltageV: number
		vBatV: number
		vPackV: number
		vLoadV: number
		currentA: number
		highestCellVoltageMv: number
		lowestCellVoltageMv: number
		avgCellVoltageMv: number
		maxCellVoltageDiffMv: number
		cellVoltageIndex: {
			highest: number
			lowest: number
		}
	}
	temperature: {
		chargeMosC: number | null
		dischargeMosC: number | null
		prechargeMosC: number | null
		ambientC: number | null
		heatingFilmC: number | null
		poleC: number | null
		highestTemp: { index: number; valueC: number | null }
		lowestTemp: { index: number; valueC: number | null }
		cellTempsC: Array<number | null>
	}
	cell: {
		voltagesMv: number[]
		balancing: boolean[]
	}
	status: {
		protectionStatus: Record<string, boolean>
		failureStatus: Record<string, boolean>
		indicatorStatus: Record<string, boolean>
		alarmStatus: Record<string, boolean>
		customStatus: number
	}
	identity: {
		hardwareModel: string
		batteryGroupId: string
		boardCode: string
		bluetoothMac: string | null
	}
	customParams: number[]
}

export type BmsHistoryProtectionCounters = {
	protocolVersion: number
	currentRecordAddress: number
	currentRecordCount: number
	chargeHighTempCount: number
	chargeLowTempCount: number
	dischargeHighTempCount: number
	dischargeLowTempCount: number
	mosHighTempCount: number
	softOverChargeCount: number
	softOverDischargeCount: number
	packOverVoltageCount: number
	packOverDischargeCount: number
	fullChargeCount: number
	hardOverChargeCount: number
	hardOverDischargeCount: number
	softChargeOverCurrentCount: number
	softDischargeOverCurrentCount: number
	hardOverCurrentCount: number
	hardShortCircuitCount: number
	lowVoltagePowerOffCount: number
	autoPowerOffCount: number
	keyPowerOffCount: number
	resetCount: number
	totalDischargeSeconds: number
	totalChargeSeconds: number
}

export type BmsHistoryStatusFlagMap = Record<string, boolean>

export type BmsHistoryStatusFlags = {
	voltage: BmsHistoryStatusFlagMap
	current: BmsHistoryStatusFlagMap
	temperature: BmsHistoryStatusFlagMap
	chargeDischarge: BmsHistoryStatusFlagMap
}

export type BmsHistoryStatusRecord = {
	protocolVersion: number
	index: number
	time: {
		year: number
		month: number
		day: number
		hour: number
		minute: number
		second: number
	}
	totalVoltageV: number
	lowestVoltageMv: number
	highestVoltageMv: number
	currentA: number
	lowestCellTempC: number | null
	highestCellTempC: number | null
	socPct: number
	remainingCapacityMah: number
	cycleCount: number
	flags: BmsHistoryStatusFlags
	logCode: number
	sohPct: number
	mosTempC: number | null
	lowestVoltageCellIndex: number
	highestVoltageCellIndex: number
}
