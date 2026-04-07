import { useDeveloperStore } from './developer'
import { useListStore } from './list'
import { useTokenStore } from './token'
import { useUserStore } from './user'

type LegacyCommitType =
	| 'addOffset'
	| 'subtractionOffset'
	| 'zerOingOffser'
	| 'addEqupPage'
	| 'subtractionEqupPage'
	| 'zerOingEqupPage'
	| 'addModelPage'
	| 'subtractionModelPage'
	| 'zerOingModelPage'
	| 'editUserInfoField'
	| 'login'
	| 'logout'
	| 'setDeveloperMode'
	| 'enableDeveloperMode'
	| 'disableDeveloperMode'

/**
 * 兼容旧代码的 `$store.commit(...)` / `$store.state.xxx` 访问方式。
 * 迁移完成后建议逐步替换为 `useXxxStore()` 直接使用。
 */
const store = {
	get state() {
		const list = useListStore()
		const token = useTokenStore()
		const developer = useDeveloperStore()
		const user = useUserStore()
		return {
			list,
			token,
			developerMode: developer.enabled,
			userInfo: user.userInfo
		}
	},
	dispatch(type: string, payload?: any) {
		// 兼容旧 Vuex dispatch；逐步迁移为 Pinia action 后可移除
		// 这里保持“不会中断业务流程”的行为（Vuex 未注册 action 时也不会 throw）
		void type
		void payload
		return
	},
	commit(type: LegacyCommitType | string, payload?: any) {
		const list = useListStore()
		const developer = useDeveloperStore()
		const user = useUserStore()

		switch (type as LegacyCommitType) {
			case 'addOffset':
				return list.addOffset()
			case 'subtractionOffset':
				return list.subtractionOffset()
			case 'zerOingOffser':
				return list.zerOingOffser()
			case 'addEqupPage':
				return list.addEqupPage()
			case 'subtractionEqupPage':
				return list.subtractionEqupPage()
			case 'zerOingEqupPage':
				return list.zerOingEqupPage()
			case 'addModelPage':
				return list.addModelPage()
			case 'subtractionModelPage':
				return list.subtractionModelPage()
			case 'zerOingModelPage':
				return list.zerOingModelPage()
			case 'editUserInfoField':
				return user.editUserInfoField(payload)
			case 'login':
				return user.login(payload)
			case 'logout':
				return user.logout()
			case 'setDeveloperMode':
				return developer.setEnabled(!!payload)
			case 'enableDeveloperMode':
				return developer.enable()
			case 'disableDeveloperMode':
				return developer.disable()
			default:
				return
		}
	}
}

export default store
