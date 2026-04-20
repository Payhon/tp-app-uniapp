<template>
  <view class="app-avatar" :class="[`app-avatar--${shape}`]" :style="boxStyle">
    <image class="app-avatar__image" :src="resolvedSrc" mode="aspectFill" />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getDefaultAvatar } from "@/common/avatar";

const props = withDefaults(
  defineProps<{
    src?: string;
    size?: string | number;
    shape?: "circle" | "square";
  }>(),
  {
    src: "",
    size: 40,
    shape: "circle",
  },
);

const resolvedSrc = computed(() => props.src || getDefaultAvatar());

const toUnit = (value: string | number): string =>
  typeof value === "number" ? `${value}px` : String(value);

const boxStyle = computed(() => {
  const size = toUnit(props.size);
  return {
    width: size,
    height: size,
  };
});
</script>

<style scoped lang="scss">
.app-avatar {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);

  &--circle {
    border-radius: 50%;
  }

  &--square {
    border-radius: 16rpx;
  }
}

.app-avatar__image {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
