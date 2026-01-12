// vue-i18n esm-bundler build (uni-app/HBuilderX) 会在 feature flags 未被替换时输出提示。
// 这里提前注入 boolean 字面量，避免启动时的控制台警告；不影响业务逻辑。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any =
	typeof globalThis !== 'undefined'
		? globalThis
		: typeof window !== 'undefined'
			? window
			: {}

g.__VUE_I18N_FULL_INSTALL__ = true
g.__VUE_I18N_LEGACY_API__ = true
// 需要开启 JIT 编译，否则 `{count}` / `{rssi}` 这类占位符不会被运行时替换
g.__INTLIFY_JIT_COMPILATION__ = true
g.__INTLIFY_DROP_MESSAGE_COMPILER__ = false
g.__INTLIFY_PROD_DEVTOOLS__ = false
