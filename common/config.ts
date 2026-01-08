declare const process: { env: { NODE_ENV?: string } }

export interface AppConfig {
	// 请求地址前缀
	webUrl: string
	tenantId: string
	apiBaseUrl: string
}

// 配置信息
const API_BSE_URL = process.env.NODE_ENV === 'development' ? 'https://fjbms.yz6688.cn' : 'https://fjbms.com'

const config: AppConfig = {
	// 请求地址前缀
	// webUrl : 'https://thingsdev.jiyikeji.cn/api',
	webUrl : API_BSE_URL,
	tenantId : 'd616bcbb', 
	apiBaseUrl : API_BSE_URL,
	// webUrl : 'http://cc.jszjcc.com',
	// websocket链接 ws://47.99.103.220:8282 
	// websocketUrl : 'wss://xxx/wss',
	// 
}

export default config
