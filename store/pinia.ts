import { createPinia, setActivePinia } from 'pinia'

export const pinia = createPinia()

// 允许在组件外（如 API/、common/）直接使用 store
setActivePinia(pinia)

