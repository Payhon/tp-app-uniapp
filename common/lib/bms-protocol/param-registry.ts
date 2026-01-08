import type { BmsParamDef } from './types'

export const BMS_PARAM = Object.freeze({
	// 电压配置（doc/oriigin/device_comm_protocol_write.md 3.1，0x400~）
	// 0x400 单体过压告警电压（单位 V，分辨率 0.001）
	CELL_OV_ALARM_V: 'CELL_OV_ALARM_V',
	// 0x401 单体过充保护电压（单位 V，分辨率 0.001）
	CELL_OC_PROTECT_V: 'CELL_OC_PROTECT_V',
	// 0x402(L) 单体过充告警延时（单位 S，分辨率 0.1）
	CELL_OC_ALARM_DELAY_S: 'CELL_OC_ALARM_DELAY_S',
	// 0x402(H) 单体过充保护延时（单位 S，分辨率 0.1）
	CELL_OC_PROTECT_DELAY_S: 'CELL_OC_PROTECT_DELAY_S',
	// 0x403(H) 常温低温阀值温度（单位 ℃，偏移 -40）
	NORMAL_LOW_TEMP_THRESHOLD_C: 'NORMAL_LOW_TEMP_THRESHOLD_C',
	// 0x404 单体过压保护解除电压（单位 V，分辨率 0.001）
	CELL_OV_PROTECT_RELEASE_V: 'CELL_OV_PROTECT_RELEASE_V',
	// 0x405 单体过充告警解除电压差（单位 V，分辨率 0.001）
	CELL_OC_ALARM_RELEASE_DELTA_V: 'CELL_OC_ALARM_RELEASE_DELTA_V',
	// 0x406 容量解除（单位 1%SOC）
	CAPACITY_RELEASE_SOC_PCT: 'CAPACITY_RELEASE_SOC_PCT',
	// 0x407(L) 过压放电解除电流（单位 A，分辨率 0.1，偏移 1）
	OV_DISCHARGE_RELEASE_A: 'OV_DISCHARGE_RELEASE_A',
	// 0x407(H) 欠压充电解除电流（单位 A，分辨率 0.1，偏移 1）
	UV_CHARGE_RELEASE_A: 'UV_CHARGE_RELEASE_A',
	// 0x408(L) 单体过压告警解除延时（单位 S，分辨率 0.1，偏移 1）
	CELL_OV_ALARM_RELEASE_DELAY_S: 'CELL_OV_ALARM_RELEASE_DELAY_S',
	// 0x408(H) 单体过压保护解除延时（单位 S，分辨率 0.1，偏移 1）
	CELL_OV_PROTECT_RELEASE_DELAY_S: 'CELL_OV_PROTECT_RELEASE_DELAY_S',
	// 0x409 常温单体过放告警电压（单位 V，分辨率 0.001，偏移 1）
	NORMAL_CELL_UV_ALARM_V: 'NORMAL_CELL_UV_ALARM_V',
	// 0x40A 常温单体过放保护电压（单位 V，分辨率 0.001，偏移 1）
	NORMAL_CELL_UV_PROTECT_V: 'NORMAL_CELL_UV_PROTECT_V',
	// 0x40B 低温单体过放告警电压（单位 V，分辨率 0.001，偏移 1）
	LOW_TEMP_CELL_UV_ALARM_V: 'LOW_TEMP_CELL_UV_ALARM_V',
	// 0x40C 低温单体过放保护电压（单位 V，分辨率 0.001，偏移 1）
	LOW_TEMP_CELL_UV_PROTECT_V: 'LOW_TEMP_CELL_UV_PROTECT_V',
	// 0x40D(L) 单体过放告警延时（单位 S，分辨率 0.1，偏移 1）
	CELL_UV_ALARM_DELAY_S: 'CELL_UV_ALARM_DELAY_S',
	// 0x40E(H) 单体过放保护延时（单位 S，分辨率 0.1，偏移 1）
	CELL_UV_PROTECT_DELAY_S: 'CELL_UV_PROTECT_DELAY_S',
	// 0x40F 单体过放保护解除电压（doc 同地址亦有“单体过放告警解除电压”描述）
	CELL_UV_PROTECT_RELEASE_V: 'CELL_UV_PROTECT_RELEASE_V',
	// 0x410(L) 单体过放告警解除延时（单位 S，分辨率 0.1，偏移 1）
	CELL_UV_ALARM_RELEASE_DELAY_S: 'CELL_UV_ALARM_RELEASE_DELAY_S',
	// 0x410(H) 单体过放保护解除延时（单位 S，分辨率 0.1，偏移 1）
	CELL_UV_PROTECT_RELEASE_DELAY_S: 'CELL_UV_PROTECT_RELEASE_DELAY_S',
	// 0x411 总压过压告警电压（单位 V，分辨率 0.01）
	PACK_OV_ALARM_V: 'PACK_OV_ALARM_V',
	// 0x412 总压过压保护电压（单位 V，分辨率 0.01）
	PACK_OV_PROTECT_V: 'PACK_OV_PROTECT_V',
	// 0x413(L) 总压过压保护延时（单位 S，分辨率 0.1，偏移 1）
	PACK_OV_PROTECT_DELAY_S: 'PACK_OV_PROTECT_DELAY_S',
	// 0x413(H) 总压过压告警延时（单位 S，分辨率 0.1，偏移 1）
	PACK_OV_ALARM_DELAY_S: 'PACK_OV_ALARM_DELAY_S',
	// 0x414 总压过压告警解除电压（单位 V，分辨率 0.01，偏移 1）
	PACK_OV_ALARM_RELEASE_V: 'PACK_OV_ALARM_RELEASE_V',
	// 0x415 总压过压保护解除电压（单位 V，分辨率 0.01，偏移 1）
	PACK_OV_PROTECT_RELEASE_V: 'PACK_OV_PROTECT_RELEASE_V',
	// 0x416(L) 总压过压解除延时（单位 S，分辨率 0.1，偏移 1）
	PACK_OV_PROTECT_RELEASE_DELAY_S: 'PACK_OV_PROTECT_RELEASE_DELAY_S',
	// 0x416(H) 总压过压告警解除延时（单位 S，分辨率 0.1，偏移 1）
	PACK_OV_ALARM_RELEASE_DELAY_S: 'PACK_OV_ALARM_RELEASE_DELAY_S',
	// 0x417 常温总压过放告警电压（单位 V，分辨率 0.01，偏移 1）
	NORMAL_PACK_UV_ALARM_V: 'NORMAL_PACK_UV_ALARM_V',
	// 0x418 常温总压过放保护电压（单位 V，分辨率 0.01，偏移 1）
	NORMAL_PACK_UV_PROTECT_V: 'NORMAL_PACK_UV_PROTECT_V',
	// 0x419 低温总压过放告警电压（单位 V，分辨率 0.01，偏移 1）
	LOW_TEMP_PACK_UV_ALARM_V: 'LOW_TEMP_PACK_UV_ALARM_V',
	// 0x41A 低温总压过放保护电压（单位 V，分辨率 0.01，偏移 1）
	LOW_TEMP_PACK_UV_PROTECT_V: 'LOW_TEMP_PACK_UV_PROTECT_V',
	// 0x41B(L) 总压过放告警延时（单位 S，分辨率 0.1，偏移 1）
	PACK_UV_ALARM_DELAY_S: 'PACK_UV_ALARM_DELAY_S',
	// 0x41B(H) 总压过放保护延时（单位 S，分辨率 0.1，偏移 1）
	PACK_UV_PROTECT_DELAY_S: 'PACK_UV_PROTECT_DELAY_S',
	// 0x41C 总压过放告警解除电压（单位 V，分辨率 0.01，偏移 1）
	PACK_UV_ALARM_RELEASE_V: 'PACK_UV_ALARM_RELEASE_V',
	// 0x41D 总压过放保护解除电压（单位 V，分辨率 0.01，偏移 1）
	PACK_UV_PROTECT_RELEASE_V: 'PACK_UV_PROTECT_RELEASE_V',
	// 0x41E(L) 总压过放告警解除延时（单位 S，分辨率 0.1，偏移 1）
	PACK_UV_ALARM_RELEASE_DELAY_S: 'PACK_UV_ALARM_RELEASE_DELAY_S',
	// 0x41E(H) 总压过放保护解除延时（单位 S，分辨率 0.1，偏移 1）
	PACK_UV_PROTECT_RELEASE_DELAY_S: 'PACK_UV_PROTECT_RELEASE_DELAY_S',

	// 电流配置（doc/oriigin/device_comm_protocol_write.md 3.2，0x420~）
	// 0x420 充电过流保护小电流（单位 A，分辨率 0.1，偏移 1）
	CHARGE_OC_PROTECT_SMALL_A: 'CHARGE_OC_PROTECT_SMALL_A',
	// 0x421 充电过流保护大电流（单位 A，分辨率 0.1，偏移 1）
	CHARGE_OC_PROTECT_LARGE_A: 'CHARGE_OC_PROTECT_LARGE_A',
	// 0x422(L) 充电过流告警延时（单位 S）
	CHARGE_OC_ALARM_DELAY_S: 'CHARGE_OC_ALARM_DELAY_S',
	// 0x422(H) 充电过流保护大电流延时（单位 S）
	CHARGE_OC_PROTECT_LARGE_DELAY_S: 'CHARGE_OC_PROTECT_LARGE_DELAY_S',
	// 0x423(L) 充电过流保护小电流延时（单位 S）
	CHARGE_OC_PROTECT_SMALL_DELAY_S: 'CHARGE_OC_PROTECT_SMALL_DELAY_S',
	// 0x424(L) 充电过流告警解除延时（单位 S）
	CHARGE_OC_ALARM_RELEASE_DELAY_S: 'CHARGE_OC_ALARM_RELEASE_DELAY_S',
	// 0x424(H) 自动解除时间（单位 MIN）
	AUTO_RELEASE_TIME_MIN: 'AUTO_RELEASE_TIME_MIN',
	// 0x425 充电过流告警解电流（单位 A，分辨率 0.1）
	CHARGE_OC_ALARM_RELEASE_A: 'CHARGE_OC_ALARM_RELEASE_A',
	// 0x426(L) 放电解除电流（单位 A，分辨率 0.1）
	DISCHARGE_RELEASE_A: 'DISCHARGE_RELEASE_A',
	// 0x426(H) 自动解除锁定次数
	AUTO_RELEASE_LOCK_COUNT: 'AUTO_RELEASE_LOCK_COUNT',
	// 0x427 放电过流告警电流（单位 A，分辨率 0.1）
	DISCHARGE_OC_ALARM_A: 'DISCHARGE_OC_ALARM_A',
	// 0x428 放电过流小电流保护电流（单位 A，分辨率 0.1）
	DISCHARGE_OC_PROTECT_SMALL_A: 'DISCHARGE_OC_PROTECT_SMALL_A',
	// 0x429 放电过流大电流保护电流（单位 A，分辨率 0.1）
	DISCHARGE_OC_PROTECT_LARGE_A: 'DISCHARGE_OC_PROTECT_LARGE_A',
	// 0x42A(L) 放电过流告警延时（doc 表中此项与 0x429 存在冲突，本实现按 0x42A(L) 处理）
	DISCHARGE_OC_ALARM_DELAY_S: 'DISCHARGE_OC_ALARM_DELAY_S',
	// 0x42A(H) 放电过流大电流保护延时
	DISCHARGE_OC_PROTECT_LARGE_DELAY_S: 'DISCHARGE_OC_PROTECT_LARGE_DELAY_S',
	// 0x42B(L) 放电过流小电流保护延时
	DISCHARGE_OC_PROTECT_SMALL_DELAY_S: 'DISCHARGE_OC_PROTECT_SMALL_DELAY_S',
	// 0x42B(H) 自动解除时间（单位 MIN）
	DISCHARGE_OC_AUTO_RELEASE_TIME_MIN: 'DISCHARGE_OC_AUTO_RELEASE_TIME_MIN',
	// 0x42C 放电过流告警解除电流（单位 A，分辨率 0.1）
	DISCHARGE_OC_ALARM_RELEASE_A: 'DISCHARGE_OC_ALARM_RELEASE_A',
	// 0x42D(L) 充电解除电流（单位 A，分辨率 0.1）
	CHARGE_RELEASE_A: 'CHARGE_RELEASE_A',
	// 0x42D(H) 锁定次数
	CHARGE_LOCK_COUNT: 'CHARGE_LOCK_COUNT',

	// 温度配置（doc/oriigin/device_comm_protocol_write.md 3.3，0x438~；温度类单位 ℃，偏移 -40）
	// 0x438(L) MOS过温告警温度
	MOS_OT_ALARM_C: 'MOS_OT_ALARM_C',
	// 0x438(H) MOS过温保护温度
	MOS_OT_PROTECT_C: 'MOS_OT_PROTECT_C',
	// 0x439(L) MOS过温告警解温度
	MOS_OT_ALARM_RELEASE_C: 'MOS_OT_ALARM_RELEASE_C',
	// 0x439(H) MOS保护解除温度
	MOS_OT_PROTECT_RELEASE_C: 'MOS_OT_PROTECT_RELEASE_C',
	// 0x43A(L) MOS过温告警延时
	MOS_OT_ALARM_DELAY_S: 'MOS_OT_ALARM_DELAY_S',
	// 0x43A(H) MOS过温保护延时
	MOS_OT_PROTECT_DELAY_S: 'MOS_OT_PROTECT_DELAY_S',
	// 0x43B(L) MOS过温告警解除延时
	MOS_OT_ALARM_RELEASE_DELAY_S: 'MOS_OT_ALARM_RELEASE_DELAY_S',
	// 0x43B(H) MOS过温保护解除延时
	MOS_OT_PROTECT_RELEASE_DELAY_S: 'MOS_OT_PROTECT_RELEASE_DELAY_S',
	// 0x43C(L) 环境过温告警温度
	AMBIENT_OT_ALARM_C: 'AMBIENT_OT_ALARM_C',
	// 0x43C(H) 环境过温保护温度
	AMBIENT_OT_PROTECT_C: 'AMBIENT_OT_PROTECT_C',
	// 0x43D(L) 环境过温告警解温度
	AMBIENT_OT_ALARM_RELEASE_C: 'AMBIENT_OT_ALARM_RELEASE_C',
	// 0x43D(H) 环境过保护解除温度
	AMBIENT_OT_PROTECT_RELEASE_C: 'AMBIENT_OT_PROTECT_RELEASE_C',
	// 0x43E(L) 环境低温告警温度
	AMBIENT_UT_ALARM_C: 'AMBIENT_UT_ALARM_C',
	// 0x43E(H) 环境低温保护温度
	AMBIENT_UT_PROTECT_C: 'AMBIENT_UT_PROTECT_C',
	// 0x43F(L) 环境低温告警解温度
	AMBIENT_UT_ALARM_RELEASE_C: 'AMBIENT_UT_ALARM_RELEASE_C',
	// 0x43F(H) 环境低温保护解除温度
	AMBIENT_UT_PROTECT_RELEASE_C: 'AMBIENT_UT_PROTECT_RELEASE_C',
	// 0x440(L) 环境过温告警延时
	AMBIENT_OT_ALARM_DELAY_S: 'AMBIENT_OT_ALARM_DELAY_S',
	// 0x440(H) 环境过温保护延时
	AMBIENT_OT_PROTECT_DELAY_S: 'AMBIENT_OT_PROTECT_DELAY_S',
	// 0x441(L) 环境过温告警解除延时
	AMBIENT_OT_ALARM_RELEASE_DELAY_S: 'AMBIENT_OT_ALARM_RELEASE_DELAY_S',
	// 0x441(H) 环境过温保护解除延时
	AMBIENT_OT_PROTECT_RELEASE_DELAY_S: 'AMBIENT_OT_PROTECT_RELEASE_DELAY_S',
	// 0x442(L) 充电低温告警温度
	CHARGE_UT_ALARM_C: 'CHARGE_UT_ALARM_C',
	// 0x442(H) 充电低温保护温度
	CHARGE_UT_PROTECT_C: 'CHARGE_UT_PROTECT_C',
	// 0x443(L) 充电低温警告解除温度
	CHARGE_UT_ALARM_RELEASE_C: 'CHARGE_UT_ALARM_RELEASE_C',
	// 0x443(H) 充电低温保护解除温度
	CHARGE_UT_PROTECT_RELEASE_C: 'CHARGE_UT_PROTECT_RELEASE_C',
	// 0x444(L) 充电高温告警温度
	CHARGE_OT_ALARM_C: 'CHARGE_OT_ALARM_C',
	// 0x444(H) 充电高温保护温度
	CHARGE_OT_PROTECT_C: 'CHARGE_OT_PROTECT_C',
	// 0x445(L) 充电高温告警解除温度
	CHARGE_OT_ALARM_RELEASE_C: 'CHARGE_OT_ALARM_RELEASE_C',
	// 0x445(H) 充电高温保护解除温度
	CHARGE_OT_PROTECT_RELEASE_C: 'CHARGE_OT_PROTECT_RELEASE_C',
	// 0x446(L) 充电高温告警延时
	CHARGE_OT_ALARM_DELAY_S: 'CHARGE_OT_ALARM_DELAY_S',
	// 0x446(H) 充电高温保护延时
	CHARGE_OT_PROTECT_DELAY_S: 'CHARGE_OT_PROTECT_DELAY_S',
	// 0x447(L) 充电高温告警解除延时
	CHARGE_OT_ALARM_RELEASE_DELAY_S: 'CHARGE_OT_ALARM_RELEASE_DELAY_S',
	// 0x447(H) 充电高温保护解除延时
	CHARGE_OT_PROTECT_RELEASE_DELAY_S: 'CHARGE_OT_PROTECT_RELEASE_DELAY_S',
	// 0x448(L) 放电低温告警温度
	DISCHARGE_UT_ALARM_C: 'DISCHARGE_UT_ALARM_C',
	// 0x448(H) 放电低温保护温度
	DISCHARGE_UT_PROTECT_C: 'DISCHARGE_UT_PROTECT_C',
	// 0x449(L) 放电低温告警解除温度
	DISCHARGE_UT_ALARM_RELEASE_C: 'DISCHARGE_UT_ALARM_RELEASE_C',
	// 0x449(H) 放电低温保护解除温度
	DISCHARGE_UT_PROTECT_RELEASE_C: 'DISCHARGE_UT_PROTECT_RELEASE_C',
	// 0x44A(L) 放电高温告警温度
	DISCHARGE_OT_ALARM_C: 'DISCHARGE_OT_ALARM_C',
	// 0x44A(H) 放电高温保护温度
	DISCHARGE_OT_PROTECT_C: 'DISCHARGE_OT_PROTECT_C',
	// 0x44B 放电高温警告解除温度（doc 未标注 H/L，本实现按 L 处理）
	DISCHARGE_OT_ALARM_RELEASE_C: 'DISCHARGE_OT_ALARM_RELEASE_C',
	// 0x44C 放电高温保护解除温度（doc 未标注 H/L，本实现按 L 处理）
	DISCHARGE_OT_PROTECT_RELEASE_C: 'DISCHARGE_OT_PROTECT_RELEASE_C',
	// 0x44D 放电高温告警延时
	DISCHARGE_OT_ALARM_DELAY_S: 'DISCHARGE_OT_ALARM_DELAY_S',
	// 0x44E 放电高温保护延时
	DISCHARGE_OT_PROTECT_DELAY_S: 'DISCHARGE_OT_PROTECT_DELAY_S',
	// 0x44F 放电高温告警解除延时
	DISCHARGE_OT_ALARM_RELEASE_DELAY_S: 'DISCHARGE_OT_ALARM_RELEASE_DELAY_S',
	// 0x450 放电高温保护解除延时
	DISCHARGE_OT_PROTECT_RELEASE_DELAY_S: 'DISCHARGE_OT_PROTECT_RELEASE_DELAY_S',
	// 0x451 电芯高温告警温度（doc 同地址亦有“热失控电芯温度”描述，本实现将二者映射为 L/H）
	CELL_OT_ALARM_C: 'CELL_OT_ALARM_C',
	// 0x451 热失控电芯温度（同寄存器另一字节）
	CELL_THERMAL_RUNAWAY_C: 'CELL_THERMAL_RUNAWAY_C',
	// 0x452 电芯高温告警解除温度
	CELL_OT_ALARM_RELEASE_C: 'CELL_OT_ALARM_RELEASE_C',
	// 0x452 高温告警延时（doc 未标注 H/L，本实现按 H 处理）
	CELL_OT_ALARM_DELAY_S: 'CELL_OT_ALARM_DELAY_S',
	// 0x453 高温告警解除延时（doc 未标注 H/L，本实现按 L 处理）
	CELL_OT_ALARM_RELEASE_DELAY_S: 'CELL_OT_ALARM_RELEASE_DELAY_S',
	// 0x453 加热电芯开启温度（同寄存器另一字节）
	HEAT_CELL_ON_C: 'HEAT_CELL_ON_C',
	// 0x454 加热电芯关闭温度
	HEAT_CELL_OFF_C: 'HEAT_CELL_OFF_C',
	// 0x454 加热膜温度保护温度（同寄存器另一字节）
	HEAT_FILM_PROTECT_C: 'HEAT_FILM_PROTECT_C',
	// 0x455 加热膜温度保护恢复温度
	HEAT_FILM_PROTECT_RELEASE_C: 'HEAT_FILM_PROTECT_RELEASE_C',
	// 0x455 加热开启延时（同寄存器另一字节）
	HEAT_ON_DELAY_S: 'HEAT_ON_DELAY_S',
	// 0x456 加热关闭延时
	HEAT_OFF_DELAY_S: 'HEAT_OFF_DELAY_S',
	// 0x456 极柱温度保护温度（同寄存器另一字节）
	POLE_TEMP_PROTECT_C: 'POLE_TEMP_PROTECT_C',
	// 0x457 极柱温度保护恢复温度
	POLE_TEMP_PROTECT_RELEASE_C: 'POLE_TEMP_PROTECT_RELEASE_C',

	// 其他配置（doc/oriigin/device_comm_protocol_write.md 3.4，0x458~）
	// 0x458 均衡开启电压（单位 V，分辨率 0.001）
	BALANCE_START_V: 'BALANCE_START_V',
	// 0x459 开启压差（单位 V，分辨率 0.001）
	BALANCE_START_DELTA_V: 'BALANCE_START_DELTA_V',
	// 0x45A 停止压差（单位 V，分辨率 0.001）
	BALANCE_STOP_DELTA_V: 'BALANCE_STOP_DELTA_V',
	// 0x45A 均衡功能高温禁止温度（单位 ℃，偏移 -40）
	BALANCE_DISABLE_HIGH_TEMP_C: 'BALANCE_DISABLE_HIGH_TEMP_C',
	// 0x45B 均衡功能低温禁止温度（单位 ℃，偏移 -40）
	BALANCE_DISABLE_LOW_TEMP_C: 'BALANCE_DISABLE_LOW_TEMP_C',
	// 0x45B 压差报警压差（单位 10mV，分辨率 0.01V）
	DELTA_V_ALARM_THRESHOLD_V: 'DELTA_V_ALARM_THRESHOLD_V',
	// 0x45C 压差报警恢复压差（单位 10mV，分辨率 0.01V）
	DELTA_V_ALARM_RELEASE_V: 'DELTA_V_ALARM_RELEASE_V',
	// 0x45C 压差保护压差（单位 10mV，分辨率 0.01V）
	DELTA_V_PROTECT_THRESHOLD_V: 'DELTA_V_PROTECT_THRESHOLD_V',
	// 0x45D 压差保护恢复压差（单位 10mV，分辨率 0.01V）
	DELTA_V_PROTECT_RELEASE_V: 'DELTA_V_PROTECT_RELEASE_V',
	// 0x45D 压差保护延时（单位 S）
	DELTA_V_PROTECT_DELAY_S: 'DELTA_V_PROTECT_DELAY_S',
	// 0x45E 压差解除延时（单位 S）
	DELTA_V_RELEASE_DELAY_S: 'DELTA_V_RELEASE_DELAY_S',
	// 0x45E 温差报警阈值（单位 ℃）
	TEMP_DIFF_ALARM_THRESHOLD_C: 'TEMP_DIFF_ALARM_THRESHOLD_C',
	// 0x45F 温差报警恢复阈值（单位 ℃）
	TEMP_DIFF_ALARM_RELEASE_C: 'TEMP_DIFF_ALARM_RELEASE_C',
	// 0x45F 温差保护阈值（单位 ℃）
	TEMP_DIFF_PROTECT_THRESHOLD_C: 'TEMP_DIFF_PROTECT_THRESHOLD_C',
	// 0x460 温差保护恢复阈值（单位 ℃）
	TEMP_DIFF_PROTECT_RELEASE_C: 'TEMP_DIFF_PROTECT_RELEASE_C',
	// 0x460 温差保护延时（单位 S；doc 同地址亦有“温差解除延时(H)”描述）
	TEMP_DIFF_PROTECT_DELAY_S: 'TEMP_DIFF_PROTECT_DELAY_S',

	// 编号配置（doc/oriigin/device_comm_protocol_write.md 3.5）
	// 0x500~0x50F 电池组编号（ASCII 字符串，32字节）
	BATTERY_GROUP_ID: 'BATTERY_GROUP_ID',
	// 0x53A~0x56F DTU域名和端口地址（ASCII 字符串，108字节）
	DTU_DOMAIN_PORT: 'DTU_DOMAIN_PORT',

	// 系统寄存器（doc/oriigin/device_comm_protocol_write.md 四、系统寄存器）
	// 0x0001 高低串数配置（H：高串数；L：低串数）
	SERIES_COUNT_CONFIG: 'SERIES_COUNT_CONFIG',
	// 0x0030~0x0031（48~49）设计容量（0.001Ah）
	DESIGN_CAPACITY_AH: 'DESIGN_CAPACITY_AH',
	// 0x0032~0x0033（50~51）满充容量（0.001Ah）
	FULL_CAPACITY_AH: 'FULL_CAPACITY_AH',
	// 0x0034~0x0035（52~53）剩余容量（0.001Ah）
	REMAIN_CAPACITY_AH: 'REMAIN_CAPACITY_AH',
	// 0x003E（62）功能配置（bit14/13/12/10/9 等）
	FUNCTION_CONFIG: 'FUNCTION_CONFIG',
} as const);

