import { getCurrentInstance } from 'vue'

export type ApiResponse<T> = { code: number; data: T; message?: string }
export type ApiRequest = <T>(
	url: string,
	params: Record<string, unknown> | null | undefined,
	method: string
) => Promise<ApiResponse<T>>

export type LoginLike = {
	isLoginType?: () => { isLogin?: boolean }
}

export function useInjected() {
	// NOTE: API/$login 为项目全局注入（类型取决于注入实现），这里保持渐进式类型，避免影响运行逻辑
	const { proxy } = getCurrentInstance() || {}

	const apiRequest = (proxy as any)?.API?.apiRequest as ApiRequest | undefined
	const login = (proxy as any)?.$login as LoginLike | undefined

	return { apiRequest, login }
}
