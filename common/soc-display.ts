export const toSocDisplayInteger = (value: number): number => {
	if (!Number.isFinite(value)) return 0
	return Math.max(0, Math.min(100, Math.trunc(value)))
}
