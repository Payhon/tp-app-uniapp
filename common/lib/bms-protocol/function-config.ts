import { BMS_PARAM } from './param-registry';

export const FUNCTION_CONFIG_PARAM_KEY = BMS_PARAM.FUNCTION_CONFIG;

export const FUNCTION_CONFIG_BITS = Object.freeze({
	INSULATION_HEATING_ENABLED: 14,
	DISCHARGE_HEATING_ENABLED: 13,
	LOW_TEMP_HEATING_ENABLED: 12,
	CHARGE_ALLOWED: 10,
	DISCHARGE_ALLOWED: 9,
} as const);

export const FUNCTION_CONFIG_ITEMS = Object.freeze([
	{ key: 'insulationHeatingEnabled', label: '保温加热功能', enabledLabel: '开启', disabledLabel: '关闭' },
	{ key: 'dischargeHeatingEnabled', label: '放电加热功能', enabledLabel: '开启', disabledLabel: '关闭' },
	{ key: 'lowTempHeatingEnabled', label: '低温加热功能', enabledLabel: '开启', disabledLabel: '关闭' },
	{ key: 'chargeAllowed', label: '充电允许', enabledLabel: '允许', disabledLabel: '禁止' },
	{ key: 'dischargeAllowed', label: '放电允许', enabledLabel: '允许', disabledLabel: '禁止' },
] as const);

export type FunctionConfigFlagKey = (typeof FUNCTION_CONFIG_ITEMS)[number]['key'];
export type FunctionConfigFlags = Record<FunctionConfigFlagKey, boolean>;

const FLAG_BIT_MAP: Record<FunctionConfigFlagKey, number> = {
	insulationHeatingEnabled: FUNCTION_CONFIG_BITS.INSULATION_HEATING_ENABLED,
	dischargeHeatingEnabled: FUNCTION_CONFIG_BITS.DISCHARGE_HEATING_ENABLED,
	lowTempHeatingEnabled: FUNCTION_CONFIG_BITS.LOW_TEMP_HEATING_ENABLED,
	chargeAllowed: FUNCTION_CONFIG_BITS.CHARGE_ALLOWED,
	dischargeAllowed: FUNCTION_CONFIG_BITS.DISCHARGE_ALLOWED,
};

const REVERSED_SEMANTICS_FLAGS = new Set<FunctionConfigFlagKey>(['chargeAllowed', 'dischargeAllowed']);

export function normalizeFunctionConfigWord(value: unknown): number {
	const n = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, Math.min(0xffff, Math.trunc(n))) & 0xffff;
}

export function parseFunctionConfigFlags(value: unknown): FunctionConfigFlags {
	const word = normalizeFunctionConfigWord(value);
	return {
		insulationHeatingEnabled: (word & (1 << FLAG_BIT_MAP.insulationHeatingEnabled)) !== 0,
		dischargeHeatingEnabled: (word & (1 << FLAG_BIT_MAP.dischargeHeatingEnabled)) !== 0,
		lowTempHeatingEnabled: (word & (1 << FLAG_BIT_MAP.lowTempHeatingEnabled)) !== 0,
		chargeAllowed: (word & (1 << FLAG_BIT_MAP.chargeAllowed)) === 0,
		dischargeAllowed: (word & (1 << FLAG_BIT_MAP.dischargeAllowed)) === 0,
	};
}

export function setFunctionConfigFlag(value: unknown, key: FunctionConfigFlagKey, enabled: boolean): number {
	const word = normalizeFunctionConfigWord(value);
	const bit = 1 << FLAG_BIT_MAP[key];
	const bitShouldBeSet = REVERSED_SEMANTICS_FLAGS.has(key) ? !enabled : enabled;
	return bitShouldBeSet ? (word | bit) & 0xffff : (word & ~bit) & 0xffff;
}
