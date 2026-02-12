import callCheckVersion, { UpgradeCheckResult } from './call-check-version'
import $C from '@/common/config'
import { platform_iOS } from './utils'

// 推荐在 App.vue 中使用
const PACKAGE_INFO_KEY = '__fjbms_upgrade_package_info__'

function normalizeDownloadURL(url: string): string {
	const u = String(url || '').trim()
	if (!u) return u
	// 已经是绝对地址 / scheme
	if (/^(https?:)?\/\//i.test(u)) return u
	if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) return u
	// 兼容后端存储的相对路径（/files/... 或 files/...）
	if (u.startsWith('/')) return `${$C.apiBaseUrl}${u}`
	return `${$C.apiBaseUrl}/${u}`
}

// #ifdef APP-HARMONY
export default function (component?: any): Promise<UpgradeCheckResult> {
// #endif
// #ifndef APP-HARMONY
export default function (): Promise<UpgradeCheckResult> {
// #endif
	return new Promise<UpgradeCheckResult>((resolve, reject) => {
		callCheckVersion()
			.then(async (upgradeResult) => {
				const code = upgradeResult.code
				const message = upgradeResult.message

				// NOTE: 后端可能返回相对路径，客户端统一补齐
				if (upgradeResult.url) {
					upgradeResult.url = normalizeDownloadURL(upgradeResult.url)
				}

				if (code > 0) {
					// #ifndef UNI-APP-X
					// 静默更新（通常只对 wgt 生效）
					if (upgradeResult.is_silently && upgradeResult.type === 'wgt') {
						uni.downloadFile({
							url: upgradeResult.url,
							success: (res) => {
								if (res.statusCode == 200) {
									// 下载好直接安装，下次启动生效
									plus.runtime.install(res.tempFilePath, { force: false })
								}
							}
						})
						return
					}
					// #endif

					// 官方适配的升级弹窗（本项目内置版本，不依赖 uniCloud）
					// #ifndef UNI-APP-X
					// #ifdef APP-PLUS
					uni.setStorageSync(PACKAGE_INFO_KEY, upgradeResult)
					uni.navigateTo({
						url: `/uni_modules/fjbms-upgrade/pages/upgrade-popup?local_storage_key=${PACKAGE_INFO_KEY}`,
						fail: (err) => {
							console.error('更新弹框跳转失败', err)
							uni.removeStorageSync(PACKAGE_INFO_KEY)
						}
					})
					// #endif
					// #ifdef APP-HARMONY
					if (component) {
						component.show(true, upgradeResult)
					} else {
						reject({
							code: -1,
							message: '在 HarmonyOS Next 平台请传递组件使用'
						})
					}
					// #endif
					// #endif

					return resolve(upgradeResult)
				} else if (code < 0) {
					console.error(message)
					return reject(upgradeResult)
				}
				return resolve(upgradeResult)
			})
			.catch((err) => reject(err))
	})
}

/**
 * 使用 uni.showModal 升级（可选）
 */
export function updateUseModal(packageInfo: UpgradeCheckResult): void {
	// #ifdef APP
	const { title, contents, is_mandatory, url, type, platform } = packageInfo

	const isWGT = type === 'wgt'
	const isiOS = !isWGT ? platform.includes(platform_iOS) : false

	const confirmText = isiOS ? '立即跳转更新' : '立即下载更新'

	uni.showModal({
		title,
		content: contents,
		showCancel: !is_mandatory,
		confirmText,
		success: (res) => {
			if (res.cancel) return

			if (isiOS) {
				// iOS 平台跳转 AppStore
				plus.runtime.openURL(url)
				return
			}

			uni.showToast({ title: '后台下载中……', duration: 1000 })

			uni.downloadFile({
				url,
				success: (downloadRes) => {
					if (downloadRes.statusCode !== 200) {
						console.error('下载安装包失败')
						return
					}
					plus.runtime.install(
						downloadRes.tempFilePath,
						{ force: false },
						() => {
							if (is_mandatory) {
								plus.runtime.restart()
								return
							}
							uni.showModal({
								title: '安装成功是否重启？',
								success: (mRes) => {
									if (mRes.confirm) plus.runtime.restart()
								}
							})
						},
						(err) => {
							uni.showModal({
								title: '更新失败',
								content: err?.message || String(err),
								showCancel: false
							})
						}
					)
				}
			})
		}
	})
	// #endif
}

