import $http from './request'
import i18n from '@/lang'

declare const plus: any

const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params as any) as string

// 监听网络
function onNetWork() {
	const func = (res: { networkType?: string }) => {
		if (res.networkType === 'none') {
			uni.showToast({
				title: t('common.networkDisconnected'),
				icon: 'none'
			})
		}
	}
	uni.getNetworkType({ success: func })
	uni.onNetworkStatusChange(func)
}
// 更新检测
function update(showToast = false) {
	// #ifdef APP-PLUS
	plus.runtime.getProperty(plus.runtime.appid, function (widgetInfo: { version: string }) {
		//
		$http.post('/Update', { ver: widgetInfo.version }).then((result: any) => {
			//
			if (!result.url) {
				// 无需更新
				if (showToast) {
					return uni.showToast({ title: t('common.update.noUpdate'), icon: 'none' })
				}
			}
			//
			uni.showModal({
				title: t('common.update.newVersionTitle'),
				content: t('common.update.latestVersion', { version: result.version }),
				cancelText: t('common.update.later'),
				confirmText: t('common.update.updateNow'),
				success: (res: { confirm?: boolean }) => {
					if (res.confirm) {
						//
						__update(result.url)
						//
					}
				}
			})
			//
		})
		//
	})
	// #endif
}
//
function __update(downloadUrl = '') {
	//
	if (downloadUrl === '') return
	//
	const progressTxt = t('common.update.startDownload')
	//
	uni.showToast({ title: progressTxt, icon: 'loading' })
	//
	const downloadTask = uni.downloadFile({
		url: downloadUrl,
		success: (res: { statusCode: number; tempFilePath: string }) => {
			//
			if (res.statusCode === 200) {
				//
				uni.hideToast()
				//
				plus.runtime.install(
					res.tempFilePath,
					{
						force: false
					},
					function () {
						console.log('install success ...')
						plus.runtime.restart()
					},
					function (e: any) {
						console.error('install fail...')
					}
				)
			}
			//
		},
		fail: (err: any) => {
			//
			uni.hideToast()
			//
		},
		complete: () => {
			//
			// uni.hideToast();
			//
		}
	})
	//
	downloadTask.onProgressUpdate((res: any) => {
		// 
		// console.log('下载进度' + res.progress);
		// console.log('已经下载的数据长度' + res.totalBytesWritten);
		// console.log('预期需要下载的数据总长度' + res.totalBytesExpectedToWrite);
		//			
	});
	//
}
// 数组置顶
function __toFirst<T>(arr: T[], index: number) {
	// 
	if (index != 0) {
		arr.unshift(arr.splice(index, 1)[0])
	}
	// 
	return arr
	// 
}
//
export default {
	onNetWork,
	update,
	__toFirst
}
//
