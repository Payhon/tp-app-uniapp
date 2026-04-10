<template>
  <view class="page">
    <view class="card">
      <view class="field">
        <text class="label">{{ $t("pages.my.settingPage.username") }}</text>
        <input
          class="input"
          type="text"
          v-model="username"
          :placeholder="$t('pages.my.settingPage.usernamePlaceholder')"
          placeholder-class="placeholder"
        />
      </view>
      <view class="tip">{{ $t("pages.my.settingPage.usernameTip") }}</view>
    </view>

    <view class="actions">
      <u-button
        :text="$t('common.confirm')"
        shape="circle"
        type="primary"
        color="#0B3BFF"
        :loading="saving"
        :disabled="disabled"
        @click="save"
      ></u-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import { useInjected } from "@/common/composables/useInjected";
import { useUserStore } from "@/store/user";

const { t } = useI18n();
const { apiRequest, login } = useInjected();
const userStore = useUserStore();

const username = ref<string>("");
const saving = ref<boolean>(false);

const currentUsername = computed(() =>
  String(userStore.userInfo?.username || "").trim(),
);
const disabled = computed(
  () => saving.value || !String(username.value || "").trim(),
);

const ensureLogin = (): boolean => {
  if (!login?.isLoginType?.()?.isLogin) {
    uni.showToast({ title: t("pages.pleaseLogin") as string, icon: "none" });
    uni.navigateTo({ url: "/pages/login/login" });
    return false;
  }
  return true;
};

const load = () => {
  if (currentUsername.value) {
    uni.showToast({
      title: t("pages.my.settingPage.usernameAlreadySet") as string,
      icon: "none",
    });
    setTimeout(() => uni.navigateBack({ delta: 1 }), 300);
    return;
  }
  username.value = "";
};

const validate = (): boolean => {
  const v = String(username.value || "").trim();
  if (!v) {
    uni.showToast({
      title: t("pages.my.settingPage.usernamePlaceholder") as string,
      icon: "none",
    });
    return false;
  }
  if (v.length < 2 || v.length > 50) {
    uni.showToast({
      title: t("pages.my.settingPage.usernameInvalid") as string,
      icon: "none",
    });
    return false;
  }
  return true;
};

const save = async () => {
  if (!ensureLogin()) return;
  if (!apiRequest || saving.value) return;
  if (!validate()) return;

  saving.value = true;
  try {
    const v = String(username.value || "").trim();
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/username",
      { username: v },
      "post",
    );
    if (res && (res as any).code === 200) {
      userStore.editUserInfoField({ key: "username", value: v });
      uni.showToast({
        title: t("pages.my.settingPage.usernameSetSuccess") as string,
        icon: "none",
        success: () => uni.navigateBack({ delta: 1 }),
      });
    } else {
      const detail = (res as any)?.data?.error;
      uni.showToast({
        title:
          detail ||
          (res as any)?.message ||
          (t("pages.my.settingPage.usernameSetFailed") as string),
        icon: "none",
      });
    }
  } catch {
    uni.showToast({
      title: t("pages.my.settingPage.usernameSetFailed") as string,
      icon: "none",
    });
  } finally {
    saving.value = false;
  }
};

onLoad(() => {
  if (!ensureLogin()) return;
  load();
});

onShow(() => {
  uni.setNavigationBarTitle({
    title: t("pages.my.settingPage.usernameTitle") as string,
  });
});
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 24rpx 30rpx 40rpx;
  box-sizing: border-box;
}

.card {
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.06);
  padding: 24rpx;
  box-sizing: border-box;
}

.field {
}

.label {
  display: block;
  font-size: 24rpx;
  color: #909399;
  margin-bottom: 10rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: #f5f6f8;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #1f1f1f;
}

.placeholder {
  font-size: 28rpx;
  color: #c0c4cc;
}

.tip {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #909399;
}

.actions {
  margin-top: 40rpx;
  padding-bottom: calc(env(safe-area-inset-bottom));
}
</style>
