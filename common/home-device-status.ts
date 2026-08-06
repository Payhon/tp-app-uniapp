export type HomeDeviceStatusInput = {
	bmsCommType?: number | null
	connectType: 'bluetooth' | 'mqtt' | 'offline'
	isOnline: boolean
}

export const shouldShowHomeDeviceStatus = (device: HomeDeviceStatusInput): boolean => {
	const commType = Number(device.bmsCommType || 0)
	const isFourGDevice = commType === 2 || commType === 3
	const usesFourGStatus = device.connectType !== 'bluetooth' && isFourGDevice
	return !(usesFourGStatus && !device.isOnline)
}
