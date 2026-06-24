export type HomeDeviceCardModel = {
	id: string
	name: string
	identifierText: string
	isOnline: boolean
	connectType: 'bluetooth' | 'mqtt' | 'offline'
	batteryPercent: number
	bleMac?: string | null
	iccid?: string | null
	imei?: string | null
	bmsCommType?: number | null
	relationType?: 'BINDING' | 'ORG_ADDED' | 'END_USER_BOUND' | string
}
