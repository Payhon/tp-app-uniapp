import type { UserInfo } from '@/store/user'

export type HomeDeviceViewMode = 'self_bound' | 'org_added' | 'end_user_bound'

export const HOME_DEVICE_VIEW_MODE_STORAGE_KEY = 'homeDeviceViewMode'

export const HOME_DEVICE_VIEW_MODES: HomeDeviceViewMode[] = ['self_bound', 'org_added', 'end_user_bound']

export const isOrgUserLike = (userInfo: UserInfo | null | undefined): boolean => {
	const u = userInfo as Record<string, unknown> | null | undefined
	const kind = String(u?.user_kind || '').trim().toUpperCase()
	if (kind === 'ORG_USER') return true
	const authority = String(u?.authority || '').trim().toUpperCase()
	if (authority === 'TENANT_ADMIN' || authority === 'SYS_ADMIN') return true
	const orgID = String(u?.org_id || '').trim()
	const orgType = String(u?.org_type || '').trim()
	return Boolean(orgID || orgType)
}

export const normalizeHomeDeviceViewMode = (
	value: unknown,
	fallback: HomeDeviceViewMode = 'self_bound'
): HomeDeviceViewMode => {
	const text = String(value || '').trim().toLowerCase()
	if (HOME_DEVICE_VIEW_MODES.includes(text as HomeDeviceViewMode)) {
		return text as HomeDeviceViewMode
	}
	return fallback
}

export const resolveDefaultHomeDeviceViewMode = (userInfo: UserInfo | null | undefined): HomeDeviceViewMode => {
	return isOrgUserLike(userInfo) ? 'org_added' : 'self_bound'
}

export const resolveAddTrackingViewMode = (userInfo: UserInfo | null | undefined): HomeDeviceViewMode => {
	return isOrgUserLike(userInfo) ? 'org_added' : 'self_bound'
}

export const getStoredHomeDeviceViewMode = (
	userInfo: UserInfo | null | undefined
): HomeDeviceViewMode => {
	const fallback = resolveDefaultHomeDeviceViewMode(userInfo)
	return normalizeHomeDeviceViewMode(uni.getStorageSync(HOME_DEVICE_VIEW_MODE_STORAGE_KEY), fallback)
}

export const setStoredHomeDeviceViewMode = (mode: HomeDeviceViewMode) => {
	uni.setStorageSync(HOME_DEVICE_VIEW_MODE_STORAGE_KEY, mode)
}
