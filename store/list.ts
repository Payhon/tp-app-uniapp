import { defineStore } from 'pinia'

export interface ListState {
	offset: number
	num: number
	equpPage: number
	equpSize: number
	modelPage: number
	modelSize: number
}

export const useListStore = defineStore('list', {
	state: (): ListState => ({
		offset: 1, // 页数（从1开始）
		num: 10, // 每页显示条数
		equpPage: 1,
		equpSize: 10,
		modelPage: 1,
		modelSize: 10
	}),
	actions: {
		addOffset() {
			this.offset += 1
		},
		subtractionOffset() {
			this.offset -= 1
		},
		zerOingOffser() {
			this.offset = 1
		},
		addEqupPage() {
			this.equpPage += 1
		},
		subtractionEqupPage() {
			this.equpPage -= 1
		},
		zerOingEqupPage() {
			this.equpPage = 1
		},
		addModelPage() {
			this.modelPage += 1
		},
		subtractionModelPage() {
			this.modelPage -= 1
		},
		zerOingModelPage() {
			this.modelPage = 1
		}
	}
})

