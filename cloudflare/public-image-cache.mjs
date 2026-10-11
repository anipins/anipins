/**
 * Small public-image cache at the Cloudflare edge.
 * Only responses positively identified by the application as published,
 * non-premium images are allowed into the shared cache. This cache is
 * deliberately short-lived so unpublishing artwork takes effect promptly.
 */
const EDGE_TTL_SECONDS = 60;
function isAnonymousPublicMediaRequest(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.protocol !== "https:" || !["anipins.com", "www.anipins.com"].includes(url.hostname)) return false;
  if (!/^\/api\/img\/(?:o|t)\/.+/.test(url.pathname) || url.search) return false;
  const headers = request.headers;
  return !["cookie", "authorization", "range", "if-range", "if-none-match", "if-modified-since"].some(key => headers.has(key))
    && !/no-cache|no-store/i.test(headers.get("cache-control") || "");
}

function isPublicImageResponse(response) {
  if (response.status !== 200) return false;
  const headers = response.headers;
  const control = headers.get("cache-control") || "";
  const vary = headers.get("vary") || "";
  return /^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(headers.get("content-type") || "")
    && /(?:^|,)\s*public\b/i.test(control)
    && !/(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(control)
    && !headers.has("set-cookie")
    && !headers.has("content-range")
    && !/(?:^|,)\s*(?:\*|cookie|authorization)\s*(?:,|$)/i.test(vary);
}

function withStatus(response, status) {
  const headers = new Headers(response.headers);
  headers.set("X-AniPins-Edge-Cache", status);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function servePublicImage(request, upstream, cache, waitUntil) {
  if (!cache || !isAnonymousPublicMediaRequest(request)) {
    return withStatus(await upstream(), "BYPASS");
  }
  const key = new Request(request.url, { method: "GET" });
  try {
    const stored = await cache.match(key);
    if (stored) return withStatus(stored, "HIT");
  } catch {
    // Cache failure must not break image delivery.
  }

  const response = await upstream();
  if (!isPublicImageResponse(response)) return withStatus(response, "BYPASS");

  try {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", `public, max-age=${EDGE_TTL_SECONDS}`);
    headers.delete("CDN-Cache-Control");
    headers.delete("Set-Cookie");
    const entry = new Response(response.clone().body, { status: 200, headers });
    waitUntil(Promise.resolve(cache.put(key, entry)).catch(() => {}));
  } catch {
    // Serve original response if cache cannot accept the image.
  }
  return withStatus(response, "MISS");
}
