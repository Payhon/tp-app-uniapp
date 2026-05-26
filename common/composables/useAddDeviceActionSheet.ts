import { ensureLoggedIn, isUserLoggedIn } from '@/common/auth/ensure-login'
import i18n from '@/lang/index'
import { parseAddDeviceScanCode } from '@/common/device-provision/scan-code'
import { DEVICE_TYPE_BMS, DEVICE_TYPE_METER } from '@/common/device-provision/device-prefix-shared'
import { useBoundDevicesStore } from '@/store/bound-devices'

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

function navigateByUrl(baseTabUrl: string, url: string) {
	switchToBaseTab(baseTabUrl, () => {
		uni.navigateTo({ url })
	})
}

function resolveScanRoute(
	parsed: NonNullable<ReturnType<typeof parseAddDeviceScanCode>>,
	boundDevicesStore: ReturnType<typeof useBoundDevicesStore>
) {
	if (parsed.type === 'mac') {
		const matched = boundDevicesStore.findByBleMac(parsed.value)
		const matchedDeviceId = String(matched?.device_id || '').trim()
		if (matchedDeviceId) {
			return { action: 'bound_detail', url: `/pages/device-battery/detail?device_id=${encodeURIComponent(matchedDeviceId)}` }
		}
		if (parsed.deviceType === DEVICE_TYPE_METER) {
			return {
				action: 'meter_session',
				url: `/pages/device-battery/detail?session_mode=instrument&ble_mac=${encodeURIComponent(parsed.value)}&allow_scan_handoff=1`,
			}
		}
		if (parsed.deviceType === DEVICE_TYPE_BMS) {
			return {
				action: 'bms_provision',
				url: `/pages/device-provision/ble-scan?mode=qr&mac=${encodeURIComponent(parsed.value)}`,
			}
		}
		return { action: 'unsupported' as const }
	}

	const matched = boundDevicesStore.findByItemUuid(parsed.value)
	const matchedDeviceId = String(matched?.device_id || '').trim()
	if (matchedDeviceId) {
		return { action: 'bound_detail', url: `/pages/device-battery/detail?device_id=${encodeURIComponent(matchedDeviceId)}` }
	}
	return { action: 'uuid_bind', url: `/pages/device-provision/uuid-bind?uuid=${encodeURIComponent(parsed.value)}` }
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
	const boundDevicesStore = useBoundDevicesStore()
	if (!isUserLoggedIn()) {
		switchToBaseTab(baseTabUrl, () => {
			void ensureLoggedIn()
		})
		return
	}

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
					success: async (scanRes: { result?: unknown }) => {
						const parsed = parseAddDeviceScanCode(String(scanRes.result ?? ''))
						if (!parsed) {
							uni.showToast({ title: t('pages.deviceProvision.invalidCode'), icon: 'none' })
							return
						}
						try {
							await boundDevicesStore.refresh({ force: true })
						} catch (e) {}
						const decision = resolveScanRoute(parsed, boundDevicesStore)
						if (decision.action === 'unsupported' || !decision.url) {
							uni.showToast({ title: t('pages.deviceProvision.unsupportedDeviceType'), icon: 'none' })
							return
						}
						navigateByUrl(baseTabUrl, decision.url)
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
