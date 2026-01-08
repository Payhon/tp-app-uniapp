<template>
	<view 
		v-if="value"
		class="customizePopup"
		@click.stop="maskClosePopup"
		@touchmove.stop.prevent="stopScrolling"
		
		:style="{
			zIndex,
			'backgroundColor': maskBackgroundColor
		}"
	>
		<view 
			@click.stop.prevent
			class="customizePopup-content"
		>
			<view class="customizePopup-content-header">
				{{ title }}
			</view>
			
			<view 
				:style="{'textAlign': mainAlign}"
				class="customizePopup-content-main"
			>
				<slot name="main">
					{{ content }}
				</slot>
			</view>
			
			<slot name="footer">
				<view class="customizePopup-content-footer">
						<button 
							type="default"
							:disabled="isLoading"
							@click="popupCloseCallBack"
						>
							{{ cancelText }}
						</button>
						<button 
							type="default"
							:loading="isLoading"
							@click="popupSubmitCallBack"
						>
							{{ confirmText }}
						</button>
				</view>
			</slot>
			
		</view>
		
	</view>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { useI18n } from 'vue-i18n'

	type PopupParams = Record<string, unknown>
	type MaybePromise<T> = T | Promise<T>

	type Props = {
		// 兼容 Vue2 v-model（value/input）与 Vue3 v-model（modelValue/update:modelValue）
		value?: boolean
		modelValue?: boolean
		opacity?: number | string
		zIndex?: number | string
		mainAlign?: string
		isMask?: boolean
		closeCallBack?: (params: PopupParams) => MaybePromise<unknown>
		submitCallBack?: (params: PopupParams) => MaybePromise<unknown>
		title?: string
		content?: string
		cancelText?: string
		confirmText?: string
		popupParams?: PopupParams
	}

	const props = withDefaults(defineProps<Props>(), {
		modelValue: false,
		opacity: 0.5,
		zIndex: 999,
		mainAlign: 'center',
		isMask: true,
		popupParams: () => ({}),
	})

	const emit = defineEmits<{
		(e: 'input', v: boolean): void
		(e: 'update:value', v: boolean): void
		(e: 'update:modelValue', v: boolean): void
	}>()

	const { t } = useI18n()

	const isLoading = ref<boolean>(false)

	const value = computed<boolean>(() => (props.value !== undefined ? props.value : props.modelValue) ?? false)
	const zIndex = computed<number | string>(() => props.zIndex)
	const mainAlign = computed<string>(() => props.mainAlign)
	const title = computed<string>(() => props.title ?? t('components.popup.title'))
	const content = computed<string>(() => props.content ?? t('components.popup.content'))
	const cancelText = computed<string>(() => props.cancelText ?? t('components.popup.cancel'))
	const confirmText = computed<string>(() => props.confirmText ?? t('components.popup.confirm'))

	const maskBackgroundColor = computed<string>(() => `rgba(0, 0, 0, ${props.opacity})`)

	const closePopup = () => {
		emit('input', false)
		emit('update:value', false)
		emit('update:modelValue', false)
	}

	const maskClosePopup = () => {
		if (!props.isMask || isLoading.value) return
		popupCloseCallBack()
	}

	const popupCloseCallBack = async () => {
		const fn = props.closeCallBack
		if (!fn) {
			closePopup()
			return
		}
		await Promise.resolve(fn(props.popupParams))
		closePopup()
	}

	const popupSubmitCallBack = async () => {
		if (isLoading.value) return
		const fn = props.submitCallBack
		const backType = fn ? fn(props.popupParams) : undefined

		if (backType && backType instanceof Promise) {
			isLoading.value = true
			try {
				await backType
			} finally {
				isLoading.value = false
				closePopup()
			}
			return
		}
		closePopup()
	}

	const stopScrolling = () => {}
</script>

<style lang="scss" scoped>
	.customizePopup {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;

		&-content {
			position: fixed;
			top: 50%;
			left: 50%;
			color: #333;
			
			overflow: hidden;
			background: #FFF;
			min-height: 346rpx;
			border-radius: 16rpx;
			width: calc(100vw - 72rpx);
			transform: translate(-50%, -50%);
			
			&-header {
				margin-top: 52rpx;
				font-size: 36rpx;
				font-weight: 500;
				text-align: center;
			}
			
			&-main {
				font-size: 28rpx;
				line-height: 44rpx;
				
				padding: 32rpx 80rpx 70rpx;
			}
			
			&-footer {
				display: flex;

				height: 98rpx;
				box-sizing: border-box;
				border-top: 1rpx solid #E5E5E5;
				
				button {
					flex: 1;
					border: none;
					border-radius: 0;
					
					color: #666;
					font-size: 32rpx;
					
					line-height: 97rpx;
					background: transparent;
	
					&:last-child {
						color: #1677FF;
						font-weight: 500;
						border-left: 1rpx solid #E5E5E5;
					}
	
					&::after {
						display: none;
					}
				}
			}
		}
		
	}
</style>
