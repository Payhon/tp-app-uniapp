export type HomeDeviceCardModel = {
	id: string
	name: string
	model: string
	isOnline: boolean
	connectType: 'bluetooth' | 'mqtt' | 'offline'
	batteryPercent: number
}

