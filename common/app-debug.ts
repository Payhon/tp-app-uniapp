import { resolveBaseUrl } from '@/API/interface'

type RuntimeWidgetInfo = {
	version?: string
	[key: string]: unknown
}

type UniLike = typeof uni & {
	getAppBaseInfo?: () => Record<string, unknown>
}

declare const plus: {
	runtime?: {
		appid?: string
		version?: string
		innerVersion?: string
		uniVersion?: string
		getProperty?: (appid: string, callback: (widgetInfo: RuntimeWidgetInfo) => void) => void
	}
}

declare const wx: {
	getAccountInfoSync?: () => {
		miniProgram?: {
			version?: string
		}
	}
}

export interface AppDebugInfo {
	baseVersion: string
	appVersion: string
	apiBaseUrl: string
}

const EMPTY_VALUE = '--'

function normalizeText(value: unknown): string {
	const text = String(value ?? '').trim()
	return text || ''
}

function mergeAppVersion(appVersion: string, wgtVersion: string): string {
	if (appVersion && wgtVersion && appVersion !== wgtVersion) {
		return `${appVersion} (${wgtVersion})`
	}
	return appVersion || wgtVersion || ''
}

function getAppBaseInfoSafe(): Record<string, unknown> {
	const uniLike = uni as UniLike
	try {
		if (typeof uniLike.getAppBaseInfo === 'function') {
			return uniLike.getAppBaseInfo() || {}
		}
	} catch (e) {}

	try {
		return (uni.getSystemInfoSync() || {}) as unknown as Record<string, unknown>
	} catch (e) {}

	return {}
}

async function getAppVersionFromPlus(): Promise<string> {
	try {
		const runtime = plus?.runtime
		if (!runtime) return ''

		const runtimeVersion = normalizeText(runtime.version)
		if (!runtime.appid || typeof runtime.getProperty !== 'function') {
			return runtimeVersion
		}

		return await new Promise<string>((resolve) => {
			runtime.getProperty?.(runtime.appid as string, (widgetInfo) => {
				resolve(mergeAppVersion(runtimeVersion, normalizeText(widgetInfo?.version)))
			})
		})
	} catch (e) {}

	return ''
}

export function createDefaultAppDebugInfo(): AppDebugInfo {
	return {
		baseVersion: EMPTY_VALUE,
		appVersion: EMPTY_VALUE,
		apiBaseUrl: normalizeText(resolveBaseUrl()) || EMPTY_VALUE
	}
}

export async function getAppDebugInfo(): Promise<AppDebugInfo> {
	const baseInfo = getAppBaseInfoSafe()
	let baseVersion = normalizeText(baseInfo.uniRuntimeVersion || baseInfo.uniVersion || baseInfo.SDKVersion)
	let appVersion = mergeAppVersion(
		normalizeText(baseInfo.appVersion),
		normalizeText(baseInfo.appWgtVersion)
	)

	if (!baseVersion) {
		try {
			baseVersion = normalizeText(plus?.runtime?.uniVersion || plus?.runtime?.innerVersion)
		} catch (e) {}
	}

	if (!appVersion) {
		appVersion = await getAppVersionFromPlus()
	}

	if (!appVersion) {
		try {
			appVersion = normalizeText(wx?.getAccountInfoSync?.()?.miniProgram?.version)
		} catch (e) {}
	}

	return {
		baseVersion: baseVersion || EMPTY_VALUE,
		appVersion: appVersion || EMPTY_VALUE,
		apiBaseUrl: normalizeText(resolveBaseUrl()) || EMPTY_VALUE
	}
}
