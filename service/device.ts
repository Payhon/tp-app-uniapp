import api from '@/API/'

type ApiResponse<T> = { code: number; data: T; message?: string }
type ApiRequest = <T>(
	url: string,
	data: unknown,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string
) => Promise<ApiResponse<T>>

const apiRequest = (api as unknown as { apiRequest: ApiRequest }).apiRequest

type Params = Record<string, unknown>
type IdParams = { id: string | number }

// 获取设备分组
export const getDeviceGroup = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group', params, 'GET')
}
  
  // 接入方式下拉菜单（旧）
export const deviceDictProtocolService = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/dict/protocol/service', params, 'GET')
}
  
  // 接入方式下拉一级菜单
export const deviceDictProtocolServiceFirstLevel = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/service/plugin/select', params, 'GET')
}
  
  // 接入方式下拉二级菜单
export const deviceDictProtocolServiceSecondLevel = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/service/access/list', params, 'GET')
}
  
  // 获取设备分组树
export const deviceGroupTree = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group/tree', params, 'GET')
}
  
  // 新增设备分组
export const deviceGroup = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group', params, 'POST')
}
  
  // 修改设备分组
export const putDeviceGroup = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group', params, 'PUT')
}
  
  // 激活设备
export const putDeviceActive = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/active', params, 'PUT')
}
  
  // 删除设备分组
export const deleteDeviceGroup = (params: IdParams) => {
	return apiRequest<unknown>(`/device/group/${params.id}`, null, 'DELETE')
}
  
  // 获取设备分组详情
export const deviceGroupDetail = (params: IdParams) => {
	return apiRequest<unknown>(`/device/group/detail/${params.id}`, null, 'GET')
}
  
  // 获取设备列表
export const deviceList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device', params, 'GET')
}
  
  // 删除某个设备
export const deviceDelete = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/update/config', params, 'PUT')
}
  
  // 获取设备列表（根据分组）
export const deviceListByGroup = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group/relation/list', params, 'GET')
}
  
  // 获取设备详情
export const deviceDetail = (id: string | number) => {
	const url = `/device/detail/${id}`
	return apiRequest<unknown>(url, null, 'GET')
}
  
  // 获取设备分组关系
export const deviceGroupRelation = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group/relation', params, 'POST')
}
  
export const getDeviceGroupRelation = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group/relation', params, 'GET')
}
  
  // 获取设备告警状态
export const deviceAlarmStatus = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info/history/device', params, 'GET')
}
  
  // 获取设备告警历史
export const deviceAlarmHistory = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info/history', params, 'GET')
}
  
  // 获取设备告警配置列表
export const deviceAlarmList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/scene_automations/alarm', params, 'GET')
}
  
  // 修改设备告警描述
export const deviceAlarmHistoryPut = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/alarm/info/history', params, 'PUT')
}
  
  // 获取设备功能模板列表
export const deviceTemplate = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/template', params, 'GET')
}
  
  // 获取服务列表
export const getServiceList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/service/list', params, 'GET')
}
  
  // 获取设备功能模板详情
export const deviceTemplateDetail = (params: IdParams) => {
	return apiRequest<unknown>(`/device/template/detail/${params.id}`, null, 'GET')
}
  
  // 获取设备配置列表
export const deviceConfig = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device_config', params, 'GET')
}
  
  // 创建设备配置
export const deviceConfigAdd = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device_config', params, 'POST')
}
  
  // 更新设备配置
export const deviceConfigEdit = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device_config', params, 'PUT')
}
  
  // 获取设备配置详情
export const deviceConfigInfo = (params: IdParams) => {
	return apiRequest<unknown>(`/device_config/${params.id}`, null, 'GET')
}
  
  // 删除设备配置
export const deviceConfigDel = (params: IdParams) => {
	return apiRequest<unknown>(`/device_config/${params.id}`, null, 'DELETE')
}
  
  // 设备配置-凭证类型下拉
export const deviceConfigVoucherType = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device_config/voucher_type', params, 'GET')
}
  
  // 设备配置-获取设备配置表单
export const protocolPluginConfigForm = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/protocol_plugin/config_form', params, 'GET')
}
  
  // 批量新设备配置关联的设备
export const deviceConfigBatch = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device_config/batch', params, 'PUT')
}
  
  // 删除设备分组关系
export const deleteDeviceGroupRelation = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/group/relation', params, 'DELETE')
}
  
  // 获取设备连接信息
export const getDeviceConnectInfo = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/connect/info', params, 'GET')
}
  
  // 获取插件信息通过服务
export const getPlugininfoByService = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/service/plugin/info', params, 'GET')
}
  
  // 获取设备配置列表
export const getDeviceConfigList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device_config', params, 'GET')
}
  
  // 更新设备凭证
export const updateDeviceVoucher = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/update/voucher', params, 'POST')
}
  
  // 添加设备
export const deviceAdd = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device', params, 'POST')
}
  
  // 获取设备连接表单
export const devicCeonnectForm = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/connect/form', params, 'GET')
}
  
  // 检查设备
export const checkDevice = (deviceNumber: string | number) => {
	const url = `/device/check/${deviceNumber}`
	return apiRequest<unknown>(url, null, 'GET')
}
  
  // 删除设备
export const deleteDevice = (params: IdParams) => {
	return apiRequest<unknown>(`/device/${params.id}`, null, 'DELETE')
}
  
  // 设置设备脚本启用状态
export const setDeviceScriptEnable = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/data_script/enable', params, 'PUT')
}

// 设备地图-遥测信息（用于首页电量等概览）
export const deviceMapTelemetry = (id: string | number) => {
	return apiRequest<unknown>(`/api/v1/device/map/telemetry/${id}`, null, 'GET')
}

