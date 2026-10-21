import { DurableObject } from "cloudflare:workers";
import { canonicalHostRedirect, forwardToContainer, isAllowedPublicHost } from "./forwarding.mjs";
import { servePublicImage, signedPublicMediaKey } from "./public-image-cache.mjs";
import { handleD1RpcRequest } from "./d1-rpc.mjs";
import { createStagingBetterAuth, isStagingBetterAuthHost, isStagingBetterAuthRequest } from "./better-auth-staging.mjs";
import { createProductionBetterAuth, isProductionBetterAuthHost, isProductionBetterAuthRequest } from "./production-auth.mjs";
import { prepareContainerAuthRequest } from "./auth-request-bridge.mjs";
import { handleAdminMfaRecovery, handleAdminMfaVerification, handleBetterAuthProfile, resolveBetterAuthIdentity } from "./admin-mfa-route.mjs";
import { containerRuntimeEnvironment } from "./container-runtime-env.mjs";

const PORT = 8080;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const HEALTH_ATTEMPTS = 100;
const HEALTH_INTERVAL_MS = 200;
// Increment this when a code or configuration rollout must restart the
// existing durable container. Deploying a new image alone does not replace a
// container that is already running for this Durable Object.
const CONTAINER_BOOT_VERSION = "2026-10-21-premium-pricing-v1";
const MAX_ARTWORK_UPLOAD_BYTES = 40 * 1024 * 1024;
const UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SIGNED_STORAGE_PATHS = new Set(["/api/storage-upload", "/api/storage-read", "/api/storage-thumbnail"]);
const SIGNED_STORAGE_WORKER_HOST = "anipins-staging.anipins01.workers.dev";

// Keep this allow-list in source control so every runtime dependency is
// explicit. Values are configured as Worker secrets and are never committed.
const CONTAINER_ENV_KEYS = [
  "D1_RPC_URL",
  "D1_RPC_SECRET",
  "ADMIN_PASSWORD",
  "ADMIN_2FA_ENCRYPTION_KEY",
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "EMAIL_FROM",
  "RESEND_API_KEY",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_PREMIUM_PLAN_ID_199",
  "RAZORPAY_PREMIUM_PLAN_ID_99_WEEKLY",
  "RAZORPAY_PREMIUM_PLAN_ID_199_MONTHLY",
  "RAZORPAY_PREMIUM_PLAN_ID_1999_YEARLY",
  "GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "GOOGLE_SITE_VERIFICATION",
  "SETUP_SECRET",
  "SETUP_TOKEN",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "MEDIA_PROVIDER",
  "R2_PREMIUM_BUCKET",
  "R2_PUBLIC_BUCKET",
  "R2_ENDPOINT",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "ANDROID_APP_LINKS_SHA256",
];

function base64UrlBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

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
  // HTTP/2 browser uploads are allowed to use a streaming body without a
  // Content-Length header. Validate it when supplied, but do not reject a
  // valid mobile/WebView upload merely because the transport is chunked.
  const invalidLength = length !== null && (!Number.isFinite(length) || length < 1 || length > MAX_ARTWORK_UPLOAD_BYTES);
  if (!/^o\/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)$/.test(key) || !secret || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || expiresAt > Math.floor(Date.now() / 1000) + 300 || !signature || !UPLOAD_TYPES.has(contentType) || invalidLength || !request.body) return { error: "invalid" };
  try {
    const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, base64UrlBytes(signature), new TextEncoder().encode(`upload:${key}:${premium ? "1" : "0"}:${expiresAt}`));
    return valid ? { key, premium, contentType } : { error: "invalid" };
  } catch {
    return { error: "invalid" };
  }
}

// The application container needs the staged original once to generate its
// thumbnail and fingerprint. Read it through the Worker-bound R2 bucket so
// finalising an upload never depends on a second, separately configured S3
// credential path inside the container.
async function signedArtworkRead(request, secret) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/storage-read") return null;
  if (request.method !== "GET") return { error: "method" };
  const key = url.searchParams.get("key") || "";
  const premium = url.searchParams.get("p") === "1";
  const expiresAt = Number(url.searchParams.get("e"));
  const signature = url.searchParams.get("s") || "";
  if (!/^o\/[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)$/.test(key) || !secret || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || expiresAt > Math.floor(Date.now() / 1000) + 300 || !signature) return { error: "invalid" };
  try {
    const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, base64UrlBytes(signature), new TextEncoder().encode(`read:${key}:${premium ? "1" : "0"}:${expiresAt}`));
    return valid ? { key, premium } : { error: "invalid" };
  } catch {
    return { error: "invalid" };
  }
}

