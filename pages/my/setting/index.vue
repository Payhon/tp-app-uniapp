<template>
  <view class="setting-page">
    <view class="card">
      <view class="row" hover-class="row--hover" @tap="handleEditAvatar">
        <text class="label">{{ $t("pages.my.settingPage.editAvatar") }}</text>
        <view class="right">
          <u-avatar :src="avatarSrc" size="32"></u-avatar>
          <u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
        </view>
      </view>
      <view class="divider"></view>
      <view class="row" hover-class="row--hover" @tap="handleEditNickname">
        <text class="label">{{ $t("pages.my.settingPage.editNickname") }}</text>
        <view class="right">
          <text
            class="value"
            :class="{ 'value--placeholder': !nicknameDisplay }"
            >{{
              nicknameDisplay || $t("pages.my.settingPage.nicknameUnset")
            }}</text
          >
          <u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
        </view>
      </view>
    </view>

    <view class="card card--mt">
      <view
        class="row"
        :hover-class="canSetUsername ? 'row--hover' : ''"
        @tap="goSetUsername"
      >
        <text class="label">{{ $t("pages.my.settingPage.account") }}</text>
        <view class="right">
          <text class="value" :class="{ 'value--placeholder': !username }">
            {{ username || $t("pages.my.settingPage.setAccount") }}
          </text>
          <u-icon
            v-if="canSetUsername"
            name="arrow-right"
            size="16"
            color="#C0C4CC"
          ></u-icon>
        </view>
      </view>
    </view>

    <view class="card card--mt">
      <view class="row" hover-class="row--hover" @tap="goChangePassword">
        <text class="label">{{ $t("pages.modifyPassword") }}</text>
        <view class="right">
          <u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
        </view>
      </view>
    </view>

    <view class="card card--mt">
      <view class="row-head">
        <text class="head-title">{{
          $t("pages.my.settingPage.accountBinding")
        }}</text>
      </view>

      <!-- 手机号绑定 -->
      <!-- #ifdef MP-WEIXIN -->
      <view
        v-if="phoneBound"
        class="row"
        hover-class="row--hover"
        @tap="openBindPopup('phone')"
      >
        <text class="label">{{ $t("pages.my.settingPage.bindPhone") }}</text>
        <view class="right">
          <text class="value">{{ maskedPhone }}</text>
          <u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
        </view>
      </view>
      <button
        v-else
        class="row-btn"
        hover-class="row--hover"
        open-type="getPhoneNumber"
        @getphonenumber="onWxGetPhoneNumber"
      >
        <view class="row row--btn">
          <text class="label">{{ $t("pages.my.settingPage.bindPhone") }}</text>
          <view class="right">
            <text class="value value--placeholder">{{
              $t("pages.my.settingPage.unbound")
            }}</text>
            <u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
          </view>
        </view>
      </button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="row" hover-class="row--hover" @tap="openBindPopup('phone')">
        <text class="label">{{ $t("pages.my.settingPage.bindPhone") }}</text>
        <view class="right">
          <text class="value" :class="{ 'value--placeholder': !phoneBound }">
            {{ phoneBound ? maskedPhone : $t("pages.my.settingPage.unbound") }}
          </text>
          <u-icon name="arrow-right" size="16" color="#C0C4CC"></u-icon>
        </view>
      </view>
      <!-- #endif -->

      <view class="divider"></view>

      <!-- Email绑定 -->
      <view class="row" hover-class="row--hover" @tap="openBindPopup('email')">
        <text class="label">{{ $t("pages.my.settingPage.bindEmail") }}</text>
        <view class="right">
          <text class="value" :class="{ 'value--placeholder': !emailBound }">
            {{ emailBound ? maskedEmail : $t("pages.my.settingPage.unbound") }}
          </text>
          <u-icon
            v-if="!emailBound"
            name="arrow-right"
            size="16"
            color="#C0C4CC"
          ></u-icon>
        </view>
      </view>

      <view class="divider"></view>

      <!-- 微信绑定 -->
      <view class="row" hover-class="row--hover" @tap="bindWeChat">
        <text class="label">{{ $t("pages.my.settingPage.bindWeChat") }}</text>
        <view class="right">
          <text class="value" :class="{ 'value--placeholder': !wechatBound }">
            {{
              wechatBound
                ? $t("pages.my.settingPage.bound")
                : $t("pages.my.settingPage.unbound")
            }}
          </text>
          <u-icon
            v-if="!wechatBound"
            name="arrow-right"
            size="16"
            color="#C0C4CC"
          ></u-icon>
        </view>
      </view>

      <view class="divider"></view>

      <view
        class="row row--danger"
        hover-class="row--hover"
        @tap="confirmDeleteAccount"
      >
        <text class="label label--danger">{{
          $t("pages.my.settingPage.deleteAccount")
        }}</text>
        <view class="right">
          <u-icon name="arrow-right" size="16" color="#F56C6C"></u-icon>
        </view>
      </view>
    </view>

    <view class="logout-wrap">
      <u-button
        :text="$t('pages.accounts.logout')"
        shape="circle"
        type="primary"
        color="#0B3BFF"
        @click="doLogout"
      ></u-button>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <u-wx-auth
      :show="wxAuthVisible"
      @close="wxAuthVisible = false"
      @confirm="onWxAuthConfirm"
    ></u-wx-auth>
    <!-- #endif -->

    <u-popup
      :show="bindPopupVisible"
      mode="bottom"
      :round="16"
      @close="bindPopupVisible = false"
    >
      <view class="popup">
        <view class="popup-title">{{ bindPopupTitle }}</view>

        <view class="popup-form">
          <template v-if="bindType === 'phone'">
            <view class="field">
              <text class="field-label">{{
                $t("pages.my.settingPage.phone")
              }}</text>
              <input
                class="field-input"
                type="text"
                v-model="bindPhone"
                :placeholder="$t('pages.my.settingPage.phonePlaceholder')"
              />
            </view>
          </template>

          <template v-else>
            <view class="field">
              <text class="field-label">{{
                $t("pages.my.settingPage.email")
              }}</text>
              <input
                class="field-input"
                type="text"
                v-model="bindEmail"
                :placeholder="$t('pages.my.settingPage.emailPlaceholder')"
              />
            </view>
          </template>

          <view class="field field--code">
            <text class="field-label">{{
              $t("pages.my.settingPage.verifyCode")
            }}</text>
            <view class="code-row">
              <input
                class="field-input field-input--code"
                type="text"
                v-model="bindCode"
                :placeholder="$t('pages.my.settingPage.codePlaceholder')"
              />
              <u-button
                :customStyle="codeSendButtonStyle"
                :text="codeBtnText"
                size="small"
                shape="circle"
                type="primary"
                color="#0B3BFF"
                :disabled="codeCountdown > 0 || sendingCode"
                @click="sendBindCode"
              ></u-button>
            </view>
          </view>
        </view>

        <view class="popup-actions">
          <view class="popup-actions__cancel">
            <u-button
              :customStyle="popupCancelButtonStyle"
              :text="$t('common.cancel')"
              shape="circle"
              @click="bindPopupVisible = false"
            ></u-button>
          </view>
          <view class="popup-actions__confirm">
            <u-button
              :customStyle="popupConfirmButtonStyle"
              :text="$t('common.confirm')"
              shape="circle"
              type="primary"
              color="#0B3BFF"
              :loading="binding"
              @click="submitBind"
            ></u-button>
          </view>
        </view>
      </view>
    </u-popup>

    <u-popup
      :show="nicknamePopupVisible"
      mode="bottom"
      :round="16"
      @close="nicknamePopupVisible = false"
    >
      <view class="popup">
        <view class="popup-title">{{
          $t("pages.my.settingPage.editNickname")
        }}</view>
        <view class="popup-form">
          <view class="field">
            <text class="field-label">{{
              $t("pages.my.settingPage.nickname")
            }}</text>
            <input
              class="field-input"
              type="text"
              v-model="nicknameInput"
              :placeholder="$t('pages.my.settingPage.nicknamePlaceholder')"
            />
          </view>
        </view>
        <view class="popup-actions">
          <view class="popup-actions__cancel">
            <u-button
              :customStyle="popupCancelButtonStyle"
              :text="$t('common.cancel')"
              shape="circle"
              @click="nicknamePopupVisible = false"
            ></u-button>
          </view>
          <view class="popup-actions__confirm">
            <u-button
              :customStyle="popupConfirmButtonStyle"
              :text="$t('common.confirm')"
              shape="circle"
              type="primary"
              color="#0B3BFF"
              :loading="savingNickname"
              @click="saveNickname"
            ></u-button>
          </view>
        </view>
      </view>
    </u-popup>

    <u-popup
      :show="deleteAccountPopupVisible"
      mode="bottom"
      :round="16"
      @close="closeDeleteAccountPopup"
    >
      <view class="popup">
        <view class="popup-title">{{
          $t("pages.my.settingPage.deleteAccountPasswordTitle")
        }}</view>
        <view class="popup-desc popup-desc--danger">{{
          $t("pages.my.settingPage.deleteAccountPasswordHint")
        }}</view>
        <view class="popup-form">
          <view class="field">
            <text class="field-label">{{
              $t("pages.my.settingPage.currentPassword")
            }}</text>
            <view class="field-input-wrap">
              <input
                class="field-input field-input--with-icon"
                type="text"
                :password="!showDeletePassword"
                v-model="deletePassword"
                :placeholder="
                  $t('pages.my.settingPage.currentPasswordPlaceholder')
                "
              />
              <view
                class="field-eye"
                @tap="showDeletePassword = !showDeletePassword"
              >
                <u-icon
                  :name="showDeletePassword ? 'eye-fill' : 'eye-off'"
                  size="18"
                  color="#909399"
                ></u-icon>
              </view>
            </view>
          </view>
        </view>
        <view class="popup-actions">
          <view class="popup-actions__cancel">
            <u-button
              :customStyle="popupCancelButtonStyle"
              :text="$t('common.cancel')"
              shape="circle"
              @click="closeDeleteAccountPopup"
            ></u-button>
          </view>
          <view class="popup-actions__confirm">
            <u-button
              :customStyle="popupDangerButtonStyle"
              :text="$t('pages.my.settingPage.confirmDeleteAccount')"
              shape="circle"
              type="error"
              color="#F56C6C"
              :loading="deletingAccount"
              @click="submitDeleteAccount"
            ></u-button>
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import $C from "@/common/config";
import { useInjected } from "@/common/composables/useInjected";
import { useAppRuntime } from "@/common/composables/useAppRuntime";
import { deleteCurrentAccount } from "@/service/app-auth";
import { useUserStore } from "@/store/user";