// APP 端设备解绑（解绑当前用户与设备的绑定关系）
export const appUnbindDevice = (deviceId: string) => {
	return apiRequest<unknown>('/api/v1/app/device/unbind', { device_id: deviceId }, 'POST')
}

// APP 端：获取当前用户绑定设备列表（用于“我的设备”）
export const appBoundDeviceList = (params: { page: number; page_size: number; user_id?: string; device_number?: string }) => {
	return apiRequest<unknown>('/api/v1/app/device/list', params, 'GET')
}

// 更新设备信息（目前首页仅用于改名）
export const updateDeviceName = (payload: { id: string; name: string }) => {
	return apiRequest<unknown>('/api/v1/device', payload, 'PUT')
}
  
  // 获取数据处理列表
export const getDataScriptList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/data_script', params, 'GET')
}
  
  // 创建数据处理
export const dataScriptAdd = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/data_script', params, 'POST')
}
  
  // 更新数据处理
export const dataScriptEdit = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/data_script', params, 'PUT')
}
  
  // 调试数据处理
export const dataScriptQuiz = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/data_script/quiz', params, 'POST')
}
  
  // 删除数据处理
export const dataScriptDel = (params: IdParams) => {
	return apiRequest<unknown>(`/data_script/${params.id}`, null, 'DELETE')
}
  
  // 设备遥测当前值查询
export const telemetryDataCurrent = (id: string | number) => {
	const url = `/telemetry/datas/current/${id}`
	return apiRequest<unknown>(url, null, 'GET')
}
  
  // 获取指定键的遥测数据
export const telemetryDataCurrentKeys = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas/current/keys', params, 'GET')
}
  
  // 遥测数据历史列表
export const telemetryDataHistoryList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas/statistic', params, 'GET')
}
  
  // 删除遥测数据
export const telemetryDataDel = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas', params, 'DELETE')
}
  
  // 获取遥测下发记录列表
export const getTelemetryLogList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas/set/logs', params, 'GET')
}
  
  // 下发遥测数据
export const telemetryDataPub = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas/pub', params, 'POST')
}
  
  // 新增期望消息
export const expectMessageAdd = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/expected/data', params, 'POST')
}
  
  // 获取期望消息列表
export const expectMessageList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/expected/data/list', params, 'GET')
}
  
  // 删除期望消息
export const expectMessageDelete = (id: string | number) => {
	return apiRequest<unknown>(`/expected/data/${id}`, null, 'DELETE')
}
  
  // 获取属性数据集
export const getAttributeDataSet = (params: { device_id: string | number }) => {
	return apiRequest<unknown>(`/attribute/datas/${params.device_id}`, null, 'GET')
}
  
  // 删除属性数据集
export const deleteAttributeDataSet = (id: string | number) => {
	return apiRequest<unknown>(`/attribute/datas/${id}`, null, 'DELETE')
}
  
  // 获取属性下发记录列表
export const getAttributeDataSetLogs = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/attribute/datas/set/logs', params, 'GET')
}
  
  // 下发属性数据
export const attributeDataPub = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/attribute/datas/pub', params, 'POST')
}
  
  // 获取指定键的属性数据
export const getAttributeDatasKey = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/attribute/datas/key', params, 'GET')
}
  
  // 获取事件数据集
export const getEventDataSet = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/event/datas', params, 'GET')
}
  
  // 获取命令下发记录列表
export const getCommandDataSetLogs = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/command/datas/set/logs', params, 'GET')
}
  
  // 下发命令
export const commandDataPub = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/command/datas/pub', params, 'POST')
}
  
  // 获取命令数据通过ID
export const commandDataById = (id: string | number) => {
	const url = `/command/datas/${id}`
	return apiRequest<unknown>(url, null, 'GET')
}
  
  // 获取有图表的设备列表
  export const deviceTemplateSelect = () => {
	return apiRequest<unknown>('/api/v1/device/template/chart/select', null, 'GET')
}
  
  // 获取遥测历史数据
export const telemetryHistoryData = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas/history/pagination', params, 'GET')
}
  
  // 更新设备配置
export const deviceUpdateConfig = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/update/config', params, 'PUT')
}
  
  // 获取设备配置菜单
export const deviceConfigMenu = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/template/menu', params, 'GET')
}
  
  // 保存设备位置
export const deviceLocation = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device', params, 'PUT')
}
  
  // 修改设备名称
export const deviceUpdate = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device', params, 'PUT')
}
  
  // 获取网关下子设备列表
export const childDeviceTableList = (params: Params & IdParams) => {
	return apiRequest<unknown>(`/device/sub-list/${params.id}`, params, 'GET')
}
  
  // 获取添加子设备选择列表
  export const childDeviceSelectList = () => {
	return apiRequest<unknown>('/api/v1/device/list', null, 'GET')
}
  
  // 添加子设备
export const addChildDevice = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/son/add', params, 'POST')
}
  
  // 移除子设备
export const removeChildDevice = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/device/sub-remove', params, 'PUT')
}
  
  // 获取设备获取遥测数据命令
export const getSimulation = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas/simulation', params, 'GET')
}
  
  // 发送设备遥测数据命令
export const sendSimulation = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/telemetry/datas/simulation', params, 'POST')
}
  
  // 根据设备ID查自定义命令列表
export const deviceCustomCommandsIdList = (paramsId: string | number) => {
	return apiRequest<unknown>(`/device/model/custom/commands/${paramsId}`, null, 'GET')
}
  
  // 获取服务插件选择列表
export const deviceProtocalServiceList = (params: Params | null) => {
	return apiRequest<unknown>('/api/v1/service/plugin/select', params, 'GET')
}
