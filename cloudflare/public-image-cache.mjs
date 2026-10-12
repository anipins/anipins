/**
 * Cache only demonstrably public immutable application assets and published
 * artwork images. The latter expire quickly to bound stale access after
 * an artwork is unpublished. Never insert user-specific media responses.
 */
const ARTWORK_TTL_SECONDS = 60;
const STATIC_TTL_SECONDS = 86400;
const PUBLIC_FEED_TTL_SECONDS = 10;
const PUBLIC_DOCUMENT_TTL_SECONDS = 10;
const ARTWORK_CACHE_UNTIL_HEADER = "x-anipins-artwork-cache-until";

function cacheKind(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.protocol !== "https:" || !["anipins.com", "www.anipins.com"].includes(url.hostname)) return null;
  const signedPublicMedia = /^\/api\/img\/(?:t|o)\/[a-zA-Z0-9._-]+$/.test(url.pathname)
    && url.searchParams.size === 2 && url.searchParams.has("e") && url.searchParams.has("s");
  const publicFeed = url.pathname === "/api/artworks" && !["1", "true"].includes(url.searchParams.get("premium") || "") && !["following", "for-you"].includes(url.searchParams.get("sort") || "latest");
  // Cache only the anonymous document shell. Next's RSC requests, route
  // prefetches and every signed-in visit remain outside this cache so account
  // UI and personalised data can never be shared.
  const publicDocument = url.pathname === "/" && !url.search && !request.headers.has("rsc") && !request.headers.has("next-router-state-tree") && !request.headers.has("next-router-prefetch");
  if (url.search && !signedPublicMedia && !publicFeed) return null;
  if (["range", "if-range", "if-none-match", "if-modified-since"].some(key => request.headers.has(key))) return null;
  if (/no-cache|no-store/i.test(request.headers.get("cache-control") || "")) return null;
  if (/^\/_next\/static\/(?:chunks|css|media)\/.+/.test(url.pathname)) return "static";
  // The normal browse API is account-independent. Cache only its public
  // variants at the edge; member, Following and For You calls never qualify.
  if (publicFeed) return "feed";
  if (publicDocument) return "document";
  if (/^\/api\/img\/(?:o|t)\/.+/.test(url.pathname)) return "artwork";
  return null;
}

function base64UrlBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export async function signedPublicMediaKey(request, secret) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/img\/((?:t|o)\/[a-zA-Z0-9._-]+)$/);
  const expiresAt = Number(url.searchParams.get("e"));
  const signature = url.searchParams.get("s") || "";
  if (!match || !secret || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || expiresAt > Math.floor(Date.now() / 1000) + 120 || !signature) return null;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const scope = match[1].startsWith("t/") ? "thumbnail" : "original";
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlBytes(signature), new TextEncoder().encode(`${scope}:${match[1]}:${expiresAt}`));
    return valid ? match[1] : null;
  } catch { return null; }
}

function canStore(response, kind) {
  if (response.status !== 200) return false;
  const headers = response.headers;
  const control = headers.get("cache-control") || "";
  const vary = headers.get("vary") || "";
  const type = headers.get("content-type") || "";
  const validType = kind === "static"
    ? /^(?:application\/(?:javascript|x-javascript)|text\/(?:javascript|css)|font\/(?:woff|woff2)|application\/(?:font-woff|font-woff2)|image\/(?:svg\+xml|jpeg|png|webp|gif|avif))(?:;|$)/i.test(type)
    : kind === "feed"
      ? /^application\/json(?:;|$)/i.test(type)
      : kind === "document"
        ? /^text\/html(?:;|$)/i.test(type)
    : /^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(type);
  return validType
    && (kind === "document" || /(?:^|,)\s*public\b/i.test(control))
    && !/(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(control)
    && (kind !== "static" || /\bimmutable\b/i.test(control))
    && !headers.has("set-cookie")
    && !headers.has("content-range")
    && !/(?:^|,)\s*(?:\*|cookie|authorization)\s*(?:,|$)/i.test(vary);
}

function withCacheStatus(response, value, browserCacheControl) {
  const headers = new Headers(response.headers);
  headers.set("X-AniPins-Edge-Cache", value);
  headers.delete(ARTWORK_CACHE_UNTIL_HEADER);
  // The application correctly marks published artwork as immutable because its
  // object key is content-addressed. The Worker, however, is also the access
  // boundary for a later unpublish or move to Premium. Do not let a browser
  // hold a formerly-public image for a year while the edge entry expires after
  // one minute. Static build assets remain immutable; this applies only to
  // public artwork media.
  if (browserCacheControl) {
    headers.set("Cache-Control", browserCacheControl);
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
  if (kind === "document" && authenticated) return withCacheStatus(await upstream(), "BYPASS");
  const key = new Request(request.url, { method: "GET" });
  try {
    const cached = await cache.match(key);
    if (cached) {
      // Cache API stores artwork entries independently of the HTTP cache TTL.
      // Keep an explicit expiry marker so a public image never remains usable
      // after an administrator changes its visibility.
      const until = Number(cached.headers.get(ARTWORK_CACHE_UNTIL_HEADER));
      if (kind !== "artwork" || (Number.isFinite(until) && until > Date.now())) {
        return withCacheStatus(cached, "HIT", kind === "artwork" ? "private, no-store" : undefined);
      }
      await cache.delete(key);
    }
  } catch {}

  const response = await upstream();
  const publicResponse = canStore(response, kind);
  // Even a signed-in visitor can view an already-public image, but a public
  // artwork response must never get a longer browser lifetime than the edge
  // authorization boundary. Private/Premium responses retain their upstream
  // `private, no-store` policy untouched.
  const browserCacheControl = kind === "artwork" && publicResponse
    // Keep the cache private to the Worker. Cloudflare's Cache API is fast,
    // whereas a second shared CDN/browser cache would hide a later change to
    // Premium or unpublished state.
    ? "private, no-store"
    : undefined;
  // Public feed queries never use the session, so a signed-in visitor can
  // safely warm the same short-lived entry as a guest. This avoids every
  // scroll page waiting on the container/database when the app is logged in.
  if ((kind === "artwork" && authenticated) || !publicResponse) {
    return withCacheStatus(response, "BYPASS", browserCacheControl);
  }

  try {
    const headers = new Headers(response.headers);
    const ttl = kind === "static" ? STATIC_TTL_SECONDS : kind === "feed" ? PUBLIC_FEED_TTL_SECONDS : kind === "document" ? PUBLIC_DOCUMENT_TTL_SECONDS : ARTWORK_TTL_SECONDS;
    headers.set("Cache-Control", `public, max-age=${ttl}`);
    if (kind === "artwork") headers.set(ARTWORK_CACHE_UNTIL_HEADER, String(Date.now() + ARTWORK_TTL_SECONDS * 1000));
    headers.delete("CDN-Cache-Control");
    headers.delete("Set-Cookie");
    const entry = new Response(response.clone().body, { status: 200, headers });
    const write = cache.put(key, entry);
    // Feed pagination commonly asks for the next page immediately after this
    // response. Await its tiny JSON cache write so that next request can
    // reliably hit the edge rather than racing a deferred waitUntil task.
    // Larger static/image bodies stay asynchronous to preserve first-paint.
    if (kind === "feed") await write;
    else waitUntil(Promise.resolve(write).catch(() => {}));
  } catch {}
  return withCacheStatus(response, "MISS", browserCacheControl);
}
