const CANONICAL_HOSTS = new Set(["anipins.com", "www.anipins.com"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Keep public SEO links on AniPins' canonical host, even if a staging URL
 * accidentally leaks into the production Worker environment. Local dev may
 * still use its own origin for convenient metadata previews.
 */
export function normalizeSiteUrl(configured, fallback = "https://anipins.com") {
  if (typeof configured !== "string" || !configured.trim()) return fallback;

  try {
    const url = new URL(configured.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    if (CANONICAL_HOSTS.has(url.hostname.toLowerCase())) return fallback;
    if (LOCAL_HOSTS.has(url.hostname.toLowerCase())) return url.origin;
  } catch {
    // Invalid or unsupported deployment values must never become public URLs.
  }

  return fallback;
}
