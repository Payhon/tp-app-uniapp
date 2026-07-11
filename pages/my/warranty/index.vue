<template>
  <view class="warranty-page">
    <view v-if="profile?.warranty_profile_reminder_needed" class="reminder-banner">
      <u-icon name="info-circle" size="16" color="#9A6700"></u-icon>
      <text class="reminder-banner__text">{{ t("pages.warranty.profileReminderHint") }}</text>
    </view>
    <view class="card profile-card">
      <view class="card-header">
        <text class="card-title">{{ t("pages.warranty.profileTitle") }}</text>
        <button
          v-if="!editingProfile && hasSavedProfile"
          class="edit-btn"
          hover-class="edit-btn--active"
          :aria-label="t('pages.warranty.editProfile')"
          @tap="startProfileEdit"
        >
          <view class="edit-pencil">
            <view class="edit-pencil-body"></view>
            <view class="edit-pencil-tip"></view>
          </view>
        </button>
        <button
          v-else-if="!editingProfile"
          class="fill-profile-btn"
          hover-class="fill-profile-btn--active"
          @tap="startProfileEdit"
        >
          {{ t("pages.warranty.fillProfile") }}
        </button>
      </view>
      <view v-if="!editingProfile && !hasSavedProfile" class="profile-empty-state">
        <text class="profile-empty-state__title">{{ t("pages.warranty.profileNotFilled") }}</text>
        <text class="profile-empty-state__hint">{{ t("pages.warranty.profileNotFilledHint") }}</text>
      </view>
      <template v-else>
        <view class="field">
          <text class="field-label">{{ t("pages.warranty.contactName") }}</text>
          <input
            v-if="editingProfile"
            v-model="contactName"
            class="field-input"
            :placeholder="t('pages.warranty.contactNamePlaceholder')"
            maxlength="100"
          />
          <text v-else class="field-value">{{ displayProfileText(contactName) }}</text>
        </view>
        <view class="field">
          <text class="field-label">{{ t("pages.warranty.contactPhone") }}</text>
          <input
            v-if="editingProfile"
            v-model="contactPhone"
            class="field-input"
            :placeholder="t('pages.warranty.contactPhonePlaceholder')"
            maxlength="50"
            type="text"
          />
          <text v-else class="field-value">{{ displayProfileText(contactPhone) }}</text>
        </view>
      </template>
      <button v-if="editingProfile" class="save-btn" :loading="saving" :disabled="saving" @tap="saveProfile">
        {{ t("common.save") }}
      </button>
    </view>

    <view v-if="profile?.warranty_cards_enabled" class="cards">
      <text class="card-title">{{ t("pages.warranty.batteryTitle") }}</text>
      <view v-if="profile.batteries.length" class="battery-list">
        <view v-for="item in profile.batteries" :key="item.device_id" class="battery-card">
          <view class="battery-shine"></view>
          <view class="battery-watermark"></view>
          <view class="battery-head">
            <text class="battery-badge">{{ t("pages.warranty.cardBadge") }}</text>
            <text class="battery-model">{{ displayText(item.battery_model_name) }}</text>
          </view>
          <text class="battery-serial">{{ displayText(item.battery_serial || item.device_number) }}</text>
          <text class="battery-months">
            {{ t("pages.warranty.warrantyMonths") }}：{{ displayText(item.warranty_months) }}
          </text>
          <view class="battery-divider"></view>
          <view class="battery-grid">
            <view class="battery-field">
              <text class="battery-label">{{ t("pages.warranty.activationDate") }}</text>
              <text class="battery-value">{{ displayText(item.activation_date) }}</text>
            </view>
            <view class="battery-field">
              <text class="battery-label">{{ t("pages.warranty.warrantyExpireDate") }}</text>
              <text class="battery-value">{{ displayText(item.warranty_expire_date) }}</text>
            </view>
          </view>
          <view class="battery-card-edge"></view>
        </view>
      </view>
      <view v-else class="empty">
        <text>{{ t("pages.warranty.emptyBatteries") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onPullDownRefresh } from "@dcloudio/uni-app";
import { useI18n } from "vue-i18n";
import {
  fetchAppWarrantyProfile,
  saveAppWarrantyProfile,
  type AppWarrantyProfile,
} from "@/service/user-warranty";
import { useWarrantyReminderStore } from "@/store/warranty-reminder";

const { t } = useI18n();
const warrantyReminderStore = useWarrantyReminderStore();

const profile = ref<AppWarrantyProfile | null>(null);
const contactName = ref("");
const contactPhone = ref("");
const loading = ref(false);
const saving = ref(false);
const editingProfile = ref(false);
const editOnLoad = ref(false);
const hasSavedProfile = computed(() => Boolean(profile.value?.warranty_profile_exists));

function displayText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "--";
}

