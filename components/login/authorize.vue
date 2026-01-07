	<template>
		<view>
			<view class="authorizeBtn">
				<view class="authorizetitle"><image class="authorize-logo" src="../../static/icon/fisheryLogo.png" /></view>
				<view class="authorizeInfo">{{ $t('components.authorize.info') }}</view>
				<button @click="toCancel" class="authorize-btn cancel">{{ $t('components.authorize.cancelBtn') }}</button>
				<!-- #ifdef MP-WEIXIN -->
				<button @click="getuserinfo" class="authorize-btn">{{ $t('components.authorize.getAuthBtn') }}</button>
				<!-- #endif -->
				<!-- #ifdef MP-ALIPAY -->
				<button
					size="default"
					scope="userInfo"
					@click="getuserinfo"
					class="authorize-btn"
				>
					{{ $t('components.authorize.getAuthBtn') }}
				</button>
				<!-- #endif -->
		</view>
	</view>
</template>

<script>
export default {
	components: {},
	data() {
		return {
		};
	},
	props: {},
	onShow() {},
	onLoad() {},
	methods: {
		getuserinfo(){
			this.$emit('getuserinfo');
		},
		toCancel(){
			this.$emit('cancel');
		}
	}
};
</script>

<style scoped lang="scss">
//授权按钮
	.authorizeBtn {
	position: fixed;
	z-index: 999999;
	width: 750rpx;
	height: 419rpx;
	background: #FFFFFF;
	border-radius: 20rpx 20rpx 0px 0px;
	text-align: center;
	bottom: 0;
		.authorizetitle {
			height: 75rpx;
			margin-top: 55rpx;
			margin-bottom: 30rpx;
			.authorize-logo{
				width: 155rpx;
				height: 75rpx;
				margin: 0 auto;
			}
		}
	.authorizeInfo {
		font-size: 28rpx;
		font-family: Source Han Sans CN;
		font-weight: 500;
		color: #333333;
		margin-top: 30rpx;
	}
		.authorize-btn {
			margin-top: 78rpx;
			width: 218rpx;
			height: 73rpx;
			line-height: 73rpx;
			background: #07C160;
		border-radius: 8rpx;
		font-size: 28rpx;
		font-family: Source Han Sans CN;
		font-weight: bold;
		color: #FFFFFF;
		text-align: center;
			display: inline-block;
			
		}
		.authorize-btn.cancel{
			width: 218rpx;
			height: 73rpx;
			background: #F2F2F2;
			border-radius: 8rpx;
		font-size: 28rpx;
		font-family: Source Han Sans CN;
		font-weight: bold;
		color: #07C160;
		margin-right: 27rpx;
	}
}
</style>
