/// <reference types="vue/macros-global" />

declare const uni: any
declare const wx: any

declare module '*.vue' {
	const component: any
	export default component
}
