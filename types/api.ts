export interface ApiResponse<T = unknown> {
	code: number
	message?: string
	data?: T
	[key: string]: unknown
}

