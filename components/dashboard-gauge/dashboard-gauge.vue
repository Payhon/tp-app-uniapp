<template>
    <view class="dashboard-container">
      <view class="gauge-wrapper">
        <!-- SVG 绘图区域 -->
        <svg viewBox="0 0 400 220" class="gauge-svg">
          <defs>
            <!-- 定义渐变颜色 -->
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#00E5FF" />
              <stop offset="100%" stop-color="#0033CC" />
            </linearGradient>
          </defs>
  
          <!-- 左侧 SOC 轨道背景 -->
          <path d="M 110,20 L 70,20 L 30,110 L 70,200 L 110,200" 
                fill="none" stroke="#E8EFFF" stroke-width="12" stroke-linecap="round" />
          <!-- 左侧 SOC 进度条 -->
          <path d="M 110,20 L 70,20 L 30,110 L 70,200 L 110,200" 
                fill="none" stroke="url(#gaugeGradient)" stroke-width="12" stroke-linecap="round"
                :style="{ strokeDasharray: totalLength, strokeDashoffset: leftOffset }" 
                class="progress-path" />
  
          <!-- 右侧 SOH 轨道背景 -->
          <path d="M 290,20 L 330,20 L 370,110 L 330,200 L 290,200" 
                fill="none" stroke="#E8EFFF" stroke-width="12" stroke-linecap="round" />
          <!-- 右侧 SOH 进度条 -->
          <path d="M 290,20 L 330,20 L 370,110 L 330,200 L 290,200" 
                fill="none" stroke="url(#gaugeGradient)" stroke-width="12" stroke-linecap="round"
                :style="{ strokeDasharray: totalLength, strokeDashoffset: rightOffset }" 
                class="progress-path" />
        </svg>
  
      <view class="content-overlay">
          <!-- 数值展示区 -->
          <view class="values-row">
            <view class="val-item">
              <view class="num-wrap">
                <text class="num-main">{{ soc }}</text>
                <text class="num-unit">%</text>
              </view>
              <text class="val-label">SOC</text>
            </view>
            
            <view class="val-item">
              <view class="num-wrap">
                <text class="num-main">{{ soh }}</text>
                <text class="num-unit">%</text>
              </view>
              <text class="val-label">SOH</text>
            </view>
          </view>
  
          <!-- 底部插槽 (状态和MAC地址) -->
          <view class="bottom-slot">
            <slot name="footer"></slot>
          </view>
        </view>
      </view>
    </view>
  </template>
  
  <script>
  export default {
    name: 'DashboardGauge',
    props: {
      // 电池电量
      soc: {
        type: Number,
        default: 80
      },
      // 健康度
      soh: {
        type: Number,
        default: 96
      }
    },
    data() {
      return {
        // 这里的长度是根据 SVG 路径模拟计算的大约长度
        totalLength: 320 
      };
    },
    computed: {
      // 计算左侧进度偏移
      leftOffset() {
        const percentage = Math.min(Math.max(this.soc, 0), 100);
        return this.totalLength - (this.totalLength * (percentage / 100));
      },
      // 计算右侧进度偏移
      rightOffset() {
        const percentage = Math.min(Math.max(this.soh, 0), 100);
        return this.totalLength - (this.totalLength * (percentage / 100));
      }
    }
  };
  </script>
  
  <style lang="scss" scoped>
  .dashboard-container {
    width: 100%;
    padding: 40rpx 30rpx;
    background: linear-gradient(180deg, #F5FAFF 0%, #FFFFFF 100%);
    border-radius: 40rpx;
    box-sizing: border-box;
  }
  
  .gauge-wrapper {
    position: relative;
    width: 100%;
    height: 440rpx;
  }
  
  .gauge-svg {
    width: 100%;
    height: 100%;
    /* 增加一点阴影效果 */
    filter: drop-shadow(0 4px 8px rgba(0, 50, 150, 0.05));
  }
  
  .progress-path {
    /* 增加动画过渡 */
    transition: stroke-dashoffset 1s ease-in-out;
  }
  
  .content-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .values-row {
    display: flex;
    justify-content: space-around;
    width: 80%;
    margin-top: -20rpx;
  }
  
  .val-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .num-wrap {
      display: flex;
      align-items: baseline;
      
      .num-main {
        font-size: 72rpx;
        font-weight: 700;
        color: #003399;
        font-family: "Avenir Next", Helvetica, Arial, sans-serif;
      }
      
      .num-unit {
        font-size: 32rpx;
        color: #003399;
        margin-left: 4rpx;
        font-weight: 500;
      }
    }
    
    .val-label {
      font-size: 32rpx;
      color: #333;
      font-weight: 500;
      margin-top: 4rpx;
    }
  }
  
  .bottom-slot {
    margin-top: 30rpx;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  </style>