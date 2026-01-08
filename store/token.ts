import { defineStore } from 'pinia'

export interface TokenState {
	token_type: string
	access_token: string
	refresh_token: string
}

export const useTokenStore = defineStore('token', {
	state: (): TokenState => ({
		token_type: '',
		access_token: '',
		refresh_token: ''
	}),
	actions: {
		setToken(payload: Partial<TokenState>) {
			this.token_type = payload.token_type ?? this.token_type
			this.access_token = payload.access_token ?? this.access_token
			this.refresh_token = payload.refresh_token ?? this.refresh_token
		},
		clearToken() {
			this.token_type = ''
			this.access_token = ''
			this.refresh_token = ''
		}
	}
})

