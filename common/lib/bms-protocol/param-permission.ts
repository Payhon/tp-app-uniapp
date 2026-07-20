import { getParamPermissionKey } from './param-registry'

export function canAccessDeviceParam(
	allowAll: boolean,
	grantedPermissionKeys: ReadonlySet<string>,
	actualKey: string
): boolean {
	if (allowAll) return true
	const permissionKey = getParamPermissionKey(actualKey)
	if (!permissionKey) return false
	return grantedPermissionKeys.has(permissionKey)
}
