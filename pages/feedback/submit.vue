<template>
	<view class="tp-box tp-box-sizing tp-pd-l-r-30 tp-pd-t-b-30">
		<view class="card">
			<view class="label">{{ $t('pages.feedbackContent') }}</view>
			<textarea class="textarea" v-model="content" :placeholder="$t('pages.feedbackPlaceholder')" maxlength="10000" />
			<view class="count">{{ content.length }}/10000</view>
		</view>

		<view class="card">
			<view class="label">{{ $t('pages.feedbackImages') }}</view>
			<view class="images">
				<view v-for="(img, idx) in images" :key="img" class="img-item">
					<image :src="img" mode="aspectFill" class="img" @click="preview(idx)"></image>
					<view class="img-del" @click.stop="remove(idx)">×</view>
				</view>
				<view v-if="images.length < maxImages" class="img-add" @click="chooseImage">
					<text class="img-add-plus">+</text>
				</view>
			</view>
			<view class="hint">{{ $t('pages.feedbackImageHint', { count: maxImages }) }}</view>
		</view>

		<view class="actions">
			<button class="tp-btn primary" :disabled="submitting" @click="submit">
				{{ submitting ? $t('common.loading') : $t('pages.submitFeedback') }}
			</button>
			<button class="tp-btn" @click="goMyFeedback">{{ $t('pages.myFeedback') }}</button>
		</view>
	</view>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import { getDeviceInfo } from '@/common/platform'

declare const plus: { runtime: { appid: string; version?: string } }

type UploadResponse = { code: number; message?: string; data?: { path?: string } }
type ApiResponse<T> = { code: number; message?: string; data: T }

const { t } = useI18n()

const content = ref<string>('')
const images = ref<string[]>([])
const maxImages = ref<number>(6)
const submitting = ref<boolean>(false)

const getApiRequest = () => {
	const { proxy } = getCurrentInstance() || {}
	return (proxy as any)?.API?.apiRequest as
		| (<T>(url: string, params: Record<string, unknown>, method: string) => Promise<ApiResponse<T>>)
		| undefined
}

const getLogin = () => {
	const { proxy } = getCurrentInstance() || {}
	return (proxy as any)?.$login as undefined | { isLoginType?: () => { isLogin?: boolean } }
}

const getAppId = (): string => {
	// #ifdef APP-PLUS
	return plus.runtime.appid
	// #endif
	return uni.getStorageSync('app_appid') || ''
}

const getBaseUrl = (): string => uni.getStorageSync('serverAddress') || 'http://demo.thingspanel.cn'

const getHeaders = (): Record<string, string> => {
	const token = uni.getStorageSync('access_token')
	const tenantId = uni.getStorageSync('tenant_id')
	const h: Record<string, string> = {}
	if (token) h['x-token'] = String(token)
	if (tenantId) h['X-TenantID'] = String(tenantId)
	return h
}

const getDeviceMeta = (): Record<string, unknown> => {
	const info = getDeviceInfo() as unknown as { platform?: string; model?: string; system?: string }
	let appVersion = ''
	// #ifdef APP-PLUS
	appVersion = plus.runtime.version || ''
	// #endif
	return {
		platform: info.platform || '',
		app_version: appVersion,
		device_model: info.model || '',
		os_version: info.system || '',
	}
}

const chooseImage = () => {
	const remain = maxImages.value - images.value.length
	if (remain <= 0) return
	uni.chooseImage({
		count: remain,
		sizeType: ['compressed'],
		success: (res) => {
			const files = res.tempFilePaths || []
			images.value = images.value.concat(files)
		},
	})
}

const remove = (idx: number) => {
	images.value.splice(idx, 1)
}

const preview = (idx: number) => {
	uni.previewImage({ current: idx, urls: images.value })
}

const uploadOne = (filePath: string) =>
	new Promise<string>((resolve, reject) => {
		uni.uploadFile({
			url: `${getBaseUrl()}/api/v1/file/up`,
			filePath,
			name: 'file',
			formData: { type: 'feedback' },
			header: getHeaders(),
			success: (res) => {
				try {
					const data = JSON.parse(res.data || '{}') as UploadResponse
					if (data && data.code == 200 && data.data?.path) resolve(data.data.path)
					else reject(new Error(data.message || 'upload failed'))
				} catch (e) {
					reject(e)
				}
			},
			fail: (err) => reject(err),
		})
	})

const submit = async () => {
	const appid = getAppId()
	if (!appid) {
		uni.showToast({ title: t('pages.appIdMissing'), icon: 'none' })
		return
	}
	if (!content.value || content.value.trim().length === 0) {
		uni.showToast({ title: t('pages.feedbackEmpty'), icon: 'none' })
		return
	}
	const apiRequest = getApiRequest()
	if (!apiRequest) return

	submitting.value = true
	try {
		const uploaded: string[] = []
		for (let i = 0; i < images.value.length; i += 1) {
			const p = await uploadOne(images.value[i])
			uploaded.push(p)
		}
		const meta = getDeviceMeta()
		const res = await apiRequest<unknown>(
			'/api/v1/app/content/feedback',
			{ appid, content: content.value, images: uploaded, ...meta },
			'post'
		)
		if (res && res.code == 200) {
			uni.showToast({ title: t('pages.feedbackSubmitSuccess'), icon: 'none' })
			content.value = ''
			images.value = []
			uni.navigateTo({ url: '/pages/feedback/my-feedback' })
		} else {
			uni.showToast({ title: res?.message || t('pages.feedbackSubmitFailed'), icon: 'none' })
		}
	} catch {
		uni.showToast({ title: t('pages.feedbackSubmitFailed'), icon: 'none' })
	} finally {
		submitting.value = false
	}
}

const goMyFeedback = () => {
	uni.navigateTo({ url: '/pages/feedback/my-feedback' })
}

onLoad(() => {
	const login = getLogin()
	if (!login?.isLoginType?.().isLogin) {
		uni.showToast({ title: t('pages.pleaseLogin'), icon: 'none' })
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	uni.setNavigationBarTitle({ title: t('pages.submitFeedback') })
})
</script>

<style>
	.card {
		background: #fff;
		border-radius: 10px;
		padding: 12px;
		margin-bottom: 12px;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
	}

	.label {
		font-size: 14px;
		font-weight: 600;
		color: #333;
		margin-bottom: 8px;
	}

	.textarea {
		width: 100%;
		min-height: 140px;
		font-size: 14px;
		color: #333;
	}

	.count {
		text-align: right;
		color: #999;
		font-size: 12px;
		margin-top: 6px;
	}

	.images {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.img-item {
		width: 90px;
		height: 90px;
		position: relative;
		border-radius: 8px;
		overflow: hidden;
	}

	.img {
		width: 90px;
		height: 90px;
	}

	.img-del {
		position: absolute;
		right: 4px;
		top: 4px;
		width: 18px;
		height: 18px;
		line-height: 18px;
		text-align: center;
		border-radius: 9px;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		font-size: 14px;
	}

	.img-add {
		width: 90px;
		height: 90px;
		border: 1px dashed #ccc;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
	}

	.img-add-plus {
		font-size: 28px;
	}

	.hint {
		margin-top: 8px;
		color: #999;
		font-size: 12px;
	}

	.actions {
		display: flex;
		gap: 12px;
		margin-top: 6px;
	}

	.primary {
		background: #18a058;
		color: #fff;
	}
</style>
