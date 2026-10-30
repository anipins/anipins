const PROFILE_MEDIA_KEY = /^(?:avatars|covers)\/[a-zA-Z0-9._-]+$/;
const GOOGLE_PROFILE_HOST = /(?:^|\.)googleusercontent\.com$/i;

export function isProfileMediaKey(value) {
  return typeof value === "string" && PROFILE_MEDIA_KEY.test(value);
}

export function profileMediaCleanupKeys(values) {
  return [...new Set(values.filter(isProfileMediaKey))];
}

export function profileImageSource(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const source = value.trim();
  if (isProfileMediaKey(source)) return `/api/img/${source}`;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && GOOGLE_PROFILE_HOST.test(url.hostname) ? url.toString() : "";
  } catch {
    return "";
  }
}
