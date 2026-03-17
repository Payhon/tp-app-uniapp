export type HomeDeviceCardModel = {
	id: string
	name: string
	model: string
	isOnline: boolean
	connectType: 'bluetooth' | 'mqtt' | 'offline'
	batteryPercent: number
	bleMac?: string | null
	bmsCommType?: number | null
	relationType?: 'BINDING' | 'ORG_ADDED' | 'END_USER_BOUND' | string
}
