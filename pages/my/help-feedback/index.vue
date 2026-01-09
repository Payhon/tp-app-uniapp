<template>
	<view class="help-feedback-page">
		<view class="card">
			<view class="card-head">
				<text class="head-title">{{ $t('pages.my.helpPage.faqTitle') }}</text>
				<view class="more" hover-class="more--hover" @tap="openFaqList">
					<text class="more-text">{{ $t('pages.my.helpPage.more') }}</text>
					<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
				</view>
			</view>

			<view v-if="faqLoading" class="loading">
				<text class="loading-text">{{ $t('common.loading') }}</text>
			</view>
			<view v-else-if="faqs.length === 0" class="empty">
				<text class="empty-text">{{ $t('common.noData') }}</text>
			</view>
			<view v-else>
				<view v-for="item in faqs" :key="item.id" class="faq-row" hover-class="row--hover" @tap="openFaq(item)">
					<text class="faq-q">{{ item.question || '-' }}</text>
					<u-icon name="arrow-right" size="14" color="#C0C4CC"></u-icon>
				</view>
			</view>
		</view>

		<view class="card card--mt">
			<view class="card-head">
				<text class="head-title">{{ $t('pages.my.helpPage.feedbackTitle') }}</text>
			</view>

			<view class="form">
				<textarea
					class="textarea"
					v-model="content"
					:placeholder="$t('pages.my.helpPage.feedbackPlaceholder')"
					maxlength="200"
				></textarea>
				<view class="count">{{ content.length }}/200</view>

				<view class="images">
					<view v-for="(img, idx) in images" :key="img" class="img-item">
						<image :src="img" mode="aspectFill" class="img" @tap="preview(idx)" />
						<view class="img-del" @tap.stop="remove(idx)">×</view>
					</view>
					<view v-if="images.length < maxImages" class="img-add" hover-class="img-add--hover" @tap="chooseImage">
						<text class="img-add-plus">+</text>
					</view>
				</view>
			</view>
		</view>

		<view class="submit-wrap">
			<u-button
				:text="$t('pages.my.helpPage.submit')"
				shape="circle"
				type="primary"
				color="#0B3BFF"
				:loading="submitting"
				@click="submit"
			></u-button>
		</view>

		<u-popup :show="faqPopupVisible" mode="bottom" :round="16" @close="faqPopupVisible = false">
			<view class="popup">
				<view class="popup-title">{{ currentFaq?.question || '' }}</view>
				<view class="popup-body">
					<u-markdown :content="currentFaq?.answer_markdown || ''"></u-markdown>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import $C from '@/common/config'
import { useInjected } from '@/common/composables/useInjected'
import { useAppRuntime } from '@/common/composables/useAppRuntime'
import { getDeviceInfo } from '@/common/platform'

const { t } = useI18n()
const { apiRequest, login } = useInjected()
const { getAppId, getLang, getBaseUrl } = useAppRuntime()

type FaqItem = { id: string; question?: string; answer_markdown?: string; updated_at?: string }
type FaqListRes = { total?: number; list?: FaqItem[] }
type UploadResponse = { code: number; message?: string; data?: { path?: string } }

const faqs = ref<FaqItem[]>([])
const faqLoading = ref<boolean>(false)
const faqPopupVisible = ref<boolean>(false)
const currentFaq = ref<FaqItem | null>(null)

const content = ref<string>('')
const images = ref<string[]>([])
const maxImages = ref<number>(6)
const submitting = ref<boolean>(false)

const openFaqList = () => {
	uni.navigateTo({ url: '/pages/content/faq' })
}

const openFaq = (item: FaqItem) => {
	currentFaq.value = item
	faqPopupVisible.value = true
}

const loadFaqs = async () => {
	if (!apiRequest) return
	const appid = getAppId()
	if (!appid) return
	faqLoading.value = true
	try {
		const res = await apiRequest<FaqListRes>('/api/v1/app/content/faqs', { appid, lang: getLang(), page: 1, page_size: 4 }, 'get')
		if (res && (res as any).code == 200) faqs.value = ((res as any).data?.list || []) as FaqItem[]
		else faqs.value = []
	} finally {
		faqLoading.value = false
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
		}
	})
}

const remove = (idx: number) => {
	images.value.splice(idx, 1)
}

const preview = (idx: number) => {
	uni.previewImage({ current: idx, urls: images.value })
}

const getUploadHeaders = (): Record<string, string> => {
	const token = uni.getStorageSync('access_token')
	const h: Record<string, string> = {}
	if (token) h['x-token'] = String(token)
	if ($C.tenantId) h['X-TenantID'] = String($C.tenantId)
	return h
}