export type BmsParamKey = (typeof BMS_PARAM)[keyof typeof BMS_PARAM]

// 主要状态寄存器（只读，doc/oriigin/device_comm_protocol_basic.md 0x100~ 顺延）
// 这些参数建议通过 BmsClient.readRoParam(...) 读取（底层会调用 readAllStatus 并按 path 提取）。
export const BMS_STATUS_PARAM = Object.freeze({
	SERIES_COUNT: 'SERIES_COUNT',
	CELL_TEMP_COUNT: 'CELL_TEMP_COUNT',
	HARDWARE_VERSION: 'HARDWARE_VERSION',
	SOFTWARE_VERSION: 'SOFTWARE_VERSION',
	SPECIAL_ID: 'SPECIAL_ID',
	PROTOCOL_VERSION: 'PROTOCOL_VERSION',

	DESIGN_CAPACITY_MAH: 'DESIGN_CAPACITY_MAH',
	REMAINING_CAPACITY_MAH: 'REMAINING_CAPACITY_MAH',
	FULL_CAPACITY_MAH: 'FULL_CAPACITY_MAH',
	FULL_WH: 'FULL_WH',
	REMAINING_WH: 'REMAINING_WH',
	SOC_PCT: 'SOC_PCT',
	SOH_PCT: 'SOH_PCT',
	CYCLE_COUNT: 'CYCLE_COUNT',

	MAX_CHARGE_INTERVAL_HOURS: 'MAX_CHARGE_INTERVAL_HOURS',
	CURRENT_CHARGE_INTERVAL_HOURS: 'CURRENT_CHARGE_INTERVAL_HOURS',
	DISCHARGE_REMAINING_MIN: 'DISCHARGE_REMAINING_MIN',
	CHARGE_REMAINING_MIN: 'CHARGE_REMAINING_MIN',
	CHARGE_COUNT: 'CHARGE_COUNT',
	DISCHARGE_COUNT: 'DISCHARGE_COUNT',
	BMS_TIMESTAMP: 'BMS_TIMESTAMP',
	POWER_ON_WORK_HOURS: 'POWER_ON_WORK_HOURS',
	TOTAL_CHARGE_CAPACITY_RAW: 'TOTAL_CHARGE_CAPACITY_RAW',

	PACK_CELL_SUM_VOLTAGE_V: 'PACK_CELL_SUM_VOLTAGE_V',
	VBAT_VOLTAGE_V: 'VBAT_VOLTAGE_V',
	VPACK_VOLTAGE_V: 'VPACK_VOLTAGE_V',
	VLOAD_VOLTAGE_V: 'VLOAD_VOLTAGE_V',
	PACK_CURRENT_A: 'PACK_CURRENT_A',

	HIGHEST_CELL_VOLTAGE_MV: 'HIGHEST_CELL_VOLTAGE_MV',
	LOWEST_CELL_VOLTAGE_MV: 'LOWEST_CELL_VOLTAGE_MV',
	AVG_CELL_VOLTAGE_MV: 'AVG_CELL_VOLTAGE_MV',
	MAX_CELL_DIFF_MV: 'MAX_CELL_DIFF_MV',
	HIGHEST_CELL_INDEX: 'HIGHEST_CELL_INDEX',
	LOWEST_CELL_INDEX: 'LOWEST_CELL_INDEX',

	CHARGE_MOS_TEMP_C: 'CHARGE_MOS_TEMP_C',
	DISCHARGE_MOS_TEMP_C: 'DISCHARGE_MOS_TEMP_C',
	PRECHARGE_MOS_TEMP_C: 'PRECHARGE_MOS_TEMP_C',
	AMBIENT_TEMP_C: 'AMBIENT_TEMP_C',
	HEATING_FILM_TEMP_C: 'HEATING_FILM_TEMP_C',
	POLE_TEMP_C: 'POLE_TEMP_C',
	HIGHEST_TEMP: 'HIGHEST_TEMP',
	LOWEST_TEMP: 'LOWEST_TEMP',

	PROTECTION_STATUS: 'PROTECTION_STATUS',
	INDICATOR_STATUS: 'INDICATOR_STATUS',
	ALARM_STATUS: 'ALARM_STATUS',
	CUSTOM_STATUS_U32: 'CUSTOM_STATUS_U32',

	PRODUCTION_DATE: 'PRODUCTION_DATE',
	CUSTOM_PARAMS: 'CUSTOM_PARAMS',

	CELL_VOLTAGES_MV: 'CELL_VOLTAGES_MV',
	CELL_TEMPS_C: 'CELL_TEMPS_C',
	CELL_BALANCING: 'CELL_BALANCING',

	HARDWARE_MODEL: 'HARDWARE_MODEL',
	BOARD_CODE: 'BOARD_CODE',
	BLUETOOTH_MAC: 'BLUETOOTH_MAC',
} as const);