const { t } = useI18n();
const { apiRequest, login } = useInjected();
const { getBaseUrl } = useAppRuntime();
const userStore = useUserStore();

type BindingItem = {
  identity_type: string;
  identifier: string;
  status?: string;
};
type BindingsResp = { user_id?: string; list?: BindingItem[] };
type UploadResponse = {
  code: number;
  message?: string;
  data?: { path?: string };
};

const isLoggedIn = computed(() => login?.isLoginType?.()?.isLogin ?? false);

const bindings = ref<BindingItem[]>([]);
const loadingBindings = ref<boolean>(false);

const phoneBinding = computed(() =>
  bindings.value.find((x) => x.identity_type === "PHONE"),
);
const emailBinding = computed(() =>
  bindings.value.find((x) => x.identity_type === "EMAIL"),
);
const wechatBinding = computed(() =>
  bindings.value.find((x) => x.identity_type === "WXMP_OPENID"),
);

const phoneBound = computed(() => !!phoneBinding.value);
const emailBound = computed(() => !!emailBinding.value);
const wechatBound = computed(() => !!wechatBinding.value);

const parseAdditionalInfo = (raw: unknown): Record<string, unknown> | null => {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  const s = String(raw).trim();
  if (!s) return null;
  try {
    const obj = JSON.parse(s) as unknown;
    if (obj && typeof obj === "object") return obj as Record<string, unknown>;
  } catch {}
  return null;
};