const uploadOne = (filePath: string) =>
	new Promise<string>((resolve, reject) => {
		uni.uploadFile({
			url: `${getBaseUrl()}/api/v1/file/up`,
			filePath,
			name: 'file',
			formData: { type: 'feedback' },
			header: getUploadHeaders(),
			success: (res) => {
				try {
					const data = JSON.parse(res.data || '{}') as UploadResponse
					if (data && data.code == 200 && data.data?.path) resolve(data.data.path)
					else reject(new Error(data.message || 'upload failed'))
				} catch (e) {
					reject(e)
				}
			},
			fail: (err) => reject(err)
		})
	})

const submit = async () => {
	if (submitting.value) return
	if (!login?.isLoginType?.()?.isLogin) {
		uni.showToast({ title: t('pages.pleaseLogin') as string, icon: 'none' })
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	if (!apiRequest) return
	const appid = getAppId()
	if (!appid) {
		uni.showToast({ title: t('pages.appIdMissing') as string, icon: 'none' })
		return
	}
	const text = String(content.value || '').trim()
	if (!text) {
		uni.showToast({ title: t('pages.my.helpPage.feedbackEmpty') as string, icon: 'none' })
		return
	}

	submitting.value = true
	uni.showLoading({ title: t('common.loading') as string })
	try {
		const uploaded: string[] = []
		for (let i = 0; i < images.value.length; i += 1) {
			const p = await uploadOne(images.value[i])
			uploaded.push(p)
		}
		const info = getDeviceInfo() as unknown as { platform?: string; model?: string; system?: string }
		const res = await apiRequest<unknown>(
			'/api/v1/app/content/feedback',
			{
				appid,
				content: text,
				images: uploaded,
				platform: info.platform || '',
				device_model: info.model || '',
				os_version: info.system || ''
			},
			'post'
		)
		if (res && (res as any).code == 200) {
			uni.showToast({ title: t('pages.my.helpPage.submitSuccess') as string, icon: 'none' })
			content.value = ''
			images.value = []
		} else {
			uni.showToast({ title: (res as any)?.message || (t('pages.my.helpPage.submitFailed') as string), icon: 'none' })
		}
	} catch {
		uni.showToast({ title: t('pages.my.helpPage.submitFailed') as string, icon: 'none' })
	} finally {
		uni.hideLoading()
		submitting.value = false
	}
}

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.my.helpTitle') as string
	})
})

onLoad(() => {
	loadFaqs()
})
</script>

<style lang="scss" scoped>
.help-feedback-page {
	min-height: 100vh;
	background-color: #f5f6f8;
	padding: 24rpx 30rpx 40rpx;
	box-sizing: border-box;
}

.card {
	background: #fff;
	border-radius: 20rpx;
	box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.06);
	overflow: hidden;
}

.card--mt {
	margin-top: 24rpx;
}

.card-head {
	padding: 22rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.head-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f1f1f;
}

.more {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.more--hover {
	opacity: 0.85;
}

.more-text {
	font-size: 24rpx;
	color: #909399;
}

.loading,
.empty {
	padding: 24rpx;
	text-align: center;
}

.loading-text,
.empty-text {
	font-size: 26rpx;
	color: #909399;
}

.faq-row {
	padding: 22rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-top: 2rpx solid #f1f2f4;
}

.row--hover {
	background: rgba(0, 0, 0, 0.03);
}

.faq-q {
	font-size: 28rpx;
	color: #1f1f1f;
	flex: 1;
	margin-right: 18rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.form {
	padding: 0 24rpx 24rpx;
}

.textarea {
	width: 100%;
	min-height: 260rpx;
	background: #f5f6f8;
	border-radius: 16rpx;
	padding: 20rpx 18rpx;
	box-sizing: border-box;
	font-size: 28rpx;
	color: #1f1f1f;
}

.count {
	margin-top: 10rpx;
	text-align: right;
	font-size: 24rpx;
	color: #c0c4cc;
}

.images {
	margin-top: 18rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 18rpx;
}

.img-item,
.img-add {
	width: 156rpx;
	height: 156rpx;
	border-radius: 16rpx;
	overflow: hidden;
	position: relative;
}

.img-item {
	background: #f5f6f8;
}

.img {
	width: 156rpx;
	height: 156rpx;
}

.img-del {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 36rpx;
	height: 36rpx;
	border-radius: 18rpx;
	background: rgba(0, 0, 0, 0.45);
	color: #fff;
	font-size: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.img-add {
	background: #f5f6f8;
	display: flex;
	align-items: center;
	justify-content: center;
}

.img-add--hover {
	background: rgba(0, 0, 0, 0.06);
}

.img-add-plus {
	font-size: 54rpx;
	line-height: 1;
	color: #c0c4cc;
}

.submit-wrap {
	margin-top: 50rpx;
	padding-bottom: calc(env(safe-area-inset-bottom));
}

.popup {
	padding: 28rpx 24rpx 40rpx;
}

.popup-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1f1f1f;
	text-align: center;
}

.popup-body {
	margin-top: 20rpx;
}
</style>
