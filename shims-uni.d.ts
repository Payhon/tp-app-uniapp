/// <reference types="vue/macros-global" />

declare const uni: any
declare const wx: any

declare module '*.vue' {
	// HBuilderX/uni-app 不同编译器模式下可能注入不同的 vue 类型（Vue2/Vue3），这里保持最宽松声明以避免阻塞编译
	const component: any
	export default component
}