const wxNickName = computed(() => {
  // #ifdef MP-WEIXIN
  const u = userStore.userInfo as any;
  const additional = parseAdditionalInfo(
    u?.additional_info ?? u?.additionalInfo,
  );
  const nick = (additional as any)?.wx_profile?.nick_name;
  return String(nick || "").trim();
  // #endif
  return "";
});

const nicknameDisplay = computed(() => {
  // #ifdef MP-WEIXIN
  return wxNickName.value;
  // #endif
  return String(userStore.userInfo?.name || "").trim();
});

const username = computed(() =>
  String(userStore.userInfo?.username || "").trim(),
);
const hasUsername = computed(() => !!username.value);
const canSetUsername = computed(() => !hasUsername.value);
const avatarSrc = computed(() => {
  const raw = (userStore.userInfo as any)?.avatar_url as string | undefined;
  if (!raw) return "/static/image/my/avatar-default@2x.png";
  const baseUrl = String(getBaseUrl() || "")
    .replace(/\/?api\/v1\/?$/, "")
    .replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/${String(raw).replace(/^\//, "")}` : String(raw);
});

const maskPhone = (input: string) => {
  const s = String(input || "").replace(/\s+/g, "");
  if (s.length < 7) return s;
  return s.slice(0, 3) + "****" + s.slice(-4);
};
const maskedPhone = computed(() =>
  maskPhone(phoneBinding.value?.identifier || ""),
);

const maskEmail = (input: string) => {
  const s = String(input || "").trim();
  const idx = s.indexOf("@");
  if (idx <= 1) return s;
  return s.slice(0, 1) + "****" + s.slice(idx);
};
const maskedEmail = computed(() =>
  maskEmail(emailBinding.value?.identifier || ""),
);

const getUploadHeaders = (): Record<string, string> => {
  const token = uni.getStorageSync("access_token");
  const h: Record<string, string> = {};
  if (token) h["x-token"] = String(token);
  if ($C.tenantId) h["X-TenantID"] = String($C.tenantId);
  return h;
};

const uploadOne = (filePath: string) =>
  new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${getBaseUrl()}/api/v1/file/up`,
      filePath,
      name: "file",
      formData: { type: "avatar" },
      header: getUploadHeaders(),
      success: (res) => {
        try {
          const data = JSON.parse(res.data || "{}") as UploadResponse;
          if (data && data.code == 200 && data.data?.path)
            resolve(data.data.path);
          else reject(new Error(data.message || "upload failed"));
        } catch (e) {
          reject(e);
        }
      },
      fail: (err) => reject(err),
    });
  });

const loadBindings = async () => {
  if (!apiRequest || loadingBindings.value) return;
  loadingBindings.value = true;
  try {
    const res = await apiRequest<BindingsResp>(
      "/api/v1/app/auth/bindings",
      {},
      "get",
    );
    if (res && (res as any).code == 200)
      bindings.value = (((res as any).data?.list || []) as BindingItem[]) || [];
    else bindings.value = [];
  } finally {
    loadingBindings.value = false;
  }
};

const refreshUserInfo = async () => {
  if (!apiRequest) return;
  try {
    const res = await apiRequest<Record<string, unknown>>(
      "/api/v1/user/detail",
      {},
      "get",
    );
    if (res && (res as any).code == 200 && (res as any).data)
      userStore.setUserInfo((res as any).data as any);
  } catch {}
};

const wxAuthVisible = ref<boolean>(false);

const ensureLogin = (): boolean => {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: "/pages/login/login" });
    return false;
  }
  return true;
};

const handleEditAvatar = async () => {
  if (!ensureLogin()) return;
  // #ifdef MP-WEIXIN
  wxAuthVisible.value = true;
  return;
  // #endif
  // #ifndef MP-WEIXIN
  try {
    const choose = await new Promise<{ tempFilePaths?: string[] }>(
      (resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          success: resolve,
          fail: reject,
        });
      },
    );
    const filePath = String(choose?.tempFilePaths?.[0] || "").trim();
    if (!filePath) return;
    if (!apiRequest) return;
    uni.showLoading({ title: t("common.loading") as string });
    const uploadedPath = await uploadOne(filePath);
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/profile",
      { avatar_url: uploadedPath },
      "post",
    );
    if (res && (res as any).code == 200) {
      userStore.editUserInfoField({ key: "avatar_url", value: uploadedPath });
      await refreshUserInfo();
      uni.showToast({
        title: t("pages.my.settingPage.updateSuccess") as string,
        icon: "none",
      });
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.updateFailed") as string),
        icon: "none",
      });
    }
  } catch {
    // ignore
  } finally {
    uni.hideLoading();
  }
  // #endif
};

const nicknamePopupVisible = ref<boolean>(false);
const nicknameInput = ref<string>("");
const savingNickname = ref<boolean>(false);

const handleEditNickname = () => {
  if (!ensureLogin()) return;
  // #ifdef MP-WEIXIN
  wxAuthVisible.value = true;
  return;
  // #endif
  // #ifndef MP-WEIXIN
  nicknameInput.value = String(userStore.userInfo?.name || "").trim();
  nicknamePopupVisible.value = true;
  // #endif
};

const saveNickname = async () => {
  if (!apiRequest || savingNickname.value) return;
  const nick = String(nicknameInput.value || "").trim();
  if (!nick) {
    uni.showToast({
      title: t("pages.my.settingPage.nicknamePlaceholder") as string,
      icon: "none",
    });
    return;
  }
  savingNickname.value = true;
  try {
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/profile",
      { nick_name: nick },
      "post",
    );
    if (res && (res as any).code == 200) {
      userStore.editUserInfoField({ key: "name", value: nick });
      nicknamePopupVisible.value = false;
      await refreshUserInfo();
      uni.showToast({
        title: t("pages.my.settingPage.updateSuccess") as string,
        icon: "none",
      });
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.updateFailed") as string),
        icon: "none",
      });
    }
  } finally {
    savingNickname.value = false;
  }
};

// #ifdef MP-WEIXIN
const onWxAuthConfirm = async (payload: {
  avatar?: string;
  nickname?: string;
}) => {
  wxAuthVisible.value = false;
  if (!apiRequest) return;
  const avatar = String(payload?.avatar || "").trim();
  const nickname = String(payload?.nickname || "").trim();
  if (!avatar && !nickname) return;
  uni.showLoading({ title: t("common.loading") as string });
  try {
    let uploadedPath: string | undefined;
    if (avatar) uploadedPath = await uploadOne(avatar);
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/wxmp/profile",
      {
        nick_name: nickname || undefined,
        avatar_url: uploadedPath || undefined,
      },
      "post",
    );
    if (res && (res as any).code == 200) {
      if (uploadedPath)
        userStore.editUserInfoField({ key: "avatar_url", value: uploadedPath });
      await refreshUserInfo();
      uni.showToast({
        title: t("pages.my.settingPage.updateSuccess") as string,
        icon: "none",
      });
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.updateFailed") as string),
        icon: "none",
      });
    }
  } catch {
    uni.showToast({
      title: t("pages.my.settingPage.updateFailed") as string,
      icon: "none",
    });
  } finally {
    uni.hideLoading();
  }
};

const onWxGetPhoneNumber = async (e: { detail?: { code?: string } }) => {
  const code = String(e?.detail?.code || "").trim();
  if (!code) {
    uni.showToast({
      title: t("pages.my.settingPage.wxPhoneDenied") as string,
      icon: "none",
    });
    return;
  }
  if (!apiRequest) return;
  uni.showLoading({ title: t("common.loading") as string });
  try {
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/wxmp/bind_phone",
      { phone_code: code },
      "post",
    );
    if (res && (res as any).code == 200) {
      uni.showToast({
        title: t("pages.my.settingPage.bindSuccess") as string,
        icon: "none",
      });
      loadBindings();
      refreshUserInfo();
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.bindFailed") as string),
        icon: "none",
      });
    }
  } finally {
    uni.hideLoading();
  }
};
// #endif

const bindWeChat = async () => {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: "/pages/login/login" });
    return;
  }
  if (wechatBound.value) {
    uni.showToast({
      title: t("pages.my.settingPage.alreadyBound") as string,
      icon: "none",
    });
    return;
  }
  // #ifdef MP-WEIXIN
  if (!apiRequest) return;
  uni.showLoading({ title: t("common.loading") as string });
  try {
    const loginRes = await new Promise<any>((resolve, reject) => {
      uni.login({
        provider: "weixin",
        success: resolve,
        fail: reject,
      });
    });
    const code = String(loginRes?.code || "").trim();
    if (!code) throw new Error("wx code missing");
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/wxmp/bind",
      { code },
      "post",
    );
    if (res && (res as any).code == 200) {
      uni.showToast({
        title: t("pages.my.settingPage.bindSuccess") as string,
        icon: "none",
      });
      loadBindings();
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.bindFailed") as string),
        icon: "none",
      });
    }
  } catch {
    uni.showToast({
      title: t("pages.my.settingPage.bindFailed") as string,
      icon: "none",
    });
  } finally {
    uni.hideLoading();
  }
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({
    title: t("pages.my.settingPage.wechatBindOnlyWxmp") as string,
    icon: "none",
  });
  // #endif
};

type BindType = "phone" | "email";
const bindPopupVisible = ref<boolean>(false);
const bindType = ref<BindType>("phone");
const bindPhone = ref<string>("");
const bindEmail = ref<string>("");
const bindCode = ref<string>("");
const sendingCode = ref<boolean>(false);
const binding = ref<boolean>(false);
const codeCountdown = ref<number>(0);
let codeTimer: number | null = null;

const bindPopupTitle = computed(() =>
  bindType.value === "phone"
    ? ((phoneBound.value
        ? t("pages.my.settingPage.changePhone")
        : t("pages.my.settingPage.bindPhone")) as string)
    : (t("pages.my.settingPage.bindEmail") as string),
);

const codeBtnText = computed(() => {
  if (codeCountdown.value > 0) return `${codeCountdown.value}s`;
  return t("pages.my.settingPage.sendCode") as string;
});

const codeSendButtonStyle = {
  width: "220rpx",
  height: "72rpx",
};

const popupCancelButtonStyle = {
  width: "160rpx",
  height: "88rpx",
  backgroundColor: "transparent",
  border: "none",
  color: "#1f1f1f",
};

const popupConfirmButtonStyle = {
  width: "100%",
  height: "88rpx",
};

const popupDangerButtonStyle = {
  width: "100%",
  height: "88rpx",
};

const openBindPopup = (type: BindType) => {
  if (!ensureLogin()) return;
  if (type === "email" && emailBound.value) {
    uni.showToast({
      title: t("pages.my.settingPage.alreadyBound") as string,
      icon: "none",
    });
    return;
  }
  bindType.value = type;
  bindPhone.value = "";
  bindEmail.value = "";
  bindCode.value = "";
  bindPopupVisible.value = true;
};

const startCountdown = () => {
  codeCountdown.value = 60;
  if (codeTimer) clearInterval(codeTimer);
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1;
    if (codeCountdown.value <= 0 && codeTimer) {
      clearInterval(codeTimer);
      codeTimer = null;
    }
  }, 1000) as unknown as number;
};

const sendBindCode = async () => {
  if (!apiRequest || sendingCode.value || codeCountdown.value > 0) return;
  const scene = "BIND";
  try {
    sendingCode.value = true;
    if (bindType.value === "phone") {
      const pn = String(bindPhone.value || "")
        .trim()
        .replace(/\s+/g, "");
      if (!pn) {
        uni.showToast({
          title: t("pages.my.settingPage.phonePlaceholder") as string,
          icon: "none",
        });
        return;
      }
      const res = await apiRequest<unknown>(
        "/api/v1/app/auth/phone/code",
        { phone_prefix: "+86", phone_number: pn, scene },
        "post",
      );
      if (res && (res as any).code == 200) {
        startCountdown();
        uni.showToast({
          title: t("pages.my.settingPage.codeSent") as string,
          icon: "none",
        });
      } else {
        uni.showToast({
          title:
            (res as any)?.message ||
            (t("pages.my.settingPage.sendCodeFailed") as string),
          icon: "none",
        });
      }
      return;
    }

    const em = String(bindEmail.value || "").trim();
    if (!em) {
      uni.showToast({
        title: t("pages.my.settingPage.emailPlaceholder") as string,
        icon: "none",
      });
      return;
    }
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/email/code",
      { email: em, scene },
      "post",
    );
    if (res && (res as any).code == 200) {
      startCountdown();
      uni.showToast({
        title: t("pages.my.settingPage.codeSent") as string,
        icon: "none",
      });
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.sendCodeFailed") as string),
        icon: "none",
      });
    }
  } finally {
    sendingCode.value = false;
  }
};

const submitBind = async () => {
  if (!apiRequest || binding.value) return;
  const code = String(bindCode.value || "").trim();
  if (!code) {
    uni.showToast({
      title: t("pages.my.settingPage.codePlaceholder") as string,
      icon: "none",
    });
    return;
  }

  binding.value = true;
  try {
    if (bindType.value === "phone") {
      const pn = String(bindPhone.value || "")
        .trim()
        .replace(/\s+/g, "");
      if (!pn) {
        uni.showToast({
          title: t("pages.my.settingPage.phonePlaceholder") as string,
          icon: "none",
        });
        return;
      }
      const res = await apiRequest<unknown>(
        "/api/v1/app/auth/bind/phone",
        { phone_prefix: "+86", phone_number: pn, verify_code: code },
        "post",
      );
      if (res && (res as any).code == 200) {
        userStore.editUserInfoField({ key: "phone_number", value: pn });
        bindPopupVisible.value = false;
        uni.showToast({
          title: t("pages.my.settingPage.bindSuccess") as string,
          icon: "none",
        });
        loadBindings();
        refreshUserInfo();
      } else {
        uni.showToast({
          title:
            (res as any)?.message ||
            (t("pages.my.settingPage.bindFailed") as string),
          icon: "none",
        });
      }
      return;
    }

    const em = String(bindEmail.value || "").trim();
    if (!em) {
      uni.showToast({
        title: t("pages.my.settingPage.emailPlaceholder") as string,
        icon: "none",
      });
      return;
    }
    const res = await apiRequest<unknown>(
      "/api/v1/app/auth/bind/email",
      { email: em, verify_code: code },
      "post",
    );
    if (res && (res as any).code == 200) {
      userStore.editUserInfoField({ key: "email", value: em });
      bindPopupVisible.value = false;
      uni.showToast({
        title: t("pages.my.settingPage.bindSuccess") as string,
        icon: "none",
      });
      loadBindings();
      refreshUserInfo();
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.bindFailed") as string),
        icon: "none",
      });
    }
  } finally {
    binding.value = false;
  }
};

const doLogout = () => {
  uni.showModal({
    content: t("pages.accounts.logoutConfirm") as string,
    confirmText: t("pages.accounts.logoutBtn") as string,
    success: (res) => {
      if (!res.confirm) return;
      clearLocalLoginState();
      uni.navigateTo({ url: "/pages/login/login" });
      uni.showToast({
        title: t("pages.accounts.logoutSuccess") as string,
        icon: "none",
      });
    },
  });
};

const clearLocalLoginState = () => {
  uni.removeStorageSync("access_token");
  uni.removeStorageSync("tenant_id");
  uni.removeStorageSync("push_id");
  uni.removeStorageSync("accessToken");
  uni.removeStorageSync("refreshToken");
  userStore.logout();
};

const deleteAccountPopupVisible = ref<boolean>(false);
const deletePassword = ref<string>("");
const showDeletePassword = ref<boolean>(false);
const deletingAccount = ref<boolean>(false);

const closeDeleteAccountPopup = () => {
  if (deletingAccount.value) return;
  deleteAccountPopupVisible.value = false;
  deletePassword.value = "";
  showDeletePassword.value = false;
};

const confirmDeleteAccount = () => {
  if (!ensureLogin()) return;
  uni.showModal({
    title: t("pages.my.settingPage.deleteAccount") as string,
    content: t("pages.my.settingPage.deleteAccountConfirm") as string,
    confirmText: t("pages.my.settingPage.confirmDeleteAccount") as string,
    confirmColor: "#F56C6C",
    success: (res) => {
      if (!res.confirm) return;
      deletePassword.value = "";
      showDeletePassword.value = false;
      deleteAccountPopupVisible.value = true;
    },
  });
};

const submitDeleteAccount = async () => {
  if (deletingAccount.value) return;
  const pwd = String(deletePassword.value || "").trim();
  if (!pwd) {
    uni.showToast({
      title: t("pages.my.settingPage.currentPasswordPlaceholder") as string,
      icon: "none",
    });
    return;
  }

  deletingAccount.value = true;
  try {
    const res = await deleteCurrentAccount(pwd);
    if (res && (res as any).code === 200) {
      deleteAccountPopupVisible.value = false;
      deletePassword.value = "";
      showDeletePassword.value = false;
      clearLocalLoginState();
      uni.showToast({
        title: t("pages.my.settingPage.deleteAccountSuccess") as string,
        icon: "none",
        success: () => {
          uni.navigateTo({ url: "/pages/login/login" });
        },
      });
    } else {
      uni.showToast({
        title:
          (res as any)?.message ||
          (t("pages.my.settingPage.deleteAccountFailed") as string),
        icon: "none",
      });
    }
  } catch {
    uni.showToast({
      title: t("pages.my.settingPage.deleteAccountFailed") as string,
      icon: "none",
    });
  } finally {
    deletingAccount.value = false;
  }
};

const goChangePassword = () => {
  if (!ensureLogin()) return;
  uni.navigateTo({ url: "/pages/change-pwd/change-pwd" });
};

const goSetUsername = () => {
  if (!ensureLogin()) return;
  if (!canSetUsername.value) return;
  uni.navigateTo({ url: "/pages/my/setting/username" });
};

onLoad(() => {
  if (!isLoggedIn.value) {
    uni.showToast({ title: t("pages.pleaseLogin") as string, icon: "none" });
    uni.navigateTo({ url: "/pages/login/login" });
    return;
  }
  loadBindings();
});

onShow(() => {
  uni.setNavigationBarTitle({ title: t("pages.my.settingTitle") as string });
  if (isLoggedIn.value) loadBindings();
});
</script>

<style lang="scss" scoped>
.setting-page {
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

.row-head {
  padding: 20rpx 24rpx 8rpx;
}

.head-title {
  font-size: 26rpx;
  color: #909399;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26rpx 24rpx;
  background: #fff;
}

.row--danger {
  background: #fffafa;
}

.row--btn {
  width: 100%;
}

.row--hover {
  background: rgba(0, 0, 0, 0.03);
}

.row-btn {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  line-height: normal;
}

.label {
  font-size: 28rpx;
  color: #1f1f1f;
}

.label--danger {
  color: #f56c6c;
}

.right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.value {
  font-size: 26rpx;
  color: #606266;
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value--placeholder {
  color: #c0c4cc;
}

.divider {
  height: 2rpx;
  background: #f1f2f4;
  margin-left: 24rpx;
}

.logout-wrap {
  margin-top: 80rpx;
  padding-bottom: calc(env(safe-area-inset-bottom));
}

.popup {
  padding: 28rpx 28rpx 40rpx;
}

.popup-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f1f1f;
  text-align: center;
}

.popup-desc {
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 40rpx;
  color: #909399;
  text-align: center;
}

.popup-desc--danger {
  color: #f56c6c;
}

.popup-form {
  margin-top: 26rpx;
}

.field {
  margin-top: 22rpx;
}

.field-label {
  display: block;
  font-size: 24rpx;
  color: #909399;
  margin-bottom: 10rpx;
}

.field-input {
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: #f5f6f8;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  color: #1f1f1f;
}

.field-input-wrap {
  position: relative;
}

.field-input--with-icon {
  padding-right: 88rpx;
}

.field-eye {
  position: absolute;
  top: 0;
  right: 0;
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.field--code .field-input--code {
  flex: 1;
  width: auto;
  min-width: 0;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.popup-actions {
  margin-top: 30rpx;
  display: flex;
  gap: 18rpx;
  align-items: center;
}

.popup-actions__cancel {
  width: 160rpx;
}

.popup-actions__confirm {
  flex: 1;
}
</style>