async function signedArtworkThumbnail(request, secret) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/storage-thumbnail") return null;
  if (request.method !== "PUT") return { error: "method" };
  const key = url.searchParams.get("key") || "";
  const premium = url.searchParams.get("p") === "1";
  const expiresAt = Number(url.searchParams.get("e"));
  const signature = url.searchParams.get("s") || "";
  const contentType = (request.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  const lengthHeader = request.headers.get("content-length");
  const length = lengthHeader ? Number(lengthHeader) : null;
  const invalidLength = length !== null && (!Number.isFinite(length) || length < 1 || length > 16 * 1024 * 1024);
  if (!/^t\/[a-f0-9]{16,32}\.webp$/.test(key) || !secret || !Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || expiresAt > Math.floor(Date.now() / 1000) + 300 || !signature || contentType !== "image/webp" || invalidLength || !request.body) return { error: "invalid" };
  try {
    const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, base64UrlBytes(signature), new TextEncoder().encode(`thumbnail:${key}:${premium ? "1" : "0"}:${expiresAt}`));
    return valid ? { key, premium, contentType } : { error: "invalid" };
  } catch {
    return { error: "invalid" };
  }
}

export class AniPinsContainer extends DurableObject {
  starting;
  monitoring;

  constructor(ctx, env) {
    super(ctx, env);
    const container = ctx.container;
    if (container.running) {
      void ctx.blockConcurrencyWhile(() => container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS));
      this.observeExit();
    }
  }

  async fetch(request) {
    // Lock the whole rollout + startup sequence, not just start(). Multiple
    // requests can arrive together on a cold start; if each checks the stored
    // rollout version before the first one writes it, they can destroy one
    // another's container while it is booting.
    this.starting ??= this.ensureReady().finally(() => {
      this.starting = undefined;
    });
    await this.starting;

    const forwarded = forwardToContainer(request);
    return this.ctx.container.getTcpPort(PORT).fetch(forwarded);
  }

  async ensureReady() {
    await this.restartForConfigurationRollout();
    await this.startAndWaitForPort();
  }

  async restartForConfigurationRollout() {
    const container = this.ctx.container;
    const storedVersion = await this.ctx.storage.get("containerBootVersion");
    let shouldRestart = storedVersion !== CONTAINER_BOOT_VERSION;
    if (container.running) {
      const containerInfo = await container.inspect();
      // With the durable_object scheduling policy, deploying a new image does
      // not itself replace active containers. Compare the image pinned to this
      // Worker version with the one currently running so ordinary deployments
      // roll forward without requiring a manually bumped boot-version string.
      // An empty image is reported during startup and snapshot restore; leave
      // those instances alone and let the existing readiness path handle them.
      if (containerInfo?.image && containerInfo.image !== container.images.base) {
        shouldRestart = true;
      }
    }
    if (!shouldRestart) return;

    // This is intentionally limited to a versioned configuration rollout.
    // The container has no persistent AniPins data, while the durable object
    // state records that this one restart has completed.
    if (container.running) {
      await container.destroy("Configuration rollout");
    }
    await this.ctx.storage.put("containerBootVersion", CONTAINER_BOOT_VERSION);
  }

  async startAndWaitForPort() {
    const container = this.ctx.container;
    if (!container.running) {
      container.start({
        image: container.images.base,
        // Keep production's default lean, while letting isolated staging opt
        // into more startup memory when validating the Next.js container.
        instance: this.env.CONTAINER_INSTANCE || "lite",
        // AniPins talks to D1, R2, Razorpay, Google and Resend.
        enableInternet: true,
        env: containerRuntimeEnvironment(this.env, CONTAINER_ENV_KEYS),
      });
      this.observeExit();
    }
    await container.setInactivityTimeout(INACTIVITY_TIMEOUT_MS);

    const port = container.getTcpPort(PORT);
    let lastError;
    for (let attempt = 0; attempt < HEALTH_ATTEMPTS; attempt += 1) {
      try {
        const response = await port.fetch("http://container/health", {
          signal: AbortSignal.timeout(1000),
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

  observeExit() {
    if (this.monitoring) return;
    this.monitoring = this.ctx.container.monitor()
      .then(() => console.log("AniPins container exited successfully"))
      .catch(error => console.error("AniPins container failed:", error))
      .finally(() => { this.monitoring = undefined; });
    this.ctx.waitUntil(this.monitoring);
  }
}

export default {
  async fetch(request, env, ctx) {
    const canonicalRedirect = canonicalHostRedirect(request);
    if (canonicalRedirect) return canonicalRedirect;

    // Isolated staging-only auth endpoint. It deliberately does not intercept
    // the live /api/auth routes used by the existing AniPins login flow.
    if (isStagingBetterAuthRequest(request)) {
      if (!isStagingBetterAuthHost(request)) return new Response("Not found", { status: 404 });
      try {
        return await createStagingBetterAuth(env, request).handler(request);
      } catch {
        return new Response("Staging authentication is not configured", {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    // Keep the Better Auth namespace distinct from legacy /api/auth handlers.
    // The only production host accepted is AniPins' canonical domain (www is
    // redirected above before reaching this point).
    if (isProductionBetterAuthRequest(request)) {
      if (!isProductionBetterAuthHost(request)) return new Response("Not found", { status: 404 });
      try {
        return await createProductionBetterAuth(env, request).handler(request);
      } catch {
        return new Response("Authentication is temporarily unavailable", {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    // Do not allow an arbitrary Worker/custom-domain hostname to become the
    // forwarded host trusted by the application for same-origin checks.
    const requestUrl = new URL(request.url);
    const signedStorageRequest = requestUrl.hostname === SIGNED_STORAGE_WORKER_HOST
      && SIGNED_STORAGE_PATHS.has(requestUrl.pathname);
    if (!isAllowedPublicHost(request) && !signedStorageRequest) return new Response("Misdirected request", { status: 421 });
    const isProductionHost = isProductionBetterAuthHost(request);
    const productionAuthReady = isProductionHost && env.DB && env.BETTER_AUTH_SECRET;
    const stagingAuthReady = isStagingBetterAuthHost(request) && env.DB && env.BETTER_AUTH_SECRET;
    if (productionAuthReady || stagingAuthReady) {
      const authFactory = productionAuthReady ? createProductionBetterAuth : createStagingBetterAuth;
      if (requestUrl.pathname === "/api/auth/admin-mfa/recovery") {
        return handleAdminMfaRecovery(request, env, { authFactory });
      }
      if (requestUrl.pathname === "/api/auth/admin-mfa") {
        return handleAdminMfaVerification(request, env, { authFactory });
      }
      if (requestUrl.pathname === "/api/auth/me") {
        const response = await handleBetterAuthProfile(request, env, { authFactory });
        if (response) return response;
      }
    }
    if (requestUrl.pathname === "/__internal/d1") {
      return handleD1RpcRequest(request, env);
    }
    const upload = await signedArtworkUpload(request, env.NEXTAUTH_SECRET);
    if (upload) {
      if (upload.error) return new Response(upload.error === "method" ? "Method not allowed" : "Invalid or expired upload capability", { status: upload.error === "method" ? 405 : 403 });
      const bucket = upload.premium ? env.ARTWORKS_PREMIUM : env.ARTWORKS_PUBLIC;
      if (!bucket) return new Response("Artwork storage is temporarily unavailable", { status: 503 });
      await bucket.put(upload.key, request.body, { httpMetadata: { contentType: upload.contentType } });
      return new Response(null, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    const thumbnail = await signedArtworkThumbnail(request, env.NEXTAUTH_SECRET);
    if (thumbnail) {
      if (thumbnail.error) return new Response(thumbnail.error === "method" ? "Method not allowed" : "Invalid or expired thumbnail capability", { status: thumbnail.error === "method" ? 405 : 403 });
      const bucket = thumbnail.premium ? env.ARTWORKS_PREMIUM : env.ARTWORKS_PUBLIC;
      if (!bucket) return new Response("Artwork storage is temporarily unavailable", { status: 503 });
      await bucket.put(thumbnail.key, request.body, {
        httpMetadata: {
          contentType: thumbnail.contentType,
          cacheControl: thumbnail.premium ? "private, no-store" : "public, max-age=31536000, immutable",
        },
      });
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
        "Cache-Control": "no-store",
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
            "Cache-Control": "public, max-age=31536000, immutable",
          } });
        },
        caches.default,
        promise => ctx.waitUntil(promise),
      );
    }
    const target = env.ANIPINS_CONTAINER.getByName("anipins-web-v2");
    const authCookieName = productionAuthReady ? "anipins_better_auth" : "anipins_staging_better_auth";
    const containerAuth = await prepareContainerAuthRequest(request, {
      secret: env.D1_RPC_SECRET,
      cookieName: authCookieName,
      resolveIdentity: productionAuthReady || stagingAuthReady
        ? async () => {
          return resolveBetterAuthIdentity(request, env, { authFactory: productionAuthReady ? createProductionBetterAuth : createStagingBetterAuth });
        }
        : undefined,
    });
    return servePublicImage(
      request,
      () => target.fetch(containerAuth.request),
      caches.default,
      promise => ctx.waitUntil(promise),
    );
  },
};
