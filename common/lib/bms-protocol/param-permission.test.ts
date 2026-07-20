import { canAccessDeviceParam } from './param-permission'

function assert(condition: unknown, message: string): void {
	if (!condition) throw new Error(message)
}

const noPermissions = new Set<string>()
assert(
	!canAccessDeviceParam(false, noPermissions, 'LOW_TEMP_CELL_UV_ALARM_V'),
	'restricted users without 40b permission must not see the low-temperature cell undervoltage alarm'
)
assert(
	!canAccessDeviceParam(false, noPermissions, 'LOW_TEMP_CELL_UV_PROTECT_V'),
	'restricted users without 40c permission must not see the low-temperature cell undervoltage protection'
)

const alarmOnly = new Set(['40b'])
assert(
	canAccessDeviceParam(false, alarmOnly, 'LOW_TEMP_CELL_UV_ALARM_V'),
	'40b permission should reveal the matching low-temperature cell undervoltage alarm'
)
assert(
	!canAccessDeviceParam(false, alarmOnly, 'LOW_TEMP_CELL_UV_PROTECT_V'),
	'40b permission must not reveal the 40c protection parameter'
)
assert(
	!canAccessDeviceParam(false, noPermissions, 'UNKNOWN_DEVICE_PARAM'),
	'unknown parameter keys must fail closed for restricted users'
)
assert(
	canAccessDeviceParam(true, noPermissions, 'UNKNOWN_DEVICE_PARAM'),
	'unrestricted administrators should retain allow-all behavior'
)
