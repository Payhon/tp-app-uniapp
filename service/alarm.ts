import api from '@/API/'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(
	url: string,
	data: unknown,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string
) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

type Params = Record<string, unknown>

/** 新增告警配置 */
export const addWarningMessage = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/config', params, 'POST')
}
  
  /** 配置告警列表 */
export const warningMessageList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/config', params, 'GET')
}
  
  /** 告警配置编辑:启用停止 */
export const editInfo = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/config', params, 'PUT')
}
  
  /** 告警配置编辑:启用停止 */
export const editInfoText = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/config', params, 'PUT')
}
  
  /** 删除告警配置 */
export const delInfo = (id: string | number) => {
	return apiRequest<unknown>(`/api/v1/alarm/config/${id}`, {}, 'DELETE')
}
  
  /** 告警信息列表 */
export const infoList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info', params, 'GET')
}
  
  /** 告警历史列表 */
export const alarmHistory = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info/history', params, 'GET')
}

/** 告警历史详情 */
export const alarmHistoryDetail = (id: string) => {
	return apiRequest<unknown>(`/api/v1/alarm/info/history/${encodeURIComponent(String(id || ''))}`, {}, 'GET')
}

/** 告警处理完成 */
export const handleAlarmHistory = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info/history/handle', params, 'PUT')
}
  
  /** 告警信息处理 */
export const processingOperation = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info', params, 'PUT')
}
  
  /** 告警信息批量处理 */
export const batchProcessing = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info/batch', params, 'PUT')
}
  
