export type AlarmLevel = 'H' | 'M' | 'L'

export type AlarmDeviceLite = {
	id?: string
	name?: string
}

export type AlarmHistoryItem = {
	id?: string
	alarm_config_id?: string
	alarm_config_name?: string
	alarm_level?: AlarmLevel | null
	alarm_status?: string | null
	create_at?: string | null
	alarm_device_list?: AlarmDeviceLite[] | null
	content?: string | null
	description?: string | null
	processing_remark?: string | null
	processed_at?: string | null
	processed_by?: string | null
	[key: string]: unknown
}

export type AlarmHistoryListResp = {
	total?: number
	list?: AlarmHistoryItem[]
}
