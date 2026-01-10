<template>
	<view class="modal-container" :class="{show: showValue}" @touchmove.stop @click.stop='cancel(2)'>
		<view class="modal-content" v-if="showValue" @click.stop>
			<slot name='title'>
				<view class="modal-title" :class="{'modal-title-padding': !text}" v-if="titleText">
					{{ titleText }}
				</view>
			</slot>
			<slot name='text'>
				<view class="modal-article" v-if="text">
					<!-- text 文本信息 -->
					{{ text }}
				</view>
			</slot>
			<view class="modal-row">
				<view class="modal-col" :style="cancelStyle" hover-class="modal-hover" v-if="!noCancel" @click='cancel(1)'>
					{{ cancelTextComputed }}
				</view>
				<view class="modal-col modal-confirm" :style="confirmStyle" hover-class="modal-hover" @click='confirm'>
					{{ confirmTextComputed }}
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type StyleValue = string | Record<string, string>

const props = defineProps<{
	title?: string
	text?: string
	noCancel?: boolean
	cancelText?: string
	cancelStyle?: StyleValue
	confirmText?: string
	confirmStyle?: StyleValue
	prevent?: boolean
	// Vue3 v-model
	modelValue?: boolean
	// Vue2 兼容（历史遗留）
	value?: boolean
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void
	(e: 'input', value: boolean): void
	(e: 'confirm', payload: { from: 'confirm'; confirm: true }): void
	(e: 'cancel', payload: { from: 'cancel' | 'mask'; cancel?: true; mask?: true }): void
	(e: 'event', payload: Record<string, unknown>): void
}>()

const { t } = useI18n()

const showValue = computed<boolean>({
	get() {
		if (typeof props.modelValue === 'boolean') return props.modelValue
		if (typeof props.value === 'boolean') return props.value
		return false
	},
	set(v: boolean) {
		emit('update:modelValue', v)
		emit('input', v)
	}
})

const titleText = computed(() => props.title || (t('common.tip') as string))
const cancelTextComputed = computed(() => props.cancelText || (t('common.cancel') as string))
const confirmTextComputed = computed(() => props.confirmText || (t('common.ok') as string))

const confirm = () => {
	showValue.value = false
	const msg = { from: 'confirm' as const, confirm: true as const }
	emit('confirm', msg)
	emit('event', msg)
}

const cancel = (type: 1 | 2) => {
	if (props.prevent !== false && type === 2) return
	showValue.value = false
	const msg: { from: 'cancel' | 'mask'; cancel?: true; mask?: true } = { from: type === 1 ? 'cancel' : 'mask' }
	if (type === 1) msg.cancel = true
	else msg.mask = true
	emit('cancel', msg)
	emit('event', msg)
}
</script>

<style lang="scss">
	$fontSizeLg: 18px;
	$fontSizeSm: 16px;
	
	.modal-container{
		position: fixed;top: 0;left: 0;right: 0;bottom: 0;z-index: 999;background: rgba(0, 0, 0, .6);visibility: hidden;opacity: 0;transition: all .2s;display: flex;align-items: center;justify-content: center;
		.modal-content{
			width: 80%;border-radius: 10rpx;background: #fff;overflow: hidden;animation: fadeZoom .15s linear;
			.modal-title{
				padding: 30rpx 30rpx 0;text-align: center;color: #404040;font-size: $fontSizeLg;font-weight: 600;
			}
			.modal-title-padding{padding-bottom: 30rpx;}
			.modal-article{
				padding: 40rpx 30rpx 50rpx;font-size: $fontSizeSm;color: #333;text-align: center;line-height: 1.6;font-weight: 400;
			}
			.modal-row{
				display: flex;text-align: center;font-size: $fontSizeLg;line-height: 100rpx;position: relative;color: #404040;
				.modal-col{
					flex: 1;width: 100%;position: relative;
				}
				.modal-col:first-child::after{
					content: '';position: absolute;top: 0;bottom: 0;right: 0;border-right: 1px solid #e5e5e5;transform: scaleX(.36);
				}
				.modal-confirm{color: rgb(0, 122, 255);font-weight: 500;}
				.modal-hover{background: #f2f2f2;}
			}
			.modal-row::after{
				content: '';position: absolute;left: 0;right: 0;top: 0;border-top: 1px solid #e5e5e5;transform: scaleY(.36);
			}
		}
		@keyframes fadeZoom {
			0%{transform: scale(.7);opacity: .6;}
			80%{transform: scale(1.2);opacity: .3;}
			100%{transform: scale(1);opacity: 1;}
		}
	}
	.modal-container.show{
		visibility: visible;opacity: 1;
	}
</style>