function displayProfileText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "--";
}

function startProfileEdit() {
  editingProfile.value = true;
}

async function loadProfile() {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await fetchAppWarrantyProfile();
    if (res && (res as any).code === 200 && (res as any).data) {
      profile.value = (res as any).data as AppWarrantyProfile;
      contactName.value = String(profile.value.contact_name || "");
      contactPhone.value = String(profile.value.contact_phone || "");
      warrantyReminderStore.applyProfile(profile.value);
      editingProfile.value = editOnLoad.value && !profile.value.warranty_profile_completed;
      editOnLoad.value = false;
    }
  } catch (e) {
    uni.showToast({
      title: t("pages.warranty.loadFailed") as string,
      icon: "none",
    });
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

async function saveProfile() {
  if (saving.value) return;
  saving.value = true;
  try {
    const res = await saveAppWarrantyProfile({
      contact_name: contactName.value.trim(),
      contact_phone: contactPhone.value.trim(),
    });
    if (res && (res as any).code === 200 && (res as any).data) {
      profile.value = (res as any).data as AppWarrantyProfile;
      contactName.value = String(profile.value.contact_name || "");
      contactPhone.value = String(profile.value.contact_phone || "");
      warrantyReminderStore.applyProfile(profile.value);
      editingProfile.value = false;
      uni.showToast({
        title: t("pages.warranty.saveSuccess") as string,
        icon: "success",
      });
    }
  } catch (e) {
    uni.showToast({
      title: t("pages.warranty.saveFailed") as string,
      icon: "none",
    });
  } finally {
    saving.value = false;
  }
}

onLoad((options) => {
  editOnLoad.value = String((options as Record<string, unknown>)?.edit || "") === "1";
  loadProfile();
});

onPullDownRefresh(() => {
  loadProfile();
});
</script>

<style lang="scss" scoped>
.warranty-page {
  min-height: 100vh;
  padding: 24rpx 24rpx 36rpx;
  background: linear-gradient(180deg, #f7f8fa 0%, #eef1f5 100%);
  box-sizing: border-box;
}

.card,
.cards {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx;
  box-sizing: border-box;
}

.profile-card {
  box-shadow: 0 16rpx 38rpx rgba(15, 23, 42, 0.04);
}

.reminder-banner {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid #f0d7a1;
  border-radius: 12rpx;
  background: #fff8e8;
  box-sizing: border-box;
}

.reminder-banner__text {
  flex: 1;
  min-width: 0;
  color: #6b4f00;
  font-size: 26rpx;
  line-height: 1.5;
}

.cards {
  margin-top: 24rpx;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  padding: 0;
  margin: 0;
  border-radius: 29rpx;
  background: #f7f8fb;
  box-shadow: inset 0 0 0 1rpx rgba(148, 163, 184, 0.18);
}

.edit-btn::after {
  border: none;
}

.edit-btn--active {
  background: #eef2ff;
}

.fill-profile-btn {
  height: 58rpx;
  padding: 0 18rpx;
  margin: 0;
  border-radius: 29rpx;
  background: #0b3bff;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 58rpx;
}

.fill-profile-btn::after {
  border: none;
}

.fill-profile-btn--active {
  background: #082fc7;
}

.edit-pencil {
  position: relative;
  width: 30rpx;
  height: 30rpx;
  transform: rotate(-38deg);
}

.edit-pencil-body {
  position: absolute;
  left: 7rpx;
  top: 6rpx;
  width: 15rpx;
  height: 24rpx;
  border-radius: 5rpx 5rpx 2rpx 2rpx;
  background: linear-gradient(180deg, #182235 0%, #475569 100%);
}

.edit-pencil-tip {
  position: absolute;
  left: 8rpx;
  top: 0;
  width: 13rpx;
  height: 9rpx;
  border-radius: 2rpx 2rpx 5rpx 5rpx;
  background: #c99a2e;
}

.field {
  display: flex;
  align-items: center;
  min-height: 92rpx;
  border-bottom: 1rpx solid #eef0f4;
}

.profile-empty-state {
  padding: 18rpx 0 8rpx;
}

.profile-empty-state__title {
  display: block;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.45;
}

.profile-empty-state__hint {
  display: block;
  margin-top: 10rpx;
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.5;
}

.field-label {
  width: 190rpx;
  font-size: 28rpx;
  color: #4b5563;
}

.field-input {
  flex: 1;
  min-width: 0;
  height: 80rpx;
  font-size: 28rpx;
  color: #111827;
  text-align: right;
}

.field-value {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #111827;
  line-height: 80rpx;
  text-align: right;
  word-break: break-all;
}

.save-btn {
  margin-top: 28rpx;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  background: #0b3bff;
  color: #ffffff;
  font-size: 30rpx;
}

.save-btn::after {
  border: none;
}

.battery-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.battery-card {
  position: relative;
  overflow: hidden;
  padding: 28rpx;
  border: 1rpx solid rgba(202, 138, 4, 0.22);
  border-radius: 28rpx;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 248, 240, 0.98) 58%, rgba(239, 235, 224, 0.98) 100%);
  box-shadow:
    0 20rpx 42rpx rgba(31, 41, 55, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.95);
}

.battery-shine {
  position: absolute;
  top: -80rpx;
  right: -70rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.58);
}

