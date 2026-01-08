import { createSSRApp } from 'vue'
import App from './App.vue'

import i18n, { updateTabbarText } from './lang'
import { pinia } from '@/store/pinia'
import legacyStore from '@/store'

import api from '@/API/'
import http from '@/common/request'
import { Login } from '@/types/auth'
import { isLoginType } from '@/store/login'

import needLogin from '@/components/login/needLogin.vue'
import authorize from '@/components/login/authorize.vue'
import CysToast from '@/components/aui-toast/aui-toast.vue'
import customNav from '@/components/customNav/customNav.vue'

export function createApp() {
	const app = createSSRApp(App)

	app.use(pinia)
	app.use(i18n)

	// NOTE: 为兼容旧代码（Options API / this.xxx）挂载全局属性；类型增强放在 d.ts 中，避免 HBuilderX 解析差异导致编译失败
	const gp = app.config.globalProperties as any
	gp.API = api
	gp.$API = api
	gp.$login = { isLoginType } as Login
	gp.$store = legacyStore
	gp.$H = http

	app.component('needLogin', needLogin)
	app.component('authorize', authorize)
	app.component('cys-toast', CysToast)
	app.component('customNav', customNav)

	// Initial tabbar i18n sync (after app created)
	updateTabbarText()

	return {
		app
	}
}
