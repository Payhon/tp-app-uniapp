export const hasAnyValidParamValue = (values: Record<string, unknown>, keys: string[]): boolean =>
	keys.some((key) => Object.prototype.hasOwnProperty.call(values, key) && values[key] != null)

export const applyValidParamValues = (
	target: Record<string, unknown>,
	values: Record<string, unknown>,
	keys: string[]
): boolean => {
	if (!hasAnyValidParamValue(values, keys)) return false
	for (const key of keys) {
		target[key] = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null
	}
	return true
}

export const shouldUseParamSectionCache = (loaded: boolean, force: boolean): boolean => loaded && !force