export type BmsStatusParamKey = (typeof BMS_STATUS_PARAM)[keyof typeof BMS_STATUS_PARAM]

export type AnyParamKey = BmsParamKey | BmsStatusParamKey

export const PARAM_CATEGORIES = Object.freeze({
	// 电压配置类（0x400~）
	VOLTAGE: 'voltage',
	// 电流配置类（0x420~）
	CURRENT: 'current',
	// 温度配置类（0x438~）
	TEMPERATURE: 'temperature',
	// 其他配置类（0x458~）
	OTHER: 'other',
	// 字符串/编号配置类（0x500~、0x53A~）
	STRING: 'string',
	// 系统寄存器类（如 0x0001、0x0030~）
	SYSTEM: 'system',
	// 主要状态寄存器类（doc/oriigin/device_comm_protocol_basic.md 0x100~，只读）
	STATUS: 'status',
} as const);

export type ParamCategory = (typeof PARAM_CATEGORIES)[keyof typeof PARAM_CATEGORIES]

type ParamDefInput =
	| { label?: string; valueType: 'statusPath'; path: string; access: 'R'; unit?: string }
	| { label?: string; valueType: 'u16'; address: number; access: 'R' | 'RW'; scale?: number; offset?: number; unit?: string }
	| { label?: string; valueType: 'u32'; address: number; access: 'R' | 'RW'; scale?: number; offset?: number; unit?: string }
	| { label?: string; valueType: 'u8'; address: number; byte: 'H' | 'L'; access: 'R' | 'RW'; scale?: number; offset?: number; unit?: string }
	| { label?: string; valueType: 'str'; startAddress: number; byteLength: number; encoding?: 'ascii'; access: 'R' | 'RW'; unit?: string }

