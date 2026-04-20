const DEFAULT_AVATAR = "/static/image/my/avatar-default@2x.png";

const ABSOLUTE_URL_RE = /^(https?:)?\/\//i;
const DATA_URL_RE = /^data:/i;

const normalizeBaseUrl = (input?: string | null): string => {
  const raw = String(input || "").trim();
  if (!raw) return "";
  return raw.replace(/\/?api\/v1\/?$/, "").replace(/\/$/, "");
};

export const getDefaultAvatar = (): string => DEFAULT_AVATAR;

export const resolveAvatarUrl = (
  rawValue: string | null | undefined,
  explicitBaseUrl?: string | null,
): string => {
  const raw = String(rawValue || "").trim();
  if (!raw) return DEFAULT_AVATAR;
  if (ABSOLUTE_URL_RE.test(raw) || DATA_URL_RE.test(raw)) return raw;

  const baseUrl =
    normalizeBaseUrl(explicitBaseUrl) ||
    normalizeBaseUrl(String(uni.getStorageSync("serverAddress") || ""));
  if (!baseUrl) return raw;

  return `${baseUrl}/${raw.replace(/^\.?\//, "")}`;
};
