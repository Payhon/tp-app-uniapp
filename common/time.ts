import i18n from '@/lang'

export type DateLike = string | number | Date

const t = (key: string, params?: Record<string, unknown>) => i18n.global.t(key, params as any) as string

export const time = {
	humanize(dataTime?: DateLike): string | undefined {
		if (!dataTime) return

		const dateTimeStamp = new Date(dataTime).getTime()
		const minute = 1000 * 60 // 把分，时，天，周，半个月，一个月用毫秒表示
		const hour = minute * 60
		const day = hour * 24
		const week = day * 7
		const month = day * 30

		const now = new Date().getTime() // 获取当前时间毫秒
		const diffValue = now - dateTimeStamp // 时间差
		if (diffValue < 0) return

		const minC = diffValue / minute // 计算时间差的分，时，天，周，月
		const hourC = diffValue / hour
		const dayC = diffValue / day
		const weekC = diffValue / week
		const monthC = diffValue / month

		let result = ''
		if (monthC >= 1 && monthC <= 3) {
			result = ' ' + t('common.time.monthAgo', { n: parseInt(String(monthC)) })
		} else if (weekC >= 1 && weekC <= 3) {
			result = ' ' + t('common.time.weekAgo', { n: parseInt(String(weekC)) })
		} else if (dayC >= 1 && dayC <= 6) {
			result = ' ' + t('common.time.dayAgo', { n: parseInt(String(dayC)) })
		} else if (hourC >= 1 && hourC <= 23) {
			result = ' ' + t('common.time.hourAgo', { n: parseInt(String(hourC)) })
		} else if (minC >= 1 && minC <= 59) {
			result = ' ' + t('common.time.minuteAgo', { n: parseInt(String(minC)) })
		} else if (diffValue >= 0 && diffValue <= minute) {
			result = t('common.time.justNow')
		} else {
			const datetime = new Date()
			datetime.setTime(dateTimeStamp)
			const Nyear = datetime.getFullYear()
			const Nmonth = datetime.getMonth() + 1 < 10 ? '0' + (datetime.getMonth() + 1) : datetime.getMonth() + 1
			const Ndate = datetime.getDate() < 10 ? '0' + datetime.getDate() : datetime.getDate()
			result = Nyear + '-' + Nmonth + '-' + Ndate
		}
		return result
	},

	timestampToTime(timestamp: string | number): string {
		const s = String(timestamp)
		const timeStamp = s.length < 13 ? parseInt(s) * 1000 : parseInt(s) // 时间戳为10位需*1000，13位不需
		const date = new Date(timeStamp)
		const Y = date.getFullYear() + '-'
		const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
		const D = date.getDate() + ' '
		const h = date.getHours() + ':'
		const m = date.getMinutes() + ':'
		const s2 = date.getSeconds()
		return Y + M + D + h + m + s2
	},

	// 根据生日算年龄
	birthdayToAge(strBirthday: string): number | false {
		const r = strBirthday.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})/)
		if (r == null) return false

		let returnAge: number
		const strBirthdayArr = strBirthday.split('-')
		const birthYear = Number(strBirthdayArr[0])
		const birthMonth = Number(strBirthdayArr[1])
		const birthDay = Number(strBirthdayArr[2])

		const d = new Date()
		const nowYear = d.getFullYear()
		const nowMonth = d.getMonth() + 1
		const nowDay = d.getDate()

		if (nowYear === birthYear) {
			returnAge = 0 // 同年则为0岁
		} else {
			const ageDiff = nowYear - birthYear // 年之差
			if (ageDiff > 0) {
				if (nowMonth === birthMonth) {
					const dayDiff = nowDay - birthDay // 日之差
					if (dayDiff < 0) returnAge = ageDiff - 1
					else returnAge = ageDiff
				} else {
					const monthDiff = nowMonth - birthMonth // 月之差
					if (monthDiff < 0) returnAge = ageDiff - 1
					else returnAge = ageDiff
				}
			} else {
				returnAge = -1 // 返回-1表示出生日期输入错误（晚于今天）
			}
		}

		return returnAge
	}
}

export default { time }
