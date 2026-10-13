var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// cloudflare/worker.mjs
import { DurableObject } from "cloudflare:workers";

// cloudflare/forwarding.mjs
var PUBLIC_HOSTS = /* @__PURE__ */ new Set(["anipins.com", "www.anipins.com"]);
function isAllowedPublicHost(request) {
  return PUBLIC_HOSTS.has(new URL(request.url).hostname);
}
__name(isAllowedPublicHost, "isAllowedPublicHost");
function forwardToContainer(request) {
  const publicUrl = new URL(request.url);
  if (!PUBLIC_HOSTS.has(publicUrl.hostname)) throw new Error("Untrusted public host");
  const url = new URL(request.url);
  url.protocol = "http:";
  url.host = "container";
  const forwarded = new Request(url, request);
  forwarded.headers.delete("host");
  forwarded.headers.set("x-forwarded-host", publicUrl.host);
  forwarded.headers.set("x-forwarded-proto", publicUrl.protocol.slice(0, -1));
  return forwarded;
}
__name(forwardToContainer, "forwardToContainer");

// cloudflare/public-image-cache.mjs
var ARTWORK_TTL_SECONDS = 60;
var STATIC_TTL_SECONDS = 86400;
var PUBLIC_FEED_TTL_SECONDS = 10;
var PUBLIC_DOCUMENT_TTL_SECONDS = 10;
var ARTWORK_CACHE_UNTIL_HEADER = "x-anipins-artwork-cache-until";
function cacheKind(request) {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  if (url.protocol !== "https:" || !["anipins.com", "www.anipins.com"].includes(url.hostname)) return null;
  const signedPublicMedia = /^\/api\/img\/(?:t|o)\/[a-zA-Z0-9._-]+$/.test(url.pathname) && url.searchParams.size === 2 && url.searchParams.has("e") && url.searchParams.has("s");
  const publicFeed = url.pathname === "/api/artworks" && !["1", "true"].includes(url.searchParams.get("premium") || "") && !["following", "for-you"].includes(url.searchParams.get("sort") || "latest");
  const publicDocument = url.pathname === "/" && !url.search && !request.headers.has("rsc") && !request.headers.has("next-router-state-tree") && !request.headers.has("next-router-prefetch");
  if (url.search && !signedPublicMedia && !publicFeed) return null;
  if (["range", "if-range", "if-none-match", "if-modified-since"].some((key) => request.headers.has(key))) return null;
  if (/no-cache|no-store/i.test(request.headers.get("cache-control") || "")) return null;
  if (/^\/_next\/static\/(?:chunks|css|media)\/.+/.test(url.pathname)) return "static";
  if (publicFeed) return "feed";
  if (publicDocument) return "document";
  if (/^\/api\/img\/(?:o|t)\/.+/.test(url.pathname)) return "artwork";
  return null;
}
__name(cacheKind, "cacheKind");
function base64UrlBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
__name(base64UrlBytes, "base64UrlBytes");
async function signedPublicMediaKey(request, secret) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/img\/((?:t|o)\/[a-zA-Z0-9._-]+)$/);
  const expiresAt = Number(url.searchParams.get("e"));
  const signature = url.searchParams.get("s") || "";
  if (!match || !secret || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1e3) || expiresAt > Math.floor(Date.now() / 1e3) + 120 || !signature) return null;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const scope = match[1].startsWith("t/") ? "thumbnail" : "original";
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlBytes(signature), new TextEncoder().encode(`${scope}:${match[1]}:${expiresAt}`));
    return valid ? match[1] : null;
  } catch {
    return null;
  }
}
__name(signedPublicMediaKey, "signedPublicMediaKey");
function canStore(response, kind) {
  if (response.status !== 200) return false;
  const headers = response.headers;
  const control = headers.get("cache-control") || "";
  const vary = headers.get("vary") || "";
  const type = headers.get("content-type") || "";
  const validType = kind === "static" ? /^(?:application\/(?:javascript|x-javascript)|text\/(?:javascript|css)|font\/(?:woff|woff2)|application\/(?:font-woff|font-woff2)|image\/(?:svg\+xml|jpeg|png|webp|gif|avif))(?:;|$)/i.test(type) : kind === "feed" ? /^application\/json(?:;|$)/i.test(type) : kind === "document" ? /^text\/html(?:;|$)/i.test(type) : /^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(type);
  return validType && (kind === "document" || /(?:^|,)\s*public\b/i.test(control)) && (kind === "document" || !/(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(control)) && (kind !== "static" || /\bimmutable\b/i.test(control)) && !headers.has("set-cookie") && !headers.has("content-range") && !/(?:^|,)\s*(?:\*|cookie|authorization)\s*(?:,|$)/i.test(vary);
}
__name(canStore, "canStore");
function withCacheStatus(response, value, browserCacheControl) {
  const headers = new Headers(response.headers);
  headers.set("X-AniPins-Edge-Cache", value);
  headers.delete(ARTWORK_CACHE_UNTIL_HEADER);
  if (browserCacheControl) {
    headers.set("Cache-Control", browserCacheControl);
    headers.set("CDN-Cache-Control", browserCacheControl);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
__name(withCacheStatus, "withCacheStatus");
async function servePublicImage(request, upstream, cache, waitUntil) {
  const kind = cacheKind(request);
  if (!cache || !kind) return withCacheStatus(await upstream(), "BYPASS");
  const authenticated = request.headers.has("cookie") || request.headers.has("authorization");
  if (kind === "document" && authenticated) return withCacheStatus(await upstream(), "BYPASS");
  const cacheUrl = new URL(request.url);
  if (kind === "artwork") cacheUrl.search = "";
  const key = new Request(cacheUrl.toString(), { method: "GET" });
  try {
    const cached = await cache.match(key);
    if (cached) {
      const until = Number(cached.headers.get(ARTWORK_CACHE_UNTIL_HEADER));
      if (kind !== "artwork" || Number.isFinite(until) && until > Date.now()) {
        return withCacheStatus(cached, "HIT", kind === "artwork" ? "private, max-age=60, stale-while-revalidate=60" : void 0);
      }
      await cache.delete(key);
    }
  } catch {
  }
  const response = await upstream();
  const publicResponse = canStore(response, kind);
  const browserCacheControl = kind === "artwork" && publicResponse ? "private, max-age=60, stale-while-revalidate=60" : void 0;
  if (kind === "artwork" && authenticated || !publicResponse) {
    return withCacheStatus(response, "BYPASS", browserCacheControl);
  }
  try {
    const headers = new Headers(response.headers);
    const ttl = kind === "static" ? STATIC_TTL_SECONDS : kind === "feed" ? PUBLIC_FEED_TTL_SECONDS : kind === "document" ? PUBLIC_DOCUMENT_TTL_SECONDS : ARTWORK_TTL_SECONDS;
    headers.set("Cache-Control", `public, max-age=${ttl}`);
    if (kind === "artwork") headers.set(ARTWORK_CACHE_UNTIL_HEADER, String(Date.now() + ARTWORK_TTL_SECONDS * 1e3));
    headers.delete("CDN-Cache-Control");
    headers.delete("Set-Cookie");
    const entry = new Response(response.clone().body, { status: 200, headers });
    const write = cache.put(key, entry);
    if (kind === "feed") await write;
    else waitUntil(Promise.resolve(write).catch(() => {
    }));
  } catch {
  }
  return withCacheStatus(response, "MISS", browserCacheControl);
}
__name(servePublicImage, "servePublicImage");

// cloudflare/worker.mjs
var PORT = 8080;
var INACTIVITY_TIMEOUT_MS = 5 * 60 * 1e3;
var HEALTH_ATTEMPTS = 100;
var HEALTH_INTERVAL_MS = 200;
var CONTAINER_BOOT_VERSION = "2026-10-13-native-r2-thumbs-pinterest-layout";
var MAX_ARTWORK_UPLOAD_BYTES = 40 * 1024 * 1024;
var UPLOAD_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/png", "image/webp"]);
var CONTAINER_ENV_KEYS = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD",
  "ADMIN_2FA_ENCRYPTION_KEY",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "EMAIL_FROM",
  "RESEND_API_KEY",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_PREMIUM_PLAN_ID_199",
  "GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "GOOGLE_SITE_VERIFICATION",
  "SETUP_SECRET",
  "SETUP_TOKEN",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "MEDIA_PROVIDER",
  "R2_PREMIUM_BUCKET",
  "R2_PUBLIC_BUCKET",
  "R2_ENDPOINT",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "ANDROID_APP_LINKS_SHA256"
];
function runtimeEnvironment(env) {
  return Object.fromEntries(
    CONTAINER_ENV_KEYS.flatMap((key) => {
      const value = env[key];
      return typeof value === "string" && value.length > 0 ? [[key, value]] : [];
    })
  );
}
__name(runtimeEnvironment, "runtimeEnvironment");
function base64UrlBytes2(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
__name(base64UrlBytes2, "base64UrlBytes");
async function signedArtworkUpload(request, secret) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/storage-upload") return null;
  if (request.method !== "PUT") return { error: "method" };
  const key = url.searchParams.get("key") || "";
  const premium = url.searchParams.get("p") === "1";
  const expiresAt = Number(url.searchParams.get("e"));
  const signature = url.searchParams.get("s") || "";
  const contentType = (request.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  const lengthHeader = request.headers.get("content-length");
  const length = lengthHeader ? Number(lengthHeader) : null;
  const invalidLength = length !== null && (!Number.isFinite(length) || length < 1 || length > MAX_ARTWORK_UPLOAD_BYTES);
  if (!/^(?:o\/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)|t\/[a-f0-9]{32}\.webp)$/.test(key) || !secret || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1e3) || expiresAt > Math.floor(Date.now() / 1e3) + 300 || !signature || !UPLOAD_TYPES.has(contentType) || invalidLength || !request.body) return { error: "invalid" };
  try {
    const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, base64UrlBytes2(signature), new TextEncoder().encode(`upload:${key}:${premium ? "1" : "0"}:${expiresAt}`));
    return valid ? { key, premium, contentType } : { error: "invalid" };
  } catch {
    return { error: "invalid" };
  }
}
__name(signedArtworkUpload, "signedArtworkUpload");
async function signedArtworkRead(request, secret) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/storage-read") return null;
  if (request.method !== "GET") return { error: "method" };
  const key = url.searchParams.get("key") || "";
  const premium = url.searchParams.get("p") === "1";
  const expiresAt = Number(url.searchParams.get("e"));
  const signature = url.searchParams.get("s") || "";
  if (!/^o\/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)$/.test(key) || !secret || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1e3) || expiresAt > Math.floor(Date.now() / 1e3) + 300 || !signature) return { error: "invalid" };
  try {
    const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, base64UrlBytes2(signature), new TextEncoder().encode(`read:${key}:${premium ? "1" : "0"}:${expiresAt}`));
    return valid ? { key, premium } : { error: "invalid" };
  } catch {
    return { error: "invalid" };
  }
}
__name(signedArtworkRead, "signedArtworkRead");
var AniPinsContainer = class extends DurableObject {
  static {
    __name(this, "AniPinsContainer");
  }
  starting;
  constructor(ctx, env) {
    super(ctx, env);
    const container = ctx.container;
    if (container.running) {
      void ctx.blockConcurrencyWhile(() => container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS));
    }
  }
  async fetch(request) {
    await this.restartForConfigurationRollout();
    this.starting ??= this.startAndWaitForPort().finally(() => {
      this.starting = void 0;
    });
    await this.starting;
    const forwarded = forwardToContainer(request);
    return this.ctx.container.getTcpPort(PORT).fetch(forwarded);
  }
  async restartForConfigurationRollout() {
    const storedVersion = await this.ctx.storage.get("containerBootVersion");
    if (storedVersion === CONTAINER_BOOT_VERSION) return;
    if (this.ctx.container.running) {
      await this.ctx.container.destroy("Configuration rollout");
    }
    await this.ctx.storage.put("containerBootVersion", CONTAINER_BOOT_VERSION);
  }
  async startAndWaitForPort() {
    const container = this.ctx.container;
    if (!container.running) {
      container.start({
        image: container.images.base,
        instance: "lite",
        // AniPins talks to Supabase, R2, Razorpay, Google and Resend.
        enableInternet: true,
        env: runtimeEnvironment(this.env)
      });
    }
    await container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);
    const port = container.getTcpPort(PORT);
    let lastError;
    for (let attempt = 0; attempt < HEALTH_ATTEMPTS; attempt += 1) {
      try {
        const response = await port.fetch("http://container/health", {
          signal: AbortSignal.timeout(1e3)
        });
        await response.body?.cancel();
        if (!response.ok) throw new Error(`Health check returned ${response.status}`);
        return;
      } catch (error) {
        lastError = error;
        await scheduler.wait(HEALTH_INTERVAL_MS);
      }
    }
    throw new Error("AniPins did not become ready on port 8080", { cause: lastError });
  }
};
var worker_default = {
  async fetch(request, env, ctx) {
    if (!isAllowedPublicHost(request)) return new Response("Misdirected request", { status: 421 });
    const upload = await signedArtworkUpload(request, env.NEXTAUTH_SECRET);
    if (upload) {
      if (upload.error) return new Response(upload.error === "method" ? "Method not allowed" : "Invalid or expired upload capability", { status: upload.error === "method" ? 405 : 403 });
      if (upload.key.startsWith("t/") && upload.contentType !== "image/webp") return new Response("Invalid thumbnail type", { status: 403 });
      const bucket = upload.premium ? env.ARTWORKS_PREMIUM : env.ARTWORKS_PUBLIC;
      if (!bucket) return new Response("Artwork storage is temporarily unavailable", { status: 503 });
      await bucket.put(upload.key, request.body, { httpMetadata: { contentType: upload.contentType, cacheControl: upload.premium ? "private, no-store" : "public, max-age=31536000, immutable" } });
      return new Response(null, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    const stagedRead = await signedArtworkRead(request, env.NEXTAUTH_SECRET);
    if (stagedRead) {
      if (stagedRead.error) return new Response(stagedRead.error === "method" ? "Method not allowed" : "Invalid or expired read capability", { status: stagedRead.error === "method" ? 405 : 403 });
      const bucket = stagedRead.premium ? env.ARTWORKS_PREMIUM : env.ARTWORKS_PUBLIC;
      if (!bucket) return new Response("Artwork storage is temporarily unavailable", { status: 503 });
      const object = await bucket.get(stagedRead.key);
      if (!object) return new Response("Staged artwork was not found", { status: 404 });
      return new Response(object.body, { headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "no-store"
      } });
    }
    const publicMediaKey = await signedPublicMediaKey(request, env.NEXTAUTH_SECRET);
    if (publicMediaKey) {
      return servePublicImage(
        request,
        async () => {
          const object = await env.ARTWORKS_PUBLIC.get(publicMediaKey);
          if (!object) return new Response("Not found", { status: 404 });
          return new Response(object.body, { headers: {
            "Content-Type": object.httpMetadata?.contentType || "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable"
          } });
        },
        caches.default,
        (promise) => ctx.waitUntil(promise)
      );
    }
    const target = env.ANIPINS_CONTAINER.getByName("anipins-web-v2");
    return servePublicImage(
      request,
      () => target.fetch(request),
      caches.default,
      (promise) => ctx.waitUntil(promise)
    );
  }
};
export {
  AniPinsContainer,
  worker_default as default
};
