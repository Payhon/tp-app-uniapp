/**
 * 通用uni-app网络请求
 * 基于 Promise 对象实现更简单的 request 使用方式，支持请求和响应拦截
 */
const DEFAULT_BASE_URL_DEV = 'https://fjbms.yz6688.cn'
const DEFAULT_BASE_URL_PROD = 'https://cloud.fjiaenergy.com'

function normalizeBaseUrl(url) {
	if (!url) return ''
	url = String(url).trim()
	if (url.endsWith('/')) url = url.slice(0, -1)
	return url
}

function resolveBaseUrl() {
	const stored = normalizeBaseUrl(uni.getStorageSync('serverAddress'))
	// 兼容历史默认值：如果仍是 demo 地址则回退到当前环境默认 host
	if (stored && stored !== 'http://demo.thingspanel.cn' && stored !== 'https://demo.thingspanel.cn') return stored
	// 开发环境默认走测试环境，生产环境默认走生产环境
	return process.env.NODE_ENV === 'development' ? DEFAULT_BASE_URL_DEV : DEFAULT_BASE_URL_PROD
}

let baseUrl = resolveBaseUrl()
export default {
	config: {
		// baseUrl: "http://cc.jszjcc.com",  //测试地址
		// baseUrl: "http://demo.thingspanel.cn",
		baseUrl: baseUrl,
		header: {
			'content-type': 'application/json',
		},
		data: {},
		method: "GET",
		dataType: "json",
		responseType: "text",
		success() {},
		fail() {},
	},
	interceptor: {
		request: null,
		response: null
	},
	request(options) {
		this.config.baseUrl = resolveBaseUrl()
		if (!options) {
			options = {}
		}
		// options.baseUrl = options.baseUrl || this.config.baseUrl
		options.baseUrl = this.config.baseUrl
		// let server = uni.getStorageSync("serverAddress")
		// if (server) {
		// 	delete options.baseUrl
		// 	options.baseUrl =  server
		// }
		options.dataType = options.dataType || this.config.dataType
		const isAbsUrl = options.url.startsWith('http://') || options.url.startsWith('https://')
		if (!isAbsUrl) options.url = normalizeBaseUrl(options.baseUrl) + options.url
		// console.log(options.url)
		options.data = options.data || {}
		options.method = options.method || this.config.method
		
		return new Promise((resolve, reject) => {
			let _config = null
			options.success = (response) => {
				let statusCode = response.statusCode
				response.config = _config
				if (process.env.NODE_ENV === 'development') {
					if (statusCode === 200 || statusCode == 201 || statusCode === 500) {
						// console.log("【" + _config.requestId + "】 结果：" + JSON.stringify(response.data))
					}
				}
				if (this.interceptor.response) {
					let newResponse = this.interceptor.response(response)
					if (newResponse) {
						response = newResponse
					}
				}
				// 统一的响应日志记录（后端通常会返回统一 JSON，错误时也可能是 4xx）
				if (statusCode === 200 || statusCode === 201 || statusCode === 400 || statusCode === 401 || statusCode === 402 || statusCode === 403 || statusCode === 422 || statusCode === 500) {
					resolve(response);
				} else {
					reject(response)
				}
			}
			options.fail=(error)=>{
				reject(error)
			}
			_config = Object.assign({}, this.config, options)
			_config.requestId = new Date().getTime()
			if (this.interceptor.request) {
				this.interceptor.request(_config)
			}
			uni.request(_config);
		});
	},
	get(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'GET'
		return this.request(options)
	},
	post(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'POST'
		return this.request(options)
	},
	put(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'PUT'
		return this.request(options)
	},
	delete(url, data, options) {
		if (!options) {
			options = {}
		}
		options.url = url
		options.data = data
		options.method = 'DELETE'
		return this.request(options)
	}
}
