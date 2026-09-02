export const SCAN_FOUR_G_ONLINE_GRACE_MS = 60_000

export type ScanFourGOnlineState = {
	enabled: boolean
	sessionKey: string
	startedAtMs: number
	lastValidResponseAtMs: number
}

export const createScanFourGOnlineState = (): ScanFourGOnlineState => ({
	enabled: false,
	sessionKey: '',
	startedAtMs: 0,
	lastValidResponseAtMs: 0,
})

export const shouldStartScanFourGOnlineGrace = (input: {
	scanEntry: boolean
	isFourGDevice: boolean
}): boolean => input.scanEntry && input.isFourGDevice

export const startScanFourGOnlineGrace = (input: {
	sessionKey: string
	nowMs: number
}): ScanFourGOnlineState => ({
	enabled: true,
	sessionKey: String(input.sessionKey || '').trim(),
	startedAtMs: Number(input.nowMs || 0),
	lastValidResponseAtMs: 0,
})

export const markScanFourGValidResponse = (
	state: ScanFourGOnlineState,
	input: { sessionKey: string; nowMs: number }
): ScanFourGOnlineState => {
	if (!state.enabled || state.sessionKey !== String(input.sessionKey || '').trim()) return state
	return {
		...state,
		lastValidResponseAtMs: Number(input.nowMs || 0),
	}
}

export const isScanFourGOnlineOverrideActive = (state: ScanFourGOnlineState, nowMs: number): boolean => {
	if (!state.enabled || !state.sessionKey) return false
	const anchorMs = state.lastValidResponseAtMs > 0 ? state.lastValidResponseAtMs : state.startedAtMs
	if (anchorMs <= 0) return false
	return Number(nowMs || 0) - anchorMs < SCAN_FOUR_G_ONLINE_GRACE_MS
}

export const getScanFourGOnlineOverrideExpiresAt = (state: ScanFourGOnlineState): number => {
	if (!state.enabled || !state.sessionKey) return 0
	const anchorMs = state.lastValidResponseAtMs > 0 ? state.lastValidResponseAtMs : state.startedAtMs
	return anchorMs > 0 ? anchorMs + SCAN_FOUR_G_ONLINE_GRACE_MS : 0
}
