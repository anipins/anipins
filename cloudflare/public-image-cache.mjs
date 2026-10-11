/**
 * Cache only demonstrably public immutable application assets and published
 * artwork images. The latter expire quickly to bound stale access after
 * an artwork is unpublished. Never insert user-specific media responses.
 */
const ARTWORK_TTL_SECONDS = 60;
const STATIC_TTL_SECONDS = 86400;

function cacheKind(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.protocol !== "https:" || !["anipins.com", "www.anipins.com"].includes(url.hostname) || url.search) return null;
  if (["range", "if-range", "if-none-match", "if-modified-since"].some(key => request.headers.has(key))) return null;
  if (/no-cache|no-store/i.test(request.headers.get("cache-control") || "")) return null;
  if (/^\/_next\/static\/(?:chunks|css|media)\/.+/.test(url.pathname)) return "static";
  if (/^\/api\/img\/(?:o|t)\/.+/.test(url.pathname)) return "artwork";
  return null;
}

function canStore(response, kind) {
  if (response.status !== 200) return false;
  const headers = response.headers;
  const control = headers.get("cache-control") || "";
  const vary = headers.get("vary") || "";
  const type = headers.get("content-type") || "";
  const validType = kind === "static"
    ? /^(?:application\/(?:javascript|x-javascript)|text\/(?:javascript|css)|font\/(?:woff|woff2)|application\/(?:font-woff|font-woff2)|image\/(?:svg\+xml|jpeg|png|webp|gif|avif))(?:;|$)/i.test(type)
    : /^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(type);
  return validType
    && /(?:^|,)\s*public\b/i.test(control)
    && !/(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(control)
    && (kind !== "static" || /\bimmutable\b/i.test(control))
    && !headers.has("set-cookie")
    && !headers.has("content-range")
    && !/(?:^|,)\s*(?:\*|cookie|authorization)\s*(?:,|$)/i.test(vary);
}

function withCacheStatus(response, value, browserCacheControl) {
  const headers = new Headers(response.headers);
  headers.set("X-AniPins-Edge-Cache", value);
  // The application correctly marks published artwork as immutable because its
  // object key is content-addressed. The Worker, however, is also the access
  // boundary for a later unpublish or move to Premium. Do not let a browser
  // hold a formerly-public image for a year while the edge entry expires after
  // one minute. Static build assets remain immutable; this applies only to
  // public artwork media.
  if (browserCacheControl) {
    headers.set("Cache-Control", browserCacheControl);
    // A dashboard cache rule may otherwise apply its longer default edge TTL
    // after the Worker response leaves this Cache API layer.
    headers.set("CDN-Cache-Control", browserCacheControl);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function servePublicImage(request, upstream, cache, waitUntil) {
  const kind = cacheKind(request);
  if (!cache || !kind) return withCacheStatus(await upstream(), "BYPASS");

  // Shared cached artwork is written exclusively by anonymous public reads.
  // Signed-in users can still read that already-verified public cache entry,
  // giving the Android WebView the same speed benefit without leaking premium.
  const authenticated = request.headers.has("cookie") || request.headers.has("authorization");
  const key = new Request(request.url, { method: "GET" });
  try {
    const cached = await cache.match(key);
    if (cached) return withCacheStatus(cached, "HIT");
  } catch {}

  const response = await upstream();
  const publicResponse = canStore(response, kind);
  // Even a signed-in visitor can view an already-public image, but a public
  // artwork response must never get a longer browser lifetime than the edge
  // authorization boundary. Private/Premium responses retain their upstream
  // `private, no-store` policy untouched.
  const browserCacheControl = kind === "artwork" && publicResponse
    ? `public, max-age=${ARTWORK_TTL_SECONDS}`
    : undefined;
  if ((kind === "artwork" && authenticated) || !publicResponse) {
    return withCacheStatus(response, "BYPASS", browserCacheControl);
  }

  try {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", `public, max-age=${kind === "static" ? STATIC_TTL_SECONDS : ARTWORK_TTL_SECONDS}`);
    headers.delete("CDN-Cache-Control");
    headers.delete("Set-Cookie");
    const entry = new Response(response.clone().body, { status: 200, headers });
    waitUntil(Promise.resolve(cache.put(key, entry)).catch(() => {}));
  } catch {}
  return withCacheStatus(response, "MISS", browserCacheControl);
}
