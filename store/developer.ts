import { defineStore } from 'pinia'

const DEVELOPER_MODE_STORAGE_KEY = '__developer_mode_enabled__'

function readDeveloperMode(): boolean {
	try {
		return uni.getStorageSync(DEVELOPER_MODE_STORAGE_KEY) === '1'
	} catch (e) {}
	return false
}

function writeDeveloperMode(enabled: boolean) {
	try {
		uni.setStorageSync(DEVELOPER_MODE_STORAGE_KEY, enabled ? '1' : '0')
	} catch (e) {}
}

export interface DeveloperState {
	enabled: boolean
}

export const useDeveloperStore = defineStore('developer', {
	state: (): DeveloperState => ({
		enabled: readDeveloperMode()
	}),
	actions: {
		setEnabled(enabled: boolean) {
			this.enabled = !!enabled
			writeDeveloperMode(this.enabled)
		},
		enable() {
			const changed = !this.enabled
			this.setEnabled(true)
			return changed
		},
		disable() {
			const changed = this.enabled
			this.setEnabled(false)
			return changed
		}
	}
})
