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

export type BmsTransportRequest = (frameBytes: Uint8Array) => Promise<Uint8Array> | Uint8Array

export interface BmsRequestTransport {
	request: BmsTransportRequest
}

export type BmsParamDefBase = {
	key: string
	category: string
	label: string
	access: AccessMode
	unit?: string
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

