import i18n from '@/lang'
import {
	createWxMiniappUpdateController,
	type WxMiniappUpdateManager,
} from './wx-miniapp-update-controller'

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const wx: any

const controller = createWxMiniappUpdateController({
	getUpdateManager: () => {
		if (typeof wx === 'undefined' || typeof wx.getUpdateManager !== 'function') return null
		return wx.getUpdateManager() as WxMiniappUpdateManager
	},
	showModal: (options) => {
		uni.showModal(options as any)
	},
	translate: (key) => String(i18n.global.t(key)),
})

export const startWxMiniappUpdateCheck = () => controller.start()
export const notifyWxMiniappAppShow = () => controller.onAppShow()
export const notifyWxMiniappAppHide = () => controller.onAppHide()
