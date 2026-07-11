import { defineStore } from 'pinia'

import { isUserLoggedIn } from '@/common/auth/ensure-login'
import { fetchAppWarrantyProfile, type AppWarrantyProfile } from '@/service/user-warranty'

export const WARRANTY_PROFILE_REMINDER_STORAGE_KEY = '__WARRANTY_PROFILE_REMINDER_NEEDED__'

type CustomTabBar = {
	setWarrantyReminder?: (needed: boolean) => void
}

declare function getCurrentPages(): Array<{ getTabBar?: () => CustomTabBar | null }>

let refreshPromise: Promise<AppWarrantyProfile | null> | null = null

function persistReminderNeeded(needed: boolean) {
	try {
		uni.setStorageSync(WARRANTY_PROFILE_REMINDER_STORAGE_KEY, needed ? 1 : 0)
	} catch (e) {}
}

export function syncWarrantyReminderTabBadge(needed: boolean) {
	persistReminderNeeded(needed)

	// #ifdef MP-WEIXIN
	try {
		const pages = getCurrentPages() as Array<{ getTabBar?: () => CustomTabBar | null }>
		const current = pages[pages.length - 1]
		current?.getTabBar?.()?.setWarrantyReminder?.(needed)
	} catch (e) {}
	// #endif

	// #ifndef MP-WEIXIN
	try {
		if (needed) {
			uni.showTabBarRedDot({ index: 2 })
		} else {
			uni.hideTabBarRedDot({ index: 2 })
		}
	} catch (e) {}
	// #endif
}

export const useWarrantyReminderStore = defineStore('warrantyReminder', {
	state: () => ({
		reminderNeeded: false,
		profileCompleted: false,
		loaded: false,
	}),
	actions: {
		applyProfile(profile: AppWarrantyProfile) {
			this.profileCompleted = Boolean(profile.warranty_profile_completed)
			this.reminderNeeded = Boolean(profile.warranty_profile_reminder_needed)
			this.loaded = true
			syncWarrantyReminderTabBadge(this.reminderNeeded)
		},
		clear() {
			this.reminderNeeded = false
			this.profileCompleted = false
			this.loaded = false
			syncWarrantyReminderTabBadge(false)
		},
		async refresh(): Promise<AppWarrantyProfile | null> {
			if (!isUserLoggedIn()) {
				this.clear()
				return null
			}
			if (refreshPromise) return refreshPromise

			const request = (async () => {
				try {
					const res = await fetchAppWarrantyProfile()
					if ((res as any)?.code !== 200 || !(res as any)?.data) {
						this.clear()
						return null
					}
					const profile = (res as any).data as AppWarrantyProfile
					this.applyProfile(profile)
					return profile
				} catch (e) {
					this.clear()
					return null
				}
			})()
			refreshPromise = request
			try {
				return await request
			} finally {
				refreshPromise = null
			}
		},
	},
})
