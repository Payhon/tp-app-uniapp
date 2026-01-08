import $http from './request'

declare const plus: any

// 监听网络
function onNetWork() {
	const func = (res: { networkType?: string }) => {
		if(res.networkType === 'none' ){
			uni.showToast({
				title:'网络未连接',
				icon:'none'
			});
		}
	};
	uni.getNetworkType({ success:func });
	uni.onNetworkStatusChange(func);
}
// 更新检测
function update(showToast = false) {
	// #ifdef APP-PLUS
	plus.runtime.getProperty(plus.runtime.appid, function (widgetInfo: { version: string }) {
		// 
		$http.post('/Update', { ver: widgetInfo.version }).then((result: any) => {
			// 
			if(!result.url){
				// 无需更新
				if(showToast){
					return uni.showToast({	title:"无需更新", icon:"none" })
				}
			}
			// 
			uni.showModal({
				title:"发现新版本",
				content:"最新版本：" + result.version,
				cancelText:"暂不更新",
				confirmText:"立即更新",
				success:(res: { confirm?: boolean })=>{
					if(res.confirm){
						//
						__update(result.url);
						// 
					}
				}
			})
			// 
		});
		// 
	});
	// #endif
}
//
function __update(downloadUrl = '') {
	//
	if(downloadUrl === '') return;
	//
	let progressTxt = "开始下载...";
	//
	uni.showToast({	title:progressTxt, icon:"loading" });
	//
	const downloadTask = uni.downloadFile({
		url: downloadUrl, 
		success: (res: { statusCode: number; tempFilePath: string }) => {
			// 
			if(res.statusCode === 200){
				//
				uni.hideToast();
				//
				plus.runtime.install(res.tempFilePath,{
					force:false
				},function(){
					console.log('install success ...');
					plus.runtime.restart();
				},function(e: any){
					console.error('install fail...');
				});
			}
			// 
		},
		fail:(err: any)=>{
			//
			uni.hideToast();
			//
		},
		complete: ()=> {
			//
			// uni.hideToast();
			//
		}
	});
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
	if(index != 0){
		arr.unshift(arr.splice(index,1)[0]);
	}
	// 
	return arr;
	// 
}
//
export default{
	onNetWork,update,__toFirst
}
// 