.battery-watermark {
  position: absolute;
  right: 24rpx;
  bottom: 18rpx;
  width: 164rpx;
  height: 164rpx;
  border: 2rpx solid rgba(202, 138, 4, 0.1);
  border-radius: 50%;
  box-shadow: inset 0 0 0 16rpx rgba(202, 138, 4, 0.04);
}

.battery-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.battery-badge {
  display: inline-block;
  flex-shrink: 0;
  height: 36rpx;
  padding: 0 16rpx;
  border-radius: 18rpx;
  background: rgba(28, 25, 23, 0.92);
  color: #f7d889;
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 36rpx;
}

.battery-serial {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 24rpx;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 700;
  color: #11131a;
  line-height: 1.18;
  word-break: break-all;
}

.battery-months {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #8a93a3;
  line-height: 1.3;
}

.battery-model {
  flex: 1;
  min-width: 0;
  font-size: 20rpx;
  color: #8a93a3;
  line-height: 1.25;
  text-align: right;
  word-break: break-all;
}

.battery-divider {
  position: relative;
  z-index: 1;
  height: 1rpx;
  margin: 22rpx 0;
  background: linear-gradient(90deg, transparent 0%, rgba(148, 117, 31, 0.28) 18%, rgba(148, 117, 31, 0.18) 82%, transparent 100%);
}

.battery-grid {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.battery-field {
  width: calc((100% - 18rpx) / 2);
  min-width: 0;
  padding: 18rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.72);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.68);
  box-sizing: border-box;
}

.battery-label {
  display: block;
  font-size: 24rpx;
  color: #8a93a3;
  line-height: 1.3;
}

.battery-value {
  display: block;
  margin-top: 10rpx;
  font-size: 29rpx;
  font-weight: 600;
  color: #171923;
  line-height: 1.3;
  word-break: break-all;
}

.battery-card-edge {
  position: absolute;
  left: 0;
  top: 42rpx;
  width: 7rpx;
  height: 108rpx;
  border-radius: 0 8rpx 8rpx 0;
  background: linear-gradient(180deg, #1c1917 0%, #ca8a04 100%);
}

.empty {
  padding: 48rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #9ca3af;
}
</style>
