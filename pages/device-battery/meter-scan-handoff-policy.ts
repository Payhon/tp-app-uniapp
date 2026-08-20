export type MeterScanHandoffSessionMode = 'cloud' | 'instrument'

export type MeterScanHandoffConnectionType = 'bluetooth' | 'mqtt' | 'offline'

export type MeterScanHandoffUiState = {
	available: boolean
	showPanel: boolean
	showTrigger: boolean
}

export const resolveMeterScanHandoffUi = (options: {
	sessionMode: MeterScanHandoffSessionMode
	allowScanHandoff: boolean
	connType: MeterScanHandoffConnectionType
	connecting: boolean
	hasBmsStatus: boolean
	bmsDataLoading: boolean
	instrumentPassthroughUnavailable: boolean
	panelVisible: boolean
	activeTab: number
}): MeterScanHandoffUiState => {
	const available =
		options.sessionMode === 'instrument' &&
		options.allowScanHandoff &&
		options.connType === 'bluetooth' &&
		!options.connecting &&
		(options.hasBmsStatus || !options.bmsDataLoading || options.instrumentPassthroughUnavailable)

	return {
		available,
		showPanel: available && options.panelVisible && options.activeTab === 0,
		showTrigger: available && !options.panelVisible,
	}
}

export const shouldCollapseMeterScanPanel = (options: {
	hasBmsStatus: boolean
	previousHasBmsStatus: boolean
}): boolean => options.hasBmsStatus && !options.previousHasBmsStatus