function def(key: AnyParamKey, category: ParamCategory, spec: ParamDefInput): BmsParamDef {
	const { label, ...rest } = spec || {};
	return Object.freeze({ key, category, label: label ?? '', ...(rest as Omit<ParamDefInput, 'label'>) }) as BmsParamDef;
}

// valueType:
// - u8: needs { byte: 'H'|'L', scale?, offset? }
// - u16: needs { scale?, offset? }
// - u32: needs { scale?, offset? } (2 registers, big-endian)
// - str: needs { startAddress, byteLength }
export const PARAM_DEFS = Object.freeze([
	// --- Status (0x100~) ReadOnly
	def(BMS_STATUS_PARAM.SERIES_COUNT, PARAM_CATEGORIES.STATUS, { label: '电池串数', valueType: 'statusPath', path: 'meta.seriesCount', access: 'R' }),
	def(BMS_STATUS_PARAM.CELL_TEMP_COUNT, PARAM_CATEGORIES.STATUS, { label: '电芯温度数量', valueType: 'statusPath', path: 'meta.cellTempCount', access: 'R' }),
	def(BMS_STATUS_PARAM.HARDWARE_VERSION, PARAM_CATEGORIES.STATUS, { label: '硬件版本号', valueType: 'statusPath', path: 'meta.hardwareVersion', access: 'R' }),
	def(BMS_STATUS_PARAM.SOFTWARE_VERSION, PARAM_CATEGORIES.STATUS, { label: '软件版本号', valueType: 'statusPath', path: 'meta.softwareVersion', access: 'R' }),
	def(BMS_STATUS_PARAM.SPECIAL_ID, PARAM_CATEGORIES.STATUS, { label: '特殊识别符', valueType: 'statusPath', path: 'meta.specialId', access: 'R' }),
	def(BMS_STATUS_PARAM.PROTOCOL_VERSION, PARAM_CATEGORIES.STATUS, { label: '协议版本号', valueType: 'statusPath', path: 'meta.protocolVersion', access: 'R' }),

	def(BMS_STATUS_PARAM.DESIGN_CAPACITY_MAH, PARAM_CATEGORIES.STATUS, { label: '设计容量', valueType: 'statusPath', path: 'energy.designCapacityMah', access: 'R' }),
	def(BMS_STATUS_PARAM.REMAINING_CAPACITY_MAH, PARAM_CATEGORIES.STATUS, { label: '剩余容量', valueType: 'statusPath', path: 'energy.remainingCapacityMah', access: 'R' }),
	def(BMS_STATUS_PARAM.FULL_CAPACITY_MAH, PARAM_CATEGORIES.STATUS, { label: '满充容量', valueType: 'statusPath', path: 'energy.fullCapacityMah', access: 'R' }),
	def(BMS_STATUS_PARAM.FULL_WH, PARAM_CATEGORIES.STATUS, { label: '满充WH', valueType: 'statusPath', path: 'energy.fullWh', access: 'R' }),
	def(BMS_STATUS_PARAM.REMAINING_WH, PARAM_CATEGORIES.STATUS, { label: 'SOE(剩余WH)', valueType: 'statusPath', path: 'energy.remainingWh', access: 'R' }),
	def(BMS_STATUS_PARAM.SOC_PCT, PARAM_CATEGORIES.STATUS, { label: 'SOC(剩余容量比)', valueType: 'statusPath', path: 'energy.socPct', access: 'R' }),
	def(BMS_STATUS_PARAM.SOH_PCT, PARAM_CATEGORIES.STATUS, { label: 'SOH(健康度)', valueType: 'statusPath', path: 'energy.sohPct', access: 'R' }),
	def(BMS_STATUS_PARAM.CYCLE_COUNT, PARAM_CATEGORIES.STATUS, { label: '循环次数', valueType: 'statusPath', path: 'energy.cycleCount', access: 'R' }),

	def(BMS_STATUS_PARAM.MAX_CHARGE_INTERVAL_HOURS, PARAM_CATEGORIES.STATUS, { label: '最长充电间隔', valueType: 'statusPath', path: 'timing.maxChargeIntervalHours', access: 'R' }),
	def(BMS_STATUS_PARAM.CURRENT_CHARGE_INTERVAL_HOURS, PARAM_CATEGORIES.STATUS, { label: '当前充电间隔', valueType: 'statusPath', path: 'timing.currentChargeIntervalHours', access: 'R' }),
	def(BMS_STATUS_PARAM.DISCHARGE_REMAINING_MIN, PARAM_CATEGORIES.STATUS, { label: '放电剩余时间', valueType: 'statusPath', path: 'timing.dischargeRemainingMin', access: 'R' }),
	def(BMS_STATUS_PARAM.CHARGE_REMAINING_MIN, PARAM_CATEGORIES.STATUS, { label: '充电剩余时间', valueType: 'statusPath', path: 'timing.chargeRemainingMin', access: 'R' }),
	def(BMS_STATUS_PARAM.CHARGE_COUNT, PARAM_CATEGORIES.STATUS, { label: '充电次数', valueType: 'statusPath', path: 'timing.chargeCount', access: 'R' }),
	def(BMS_STATUS_PARAM.DISCHARGE_COUNT, PARAM_CATEGORIES.STATUS, { label: '放电次数', valueType: 'statusPath', path: 'timing.dischargeCount', access: 'R' }),
	def(BMS_STATUS_PARAM.BMS_TIMESTAMP, PARAM_CATEGORIES.STATUS, { label: 'BMS时间', valueType: 'statusPath', path: 'timing.bmsTimestamp', access: 'R' }),
	def(BMS_STATUS_PARAM.POWER_ON_WORK_HOURS, PARAM_CATEGORIES.STATUS, { label: '上电工作时间', valueType: 'statusPath', path: 'timing.powerOnWorkHours', access: 'R' }),
	def(BMS_STATUS_PARAM.TOTAL_CHARGE_CAPACITY_RAW, PARAM_CATEGORIES.STATUS, { label: '总充容量', valueType: 'statusPath', path: 'energy.totalChargeCapacityRaw', access: 'R' }),

	def(BMS_STATUS_PARAM.PACK_CELL_SUM_VOLTAGE_V, PARAM_CATEGORIES.STATUS, { label: '电池组总电压', valueType: 'statusPath', path: 'electrical.packCellSumVoltageV', access: 'R' }),
	def(BMS_STATUS_PARAM.VBAT_VOLTAGE_V, PARAM_CATEGORIES.STATUS, { label: 'VBat电压', valueType: 'statusPath', path: 'electrical.vBatV', access: 'R' }),
	def(BMS_STATUS_PARAM.VPACK_VOLTAGE_V, PARAM_CATEGORIES.STATUS, { label: 'VPack电压', valueType: 'statusPath', path: 'electrical.vPackV', access: 'R' }),
	def(BMS_STATUS_PARAM.VLOAD_VOLTAGE_V, PARAM_CATEGORIES.STATUS, { label: 'VLoad电压', valueType: 'statusPath', path: 'electrical.vLoadV', access: 'R' }),
	def(BMS_STATUS_PARAM.PACK_CURRENT_A, PARAM_CATEGORIES.STATUS, { label: '电池组电流', valueType: 'statusPath', path: 'electrical.currentA', access: 'R' }),

	def(BMS_STATUS_PARAM.HIGHEST_CELL_VOLTAGE_MV, PARAM_CATEGORIES.STATUS, { label: '最高电压', valueType: 'statusPath', path: 'electrical.highestCellVoltageMv', access: 'R' }),
	def(BMS_STATUS_PARAM.LOWEST_CELL_VOLTAGE_MV, PARAM_CATEGORIES.STATUS, { label: '最低电压', valueType: 'statusPath', path: 'electrical.lowestCellVoltageMv', access: 'R' }),
	def(BMS_STATUS_PARAM.AVG_CELL_VOLTAGE_MV, PARAM_CATEGORIES.STATUS, { label: '平均电压', valueType: 'statusPath', path: 'electrical.avgCellVoltageMv', access: 'R' }),
	def(BMS_STATUS_PARAM.MAX_CELL_DIFF_MV, PARAM_CATEGORIES.STATUS, { label: '最大压差', valueType: 'statusPath', path: 'electrical.maxCellVoltageDiffMv', access: 'R' }),
	def(BMS_STATUS_PARAM.HIGHEST_CELL_INDEX, PARAM_CATEGORIES.STATUS, { label: '最高电压电芯编号', valueType: 'statusPath', path: 'electrical.cellVoltageIndex.highest', access: 'R' }),
	def(BMS_STATUS_PARAM.LOWEST_CELL_INDEX, PARAM_CATEGORIES.STATUS, { label: '最低电压电芯编号', valueType: 'statusPath', path: 'electrical.cellVoltageIndex.lowest', access: 'R' }),

	def(BMS_STATUS_PARAM.CHARGE_MOS_TEMP_C, PARAM_CATEGORIES.STATUS, { label: '充电MOS温度', valueType: 'statusPath', path: 'temperature.chargeMosC', access: 'R' }),
	def(BMS_STATUS_PARAM.DISCHARGE_MOS_TEMP_C, PARAM_CATEGORIES.STATUS, { label: '放电MOS温度', valueType: 'statusPath', path: 'temperature.dischargeMosC', access: 'R' }),
	def(BMS_STATUS_PARAM.PRECHARGE_MOS_TEMP_C, PARAM_CATEGORIES.STATUS, { label: '预充MOS温度', valueType: 'statusPath', path: 'temperature.prechargeMosC', access: 'R' }),
	def(BMS_STATUS_PARAM.AMBIENT_TEMP_C, PARAM_CATEGORIES.STATUS, { label: '环境温度', valueType: 'statusPath', path: 'temperature.ambientC', access: 'R' }),
	def(BMS_STATUS_PARAM.HEATING_FILM_TEMP_C, PARAM_CATEGORIES.STATUS, { label: '加热膜温度', valueType: 'statusPath', path: 'temperature.heatingFilmC', access: 'R' }),
	def(BMS_STATUS_PARAM.POLE_TEMP_C, PARAM_CATEGORIES.STATUS, { label: '极柱温度', valueType: 'statusPath', path: 'temperature.poleC', access: 'R' }),
	def(BMS_STATUS_PARAM.HIGHEST_TEMP, PARAM_CATEGORIES.STATUS, { label: '最高温度', valueType: 'statusPath', path: 'temperature.highestTemp', access: 'R' }),
	def(BMS_STATUS_PARAM.LOWEST_TEMP, PARAM_CATEGORIES.STATUS, { label: '最低温度', valueType: 'statusPath', path: 'temperature.lowestTemp', access: 'R' }),

	def(BMS_STATUS_PARAM.PROTECTION_STATUS, PARAM_CATEGORIES.STATUS, { label: '保护状态', valueType: 'statusPath', path: 'status.protectionStatus', access: 'R' }),
	def(BMS_STATUS_PARAM.INDICATOR_STATUS, PARAM_CATEGORIES.STATUS, { label: '指示状态', valueType: 'statusPath', path: 'status.indicatorStatus', access: 'R' }),
	def(BMS_STATUS_PARAM.ALARM_STATUS, PARAM_CATEGORIES.STATUS, { label: '告警状态', valueType: 'statusPath', path: 'status.alarmStatus', access: 'R' }),
	def(BMS_STATUS_PARAM.CUSTOM_STATUS_U32, PARAM_CATEGORIES.STATUS, { label: '自定义状态', valueType: 'statusPath', path: 'status.customStatus', access: 'R' }),

	def(BMS_STATUS_PARAM.PRODUCTION_DATE, PARAM_CATEGORIES.STATUS, { label: '生产日期', valueType: 'statusPath', path: 'meta.productionDate', access: 'R' }),
	def(BMS_STATUS_PARAM.CUSTOM_PARAMS, PARAM_CATEGORIES.STATUS, { label: '自定义参数[8]', valueType: 'statusPath', path: 'customParams', access: 'R' }),

	def(BMS_STATUS_PARAM.CELL_VOLTAGES_MV, PARAM_CATEGORIES.STATUS, { label: '电芯电压[S]', valueType: 'statusPath', path: 'cell.voltagesMv', access: 'R' }),
	def(BMS_STATUS_PARAM.CELL_TEMPS_C, PARAM_CATEGORIES.STATUS, { label: '电芯温度[N]', valueType: 'statusPath', path: 'temperature.cellTempsC', access: 'R' }),
	def(BMS_STATUS_PARAM.CELL_BALANCING, PARAM_CATEGORIES.STATUS, { label: '均衡状态', valueType: 'statusPath', path: 'cell.balancing', access: 'R' }),

	def(BMS_STATUS_PARAM.HARDWARE_MODEL, PARAM_CATEGORIES.STATUS, { label: '硬件型号', valueType: 'statusPath', path: 'identity.hardwareModel', access: 'R' }),
	def(BMS_STATUS_PARAM.BOARD_CODE, PARAM_CATEGORIES.STATUS, { label: 'BMS板编码', valueType: 'statusPath', path: 'identity.boardCode', access: 'R' }),
	def(BMS_STATUS_PARAM.BLUETOOTH_MAC, PARAM_CATEGORIES.STATUS, { label: '蓝牙MAC地址', valueType: 'statusPath', path: 'identity.bluetoothMac', access: 'R' }),

	// --- Voltage (0x400~)
	def(BMS_PARAM.CELL_OV_ALARM_V, PARAM_CATEGORIES.VOLTAGE, { label: '单体过压告警电压', access: 'RW', valueType: 'u16', address: 0x400, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.CELL_OC_PROTECT_V, PARAM_CATEGORIES.VOLTAGE, { label: '单体过充保护电压', access: 'RW', valueType: 'u16', address: 0x401, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.CELL_OC_ALARM_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过充告警延时', access: 'RW', valueType: 'u8', address: 0x402, byte: 'L', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.CELL_OC_PROTECT_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过充保护延时', access: 'RW', valueType: 'u8', address: 0x402, byte: 'H', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.NORMAL_LOW_TEMP_THRESHOLD_C, PARAM_CATEGORIES.VOLTAGE, { label: '常温低温阀值温度', access: 'RW', valueType: 'u8', address: 0x403, byte: 'H', offset: -40, scale: 1, unit: '°C' }),
	def(BMS_PARAM.CELL_OV_PROTECT_RELEASE_V, PARAM_CATEGORIES.VOLTAGE, { label: '单体过压保护解除电压', access: 'RW', valueType: 'u16', address: 0x404, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.CELL_OC_ALARM_RELEASE_DELTA_V, PARAM_CATEGORIES.VOLTAGE, { label: '单体过充告警解除电压差', access: 'RW', valueType: 'u16', address: 0x405, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.CAPACITY_RELEASE_SOC_PCT, PARAM_CATEGORIES.VOLTAGE, { label: '容量解除', access: 'RW', valueType: 'u16', address: 0x406, scale: 1, unit: '%' }),
	def(BMS_PARAM.OV_DISCHARGE_RELEASE_A, PARAM_CATEGORIES.VOLTAGE, { label: '过压放电解除电流', access: 'RW', valueType: 'u8', address: 0x407, byte: 'L', scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.UV_CHARGE_RELEASE_A, PARAM_CATEGORIES.VOLTAGE, { label: '欠压充电解除电流', access: 'RW', valueType: 'u8', address: 0x407, byte: 'H', scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.CELL_OV_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过压告警解除延时', access: 'RW', valueType: 'u8', address: 0x408, byte: 'L', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.CELL_OV_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过压保护解除延时', access: 'RW', valueType: 'u8', address: 0x408, byte: 'H', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.NORMAL_CELL_UV_ALARM_V, PARAM_CATEGORIES.VOLTAGE, { label: '常温单体过放告警电压', access: 'RW', valueType: 'u16', address: 0x409, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.NORMAL_CELL_UV_PROTECT_V, PARAM_CATEGORIES.VOLTAGE, { label: '常温单体过放保护电压', access: 'RW', valueType: 'u16', address: 0x40a, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.LOW_TEMP_CELL_UV_ALARM_V, PARAM_CATEGORIES.VOLTAGE, { label: '低温单体过放告警电压', access: 'RW', valueType: 'u16', address: 0x40b, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.LOW_TEMP_CELL_UV_PROTECT_V, PARAM_CATEGORIES.VOLTAGE, { label: '低温单体过放保护电压', access: 'RW', valueType: 'u16', address: 0x40c, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.CELL_UV_ALARM_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过放告警延时', access: 'RW', valueType: 'u8', address: 0x40d, byte: 'L', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.CELL_UV_PROTECT_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过放保护延时', access: 'RW', valueType: 'u8', address: 0x40e, byte: 'H', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.CELL_UV_PROTECT_RELEASE_V, PARAM_CATEGORIES.VOLTAGE, { label: '单体过放保护解除电压', access: 'RW', valueType: 'u16', address: 0x40f, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.CELL_UV_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过放告警解除延时', access: 'RW', valueType: 'u8', address: 0x410, byte: 'L', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.CELL_UV_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '单体过放保护解除延时', access: 'RW', valueType: 'u8', address: 0x410, byte: 'H', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.PACK_OV_ALARM_V, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压告警电压', access: 'RW', valueType: 'u16', address: 0x411, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.PACK_OV_PROTECT_V, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压保护电压', access: 'RW', valueType: 'u16', address: 0x412, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.PACK_OV_PROTECT_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压保护延时', access: 'RW', valueType: 'u8', address: 0x413, byte: 'L', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.PACK_OV_ALARM_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压告警延时', access: 'RW', valueType: 'u8', address: 0x413, byte: 'H', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.PACK_OV_ALARM_RELEASE_V, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压告警解除电压', access: 'RW', valueType: 'u16', address: 0x414, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.PACK_OV_PROTECT_RELEASE_V, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压保护解除电压', access: 'RW', valueType: 'u16', address: 0x415, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.PACK_OV_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压解除延时', access: 'RW', valueType: 'u8', address: 0x416, byte: 'L', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.PACK_OV_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过压告警解除延时', access: 'RW', valueType: 'u8', address: 0x416, byte: 'H', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.NORMAL_PACK_UV_ALARM_V, PARAM_CATEGORIES.VOLTAGE, { label: '常温总压过放告警电压', access: 'RW', valueType: 'u16', address: 0x417, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.NORMAL_PACK_UV_PROTECT_V, PARAM_CATEGORIES.VOLTAGE, { label: '常温总压过放保护电压', access: 'RW', valueType: 'u16', address: 0x418, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.LOW_TEMP_PACK_UV_ALARM_V, PARAM_CATEGORIES.VOLTAGE, { label: '低温总压过放告警电压', access: 'RW', valueType: 'u16', address: 0x419, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.LOW_TEMP_PACK_UV_PROTECT_V, PARAM_CATEGORIES.VOLTAGE, { label: '低温总压过放保护电压', access: 'RW', valueType: 'u16', address: 0x41a, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.PACK_UV_ALARM_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过放告警延时', access: 'RW', valueType: 'u8', address: 0x41b, byte: 'L', scale: 0.1, unit: 's' }),
		def(BMS_PARAM.PACK_UV_PROTECT_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过放保护延时', access: 'RW', valueType: 'u8', address: 0x41b, byte: 'H', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.PACK_UV_ALARM_RELEASE_V, PARAM_CATEGORIES.VOLTAGE, { label: '总压过放告警解除电压', access: 'RW', valueType: 'u16', address: 0x41c, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.PACK_UV_PROTECT_RELEASE_V, PARAM_CATEGORIES.VOLTAGE, { label: '总压过放保护解除电压', access: 'RW', valueType: 'u16', address: 0x41d, scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.PACK_UV_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过放告警解除延时', access: 'RW', valueType: 'u8', address: 0x41e, byte: 'L', scale: 0.1, unit: 's' }),
	def(BMS_PARAM.PACK_UV_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.VOLTAGE, { label: '总压过放保护解除延时', access: 'RW', valueType: 'u8', address: 0x41e, byte: 'H', scale: 0.1, unit: 's' }),

	// --- Current (0x420~)
	def(BMS_PARAM.CHARGE_OC_PROTECT_SMALL_A, PARAM_CATEGORIES.CURRENT, { label: '充电过流保护小电流', access: 'RW', valueType: 'u16', address: 0x420, scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.CHARGE_OC_PROTECT_LARGE_A, PARAM_CATEGORIES.CURRENT, { label: '充电过流保护大电流', access: 'RW', valueType: 'u16', address: 0x421, scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.CHARGE_OC_ALARM_DELAY_S, PARAM_CATEGORIES.CURRENT, { label: '充电过流告警延时', access: 'RW', valueType: 'u8', address: 0x422, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.CHARGE_OC_PROTECT_LARGE_DELAY_S, PARAM_CATEGORIES.CURRENT, { label: '充电过流保护大电流延时', access: 'RW', valueType: 'u8', address: 0x422, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.CHARGE_OC_PROTECT_SMALL_DELAY_S, PARAM_CATEGORIES.CURRENT, { label: '充电过流保护小电流延时', access: 'RW', valueType: 'u8', address: 0x423, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.CHARGE_OC_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.CURRENT, { label: '充电过流告警解除延时', access: 'RW', valueType: 'u8', address: 0x424, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.AUTO_RELEASE_TIME_MIN, PARAM_CATEGORIES.CURRENT, { label: '自动解除时间', access: 'RW', valueType: 'u8', address: 0x424, byte: 'H', scale: 1, unit: 'min' }),
	def(BMS_PARAM.CHARGE_OC_ALARM_RELEASE_A, PARAM_CATEGORIES.CURRENT, { label: '充电过流告警解电流', access: 'RW', valueType: 'u16', address: 0x425, scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.DISCHARGE_RELEASE_A, PARAM_CATEGORIES.CURRENT, { label: '放电解除电流', access: 'RW', valueType: 'u8', address: 0x426, byte: 'L', scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.AUTO_RELEASE_LOCK_COUNT, PARAM_CATEGORIES.CURRENT, { label: '自动解除锁定次数', access: 'RW', valueType: 'u8', address: 0x426, byte: 'H', scale: 1, unit: 'count' }),
	def(BMS_PARAM.DISCHARGE_OC_ALARM_A, PARAM_CATEGORIES.CURRENT, { label: '放电过流告警电流', access: 'RW', valueType: 'u16', address: 0x427, scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.DISCHARGE_OC_PROTECT_SMALL_A, PARAM_CATEGORIES.CURRENT, { label: '放电过流小电流保护电流', access: 'RW', valueType: 'u16', address: 0x428, scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.DISCHARGE_OC_PROTECT_LARGE_A, PARAM_CATEGORIES.CURRENT, { label: '放电过流大电流保护电流', access: 'RW', valueType: 'u16', address: 0x429, scale: 0.1, unit: 'A' }),
	// NOTE: The doc lists "放电过流告警延时" at 0x429 L, which conflicts with the 2-byte current at 0x429.
	// In practice it is commonly paired with the "大电流保护延时" register at 0x42A (L/H). This mapping uses 0x42A L.
	def(BMS_PARAM.DISCHARGE_OC_ALARM_DELAY_S, PARAM_CATEGORIES.CURRENT, { label: '放电过流告警延时', access: 'RW', valueType: 'u8', address: 0x42a, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.DISCHARGE_OC_PROTECT_LARGE_DELAY_S, PARAM_CATEGORIES.CURRENT, { label: '放电过流大电流保护延时', access: 'RW', valueType: 'u8', address: 0x42a, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.DISCHARGE_OC_PROTECT_SMALL_DELAY_S, PARAM_CATEGORIES.CURRENT, { label: '放电过流小电流保护延时', access: 'RW', valueType: 'u8', address: 0x42b, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.DISCHARGE_OC_AUTO_RELEASE_TIME_MIN, PARAM_CATEGORIES.CURRENT, { label: '自动解除时间', access: 'RW', valueType: 'u8', address: 0x42b, byte: 'H', scale: 1, unit: 'min' }),
	def(BMS_PARAM.DISCHARGE_OC_ALARM_RELEASE_A, PARAM_CATEGORIES.CURRENT, { label: '放电过流告警解除电流', access: 'RW', valueType: 'u16', address: 0x42c, scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.CHARGE_RELEASE_A, PARAM_CATEGORIES.CURRENT, { label: '充电解除电流', access: 'RW', valueType: 'u8', address: 0x42d, byte: 'L', scale: 0.1, unit: 'A' }),
	def(BMS_PARAM.CHARGE_LOCK_COUNT, PARAM_CATEGORIES.CURRENT, { label: '锁定次数', access: 'RW', valueType: 'u8', address: 0x42d, byte: 'H', scale: 1, unit: 'count' }),

	// --- Temperature (0x438~)
	def(BMS_PARAM.MOS_OT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS过温告警温度', access: 'RW', valueType: 'u8', address: 0x438, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.MOS_OT_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS过温保护温度', access: 'RW', valueType: 'u8', address: 0x438, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.MOS_OT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS过温告警解温度', access: 'RW', valueType: 'u8', address: 0x439, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.MOS_OT_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS保护解除温度', access: 'RW', valueType: 'u8', address: 0x439, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.MOS_OT_ALARM_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS过温告警延时', access: 'RW', valueType: 'u8', address: 0x43a, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.MOS_OT_PROTECT_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS过温保护延时', access: 'RW', valueType: 'u8', address: 0x43a, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.MOS_OT_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS过温告警解除延时', access: 'RW', valueType: 'u8', address: 0x43b, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.MOS_OT_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: 'MOS过温保护解除延时', access: 'RW', valueType: 'u8', address: 0x43b, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.AMBIENT_OT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过温告警温度', access: 'RW', valueType: 'u8', address: 0x43c, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_OT_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过温保护温度', access: 'RW', valueType: 'u8', address: 0x43c, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_OT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过温告警解温度', access: 'RW', valueType: 'u8', address: 0x43d, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_OT_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过保护解除温度', access: 'RW', valueType: 'u8', address: 0x43d, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_UT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境低温告警温度', access: 'RW', valueType: 'u8', address: 0x43e, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_UT_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境低温保护温度', access: 'RW', valueType: 'u8', address: 0x43e, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_UT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境低温告警解温度', access: 'RW', valueType: 'u8', address: 0x43f, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_UT_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '环境低温保护解除温度', access: 'RW', valueType: 'u8', address: 0x43f, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.AMBIENT_OT_ALARM_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过温告警延时', access: 'RW', valueType: 'u8', address: 0x440, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.AMBIENT_OT_PROTECT_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过温保护延时', access: 'RW', valueType: 'u8', address: 0x440, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.AMBIENT_OT_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过温告警解除延时', access: 'RW', valueType: 'u8', address: 0x441, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.AMBIENT_OT_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '环境过温保护解除延时', access: 'RW', valueType: 'u8', address: 0x441, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.CHARGE_UT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电低温告警温度', access: 'RW', valueType: 'u8', address: 0x442, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_UT_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电低温保护温度', access: 'RW', valueType: 'u8', address: 0x442, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_UT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电低温警告解除温度', access: 'RW', valueType: 'u8', address: 0x443, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_UT_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电低温保护解除温度', access: 'RW', valueType: 'u8', address: 0x443, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_OT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温告警温度', access: 'RW', valueType: 'u8', address: 0x444, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_OT_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温保护温度', access: 'RW', valueType: 'u8', address: 0x444, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_OT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温告警解除温度', access: 'RW', valueType: 'u8', address: 0x445, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_OT_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温保护解除温度', access: 'RW', valueType: 'u8', address: 0x445, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CHARGE_OT_ALARM_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温告警延时', access: 'RW', valueType: 'u8', address: 0x446, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.CHARGE_OT_PROTECT_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温保护延时', access: 'RW', valueType: 'u8', address: 0x446, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.CHARGE_OT_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温告警解除延时', access: 'RW', valueType: 'u8', address: 0x447, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.CHARGE_OT_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '充电高温保护解除延时', access: 'RW', valueType: 'u8', address: 0x447, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.DISCHARGE_UT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电低温告警温度', access: 'RW', valueType: 'u8', address: 0x448, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_UT_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电低温保护温度', access: 'RW', valueType: 'u8', address: 0x448, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_UT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电低温告警解除温度', access: 'RW', valueType: 'u8', address: 0x449, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_UT_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电低温保护解除温度', access: 'RW', valueType: 'u8', address: 0x449, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_OT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温告警温度', access: 'RW', valueType: 'u8', address: 0x44a, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_OT_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温保护温度', access: 'RW', valueType: 'u8', address: 0x44a, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_OT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温警告解除温度', access: 'RW', valueType: 'u8', address: 0x44b, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_OT_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温保护解除温度', access: 'RW', valueType: 'u8', address: 0x44c, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DISCHARGE_OT_ALARM_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温告警延时', access: 'RW', valueType: 'u8', address: 0x44d, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.DISCHARGE_OT_PROTECT_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温保护延时', access: 'RW', valueType: 'u8', address: 0x44e, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.DISCHARGE_OT_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温告警解除延时', access: 'RW', valueType: 'u8', address: 0x44f, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.DISCHARGE_OT_PROTECT_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '放电高温保护解除延时', access: 'RW', valueType: 'u8', address: 0x450, byte: 'L', scale: 1, unit: 's' }),
	// The doc repeats addresses for the following 1-byte fields without explicit H/L;
	// here we map them as L then H within the same register.
	def(BMS_PARAM.CELL_OT_ALARM_C, PARAM_CATEGORIES.TEMPERATURE, { label: '电芯高温告警温度', access: 'RW', valueType: 'u8', address: 0x451, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CELL_THERMAL_RUNAWAY_C, PARAM_CATEGORIES.TEMPERATURE, { label: '热失控电芯温度', access: 'RW', valueType: 'u8', address: 0x451, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CELL_OT_ALARM_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '电芯高温告警解除温度', access: 'RW', valueType: 'u8', address: 0x452, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.CELL_OT_ALARM_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '高温告警延时', access: 'RW', valueType: 'u8', address: 0x452, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.CELL_OT_ALARM_RELEASE_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '高温告警解除延时', access: 'RW', valueType: 'u8', address: 0x453, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.HEAT_CELL_ON_C, PARAM_CATEGORIES.TEMPERATURE, { label: '加热电芯开启温度', access: 'RW', valueType: 'u8', address: 0x453, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.HEAT_CELL_OFF_C, PARAM_CATEGORIES.TEMPERATURE, { label: '加热电芯关闭温度', access: 'RW', valueType: 'u8', address: 0x454, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.HEAT_FILM_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '加热膜温度保护温度', access: 'RW', valueType: 'u8', address: 0x454, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.HEAT_FILM_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '加热膜温度保护恢复温度', access: 'RW', valueType: 'u8', address: 0x455, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.HEAT_ON_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '加热开启延时', access: 'RW', valueType: 'u8', address: 0x455, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.HEAT_OFF_DELAY_S, PARAM_CATEGORIES.TEMPERATURE, { label: '加热关闭延时', access: 'RW', valueType: 'u8', address: 0x456, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.POLE_TEMP_PROTECT_C, PARAM_CATEGORIES.TEMPERATURE, { label: '极柱温度保护温度', access: 'RW', valueType: 'u8', address: 0x456, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.POLE_TEMP_PROTECT_RELEASE_C, PARAM_CATEGORIES.TEMPERATURE, { label: '极柱温度保护恢复温度', access: 'RW', valueType: 'u8', address: 0x457, byte: 'L', scale: 1, offset: -40, unit: '°C' }),

	// --- Other (0x458~)
	def(BMS_PARAM.BALANCE_START_V, PARAM_CATEGORIES.OTHER, { label: '均衡开启电压', access: 'RW', valueType: 'u16', address: 0x458, scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.BALANCE_START_DELTA_V, PARAM_CATEGORIES.OTHER, { label: '开启压差', access: 'RW', valueType: 'u8', address: 0x459, byte: 'L', scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.BALANCE_STOP_DELTA_V, PARAM_CATEGORIES.OTHER, { label: '停止压差', access: 'RW', valueType: 'u8', address: 0x45a, byte: 'L', scale: 0.001, unit: 'V' }),
	def(BMS_PARAM.BALANCE_DISABLE_HIGH_TEMP_C, PARAM_CATEGORIES.OTHER, { label: '均衡功能高温禁止温度', access: 'RW', valueType: 'u8', address: 0x45a, byte: 'H', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.BALANCE_DISABLE_LOW_TEMP_C, PARAM_CATEGORIES.OTHER, { label: '均衡功能低温禁止温度', access: 'RW', valueType: 'u8', address: 0x45b, byte: 'L', scale: 1, offset: -40, unit: '°C' }),
	def(BMS_PARAM.DELTA_V_ALARM_THRESHOLD_V, PARAM_CATEGORIES.OTHER, { label: '压差报警压差', access: 'RW', valueType: 'u8', address: 0x45b, byte: 'H', scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.DELTA_V_ALARM_RELEASE_V, PARAM_CATEGORIES.OTHER, { label: '压差报警恢复压差', access: 'RW', valueType: 'u8', address: 0x45c, byte: 'L', scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.DELTA_V_PROTECT_THRESHOLD_V, PARAM_CATEGORIES.OTHER, { label: '压差保护压差', access: 'RW', valueType: 'u8', address: 0x45c, byte: 'H', scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.DELTA_V_PROTECT_RELEASE_V, PARAM_CATEGORIES.OTHER, { label: '压差保护恢复压差', access: 'RW', valueType: 'u8', address: 0x45d, byte: 'L', scale: 0.01, unit: 'V' }),
	def(BMS_PARAM.DELTA_V_PROTECT_DELAY_S, PARAM_CATEGORIES.OTHER, { label: '压差保护延时', access: 'RW', valueType: 'u8', address: 0x45d, byte: 'H', scale: 1, unit: 's' }),
	def(BMS_PARAM.DELTA_V_RELEASE_DELAY_S, PARAM_CATEGORIES.OTHER, { label: '压差解除延时', access: 'RW', valueType: 'u8', address: 0x45e, byte: 'L', scale: 1, unit: 's' }),
	def(BMS_PARAM.TEMP_DIFF_ALARM_THRESHOLD_C, PARAM_CATEGORIES.OTHER, { label: '温差报警阈值', access: 'RW', valueType: 'u8', address: 0x45e, byte: 'H', scale: 1, unit: '°C' }),
	def(BMS_PARAM.TEMP_DIFF_ALARM_RELEASE_C, PARAM_CATEGORIES.OTHER, { label: '温差报警恢复阈值', access: 'RW', valueType: 'u8', address: 0x45f, byte: 'L', scale: 1, unit: '°C' }),
	def(BMS_PARAM.TEMP_DIFF_PROTECT_THRESHOLD_C, PARAM_CATEGORIES.OTHER, { label: '温差保护阈值', access: 'RW', valueType: 'u8', address: 0x45f, byte: 'H', scale: 1, unit: '°C' }),
	def(BMS_PARAM.TEMP_DIFF_PROTECT_RELEASE_C, PARAM_CATEGORIES.OTHER, { label: '温差保护恢复阈值', access: 'RW', valueType: 'u8', address: 0x460, byte: 'L', scale: 1, unit: '°C' }),
	def(BMS_PARAM.TEMP_DIFF_PROTECT_DELAY_S, PARAM_CATEGORIES.OTHER, { label: '温差保护延时', access: 'RW', valueType: 'u8', address: 0x460, byte: 'H', scale: 1, unit: 's' }),

	// --- Strings
	def(BMS_PARAM.BATTERY_GROUP_ID, PARAM_CATEGORIES.STRING, { label: '电池组编号', access: 'RW', valueType: 'str', startAddress: 0x500, byteLength: 32, encoding: 'ascii' }),
	def(BMS_PARAM.DTU_DOMAIN_PORT, PARAM_CATEGORIES.STRING, { label: 'DTU域名和端口地址', access: 'RW', valueType: 'str', startAddress: 0x53a, byteLength: 108, encoding: 'ascii' }),

	// --- System
	def(BMS_PARAM.SERIES_COUNT_CONFIG, PARAM_CATEGORIES.SYSTEM, { label: '高低串数配置', access: 'RW', valueType: 'u16', address: 0x0001 }),
	def(BMS_PARAM.DESIGN_CAPACITY_AH, PARAM_CATEGORIES.SYSTEM, { label: '设计容量', access: 'RW', valueType: 'u32', address: 0x0030, scale: 0.001, unit: 'Ah' }), // 48~49
	def(BMS_PARAM.FULL_CAPACITY_AH, PARAM_CATEGORIES.SYSTEM, { label: '满充容量', access: 'RW', valueType: 'u32', address: 0x0032, scale: 0.001, unit: 'Ah' }), // 50~51
	def(BMS_PARAM.REMAIN_CAPACITY_AH, PARAM_CATEGORIES.SYSTEM, { label: '剩余容量', access: 'RW', valueType: 'u32', address: 0x0034, scale: 0.001, unit: 'Ah' }), // 52~53
	def(BMS_PARAM.FUNCTION_CONFIG, PARAM_CATEGORIES.SYSTEM, { label: '功能配置', access: 'RW', valueType: 'u16', address: 0x003e }),
]) as readonly BmsParamDef[];

export const PARAM_DEF_BY_KEY = Object.freeze(
	PARAM_DEFS.reduce<Record<string, BmsParamDef>>((acc, item) => {
		acc[item.key] = item;
		return acc;
	}, {})
);

export function listParamsByCategory(category: ParamCategory): string[] {
	return PARAM_DEFS.filter((d) => d.category === category).map((d) => d.key);
}

export function isKnownParamKey(key: string): boolean {
	return !!PARAM_DEF_BY_KEY[key];
}

export function normalizeParamKey(key: string): string | null {
	if (!key) return null;
	if (PARAM_DEF_BY_KEY[key]) return key;
	// accept camelCase keys derived from CONST_CASE
	const maybe = camelToConst(key);
	if (PARAM_DEF_BY_KEY[maybe]) return maybe;
	return null;
}

export function constToCamel(constKey: string): string {
	return constKey
		.toLowerCase()
		.replace(/_([a-z0-9])/g, (_: string, ch: string) => ch.toUpperCase());
}

export function camelToConst(camelKey: string): string {
	return String(camelKey)
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.toUpperCase();
}
