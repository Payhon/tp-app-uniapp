import { defineStore } from 'pinia'

export interface UserInfo {
	id?: string | number
	name?: string
	mobile?: string
	email?: string
	is_admin?: number
	business_id?: string | number
	[key: string]: unknown
}

export interface UserState {
	userInfo: UserInfo | null
}

export const useUserStore = defineStore('user', {
	state: (): UserState => ({
		userInfo: null
	}),
	actions: {
		setUserInfo(info: UserInfo | null) {
			this.userInfo = info
		},
		editUserInfoField(payload: { key: string; value: unknown }) {
			if (!this.userInfo) return
			;(this.userInfo as Record<string, unknown>)[payload.key] = payload.value
		},
		login(info: UserInfo) {
			this.userInfo = info
		},
		logout() {
			this.userInfo = null
		}
	}
})

