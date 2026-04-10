import { defineStore } from "pinia";

export interface UserInfo {
  id?: string | number;
  name?: string;
  username?: string | null;
  mobile?: string;
  phone_number?: string | null;
  email?: string;
  is_admin?: number;
  business_id?: string | number;
  user_kind?: string;
  org_id?: string | null;
  org_type?: string | null;
  org_name?: string | null;
  [key: string]: unknown;
}

export interface UserState {
  userInfo: UserInfo | null;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    userInfo: null,
  }),
  actions: {
    normalizeUserInfo(info: UserInfo | null) {
      if (!info) return null;
      const next = { ...info };
      const phone = String(next.phone_number || next.mobile || "").trim();
      if (phone) {
        next.phone_number = phone;
        next.mobile = phone;
      }
      return next;
    },
    setUserInfo(info: UserInfo | null) {
      this.userInfo = this.normalizeUserInfo(info);
    },
    editUserInfoField(payload: { key: string; value: unknown }) {
      if (!this.userInfo) return;
      const next = {
        ...(this.userInfo as Record<string, unknown>),
        [payload.key]: payload.value,
      } as UserInfo;
      this.userInfo = this.normalizeUserInfo(next);
    },
    login(info: UserInfo) {
      this.userInfo = this.normalizeUserInfo(info);
    },
    logout() {
      this.userInfo = null;
    },
  },
});
