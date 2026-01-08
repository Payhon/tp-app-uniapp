import type { LoginDetail } from '@/types/auth'

/* 判断登录状态 */
export const isLoginType = (): LoginDetail => {
	let userDeatail: LoginDetail = {
		userid: '',
		isAuth: false,
		openId: '',
		isLogin: false
	}
	try {
		const userId = uni.getStorageSync('access_token') // 登录
		const openId = uni.getStorageSync('userWxInfo')
		if (userId && openId) {
			userDeatail = {
				userid: userId,
				openId,
				isAuth: true,
				isLogin: true
			}
			return userDeatail
		}
		if (userId && !openId) {
			userDeatail = {
				userid: '',
				openId: '',
				isAuth: false,
				isLogin: true
			}
			return userDeatail
		}
		if (!userId && openId) {
			userDeatail = {
				userid: '',
				openId,
				isAuth: true,
				isLogin: false
			}
			return userDeatail
		}
		return {
			userid: '',
			openId: '',
			isAuth: false,
			isLogin: false
		}
	} catch (e) {
		return {
			userid: '',
			openId: '',
			isAuth: false,
			isLogin: false
		}
	}
}

