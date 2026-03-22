import i18n from '@/lang/index'
import { parseAddDeviceScanCode } from '@/common/device-provision/scan-code'
import * as devicePrefixModule from '@/common/device-provision/device-prefix.js'

const DEVICE_TYPE_BMS = devicePrefixModule.DEVICE_TYPE_BMS
const DEVICE_TYPE_METER = devicePrefixModule.DEVICE_TYPE_METER

const t = (key: string) => i18n.global.t(key) as unknown as string

export type ShowAddDeviceActionSheetOptions = {
	/**
	 * 在 “tabBar 中间占位页” 场景使用：
	 * - 先切回上一次的 tabBar 页面，再执行 navigateTo
	 * - 避免后续返回时落在占位页
	 */
	baseTabUrl?: string
}

type GuardState = {
	lastAt: number
}

const getGuardState = (): GuardState => {
	const g = (globalThis as any).__ADD_DEVICE_MID_BUTTON_GUARD__ as GuardState | undefined
	if (g && typeof g.lastAt === 'number') return g
	const next: GuardState = { lastAt: 0 }
	;(globalThis as any).__ADD_DEVICE_MID_BUTTON_GUARD__ = next
	return next
}

function normalizeTabUrl(url: string): string {
	const u = String(url || '').trim()
	if (!u) return ''
	return u.startsWith('/') ? u : `/${u}`
}

function switchToBaseTab(baseTabUrl: string, next: () => void) {
	const target = normalizeTabUrl(baseTabUrl)
	if (!target) {
		next()
		return
	}
	uni.switchTab({
		url: target,
		success: () => {
			// 某些端在 switchTab 后立即 navigateTo 会失败，做一个微延迟
			setTimeout(() => next(), 50)
		},
		fail: () => next()
	})
}

function navigateToDetailByBleMac(baseTabUrl: string, bleMac: string) {
	switchToBaseTab(baseTabUrl, () => {
		uni.navigateTo({
			url: `/pages/device-battery/detail?session_mode=instrument&ble_mac=${encodeURIComponent(bleMac)}&allow_scan_handoff=1`,
		})
	})
}

export function showAddDeviceActionSheet(options: ShowAddDeviceActionSheetOptions = {}) {
	// #ifdef APP-PLUS
	// 避免某些平台/页面生命周期重复触发导致弹出两次
	const guard = getGuardState()
	const now = Date.now()
	if (now - guard.lastAt < 400) return
	guard.lastAt = now
	// #endif

	const baseTabUrl = normalizeTabUrl(options.baseTabUrl || '')

	uni.showActionSheet({
		itemList: [t('pages.deviceProvision.bleSearch'), t('pages.deviceProvision.cameraScan')],
		success: (res: { tapIndex: number }) => {
			const idx = Number(res.tapIndex)
			if (idx === 0) {
				switchToBaseTab(baseTabUrl, () => {
					uni.navigateTo({ url: '/pages/device-provision/ble-scan' })
				})
				return
			}
			if (idx === 1) {
				uni.scanCode({
					success: (scanRes: { result?: unknown }) => {
						const parsed = parseAddDeviceScanCode(String(scanRes.result ?? ''))
						if (!parsed) {
							uni.showToast({ title: t('pages.deviceProvision.invalidCode'), icon: 'none' })
							return
						}
						if (parsed.type === 'mac') {
							if (parsed.deviceType === DEVICE_TYPE_METER) {
								navigateToDetailByBleMac(baseTabUrl, parsed.value)
								return
							}
							if (parsed.deviceType !== DEVICE_TYPE_BMS) {
								uni.showToast({ title: t('pages.deviceProvision.unsupportedDeviceType'), icon: 'none' })
								return
							}
							switchToBaseTab(baseTabUrl, () => {
								uni.navigateTo({ url: `/pages/device-provision/ble-scan?mode=qr&mac=${parsed.value}` })
							})
							return
						}
						switchToBaseTab(baseTabUrl, () => {
							uni.navigateTo({ url: `/pages/device-provision/uuid-bind?uuid=${parsed.value}` })
						})
					},
					fail: () => {
						// 用户取消扫码，不提示
					}
				})
			}
		},
		fail: () => {
			// 用户取消：如果是占位页触发，则切回上一次 tab
			if (baseTabUrl) {
				uni.switchTab({ url: baseTabUrl })
			}
		}
	})
}
