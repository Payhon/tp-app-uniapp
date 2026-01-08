export interface LoginDetail {
	userid: string
	openId: string
	isAuth: boolean
	isLogin: boolean
}

export interface Login {
	isLoginType: () => LoginDetail
}

