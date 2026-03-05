declare const process: { env: { NODE_ENV?: string } }

export interface AppConfig {
	// 请求地址前缀
	webUrl: string
	tenantId: string
	apiBaseUrl: string
	/**
	 * 静态资源 CDN 前缀（建议配置为 https://cdn.example.com，不要以 / 结尾）
	 * 仅在需要将大图等静态资源改为线上加载时使用。
	 */
	imageCdnPrefix: string
}

// 配置信息
const API_BSE_URL = process.env.NODE_ENV === 'development' ? 'https://fjbms.yz6688.cn' : 'https://cloud.fjiaenergy.com'
const IMAGE_CDN_PREFIX = process.env.NODE_ENV === 'development' ? 'https://fjcdn.yz6688.cn' : 'https://fjcdn.yz6688.cn'

const config: AppConfig = {
	// 请求地址前缀
	// webUrl : 'https://thingsdev.jiyikeji.cn/api',
	webUrl : API_BSE_URL,
	tenantId : 'd616bcbb', 
	apiBaseUrl : API_BSE_URL,
	imageCdnPrefix: IMAGE_CDN_PREFIX,
	// webUrl : 'http://cc.jszjcc.com',
	// websocket链接 ws://47.99.103.220:8282 
	// websocketUrl : 'wss://xxx/wss',
	// 
}

export default config
