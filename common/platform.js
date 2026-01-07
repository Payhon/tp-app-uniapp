export function getSystemLanguage() {
	// #ifdef MP-WEIXIN
	try {
		const setting = wx.getSystemSetting ? wx.getSystemSetting() : null
		if (setting && setting.language) return setting.language
	} catch (e) {}
	return ''
	// #endif

	try {
		const info = uni.getSystemInfoSync()
		return info && info.language ? info.language : ''
	} catch (e) {}
	return ''
}

export function getWindowInfo() {
	// #ifdef MP-WEIXIN
	try {
		return wx.getWindowInfo ? wx.getWindowInfo() : {}
	} catch (e) {}
	return {}
	// #endif

	try {
		return uni.getSystemInfoSync()
	} catch (e) {}
	return {}
}

export function getDeviceInfo() {
	// #ifdef MP-WEIXIN
	try {
		return wx.getDeviceInfo ? wx.getDeviceInfo() : {}
	} catch (e) {}
	return {}
	// #endif

	try {
		return uni.getSystemInfoSync()
	} catch (e) {}
	return {}
}

export function getAppBaseInfo() {
	// #ifdef MP-WEIXIN
	try {
		return wx.getAppBaseInfo ? wx.getAppBaseInfo() : {}
	} catch (e) {}
	return {}
	// #endif

	return {}
}
