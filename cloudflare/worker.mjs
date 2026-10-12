import { DurableObject } from "cloudflare:workers";
import { forwardToContainer, isAllowedPublicHost } from "./forwarding.mjs";
import { servePublicImage, signedPublicMediaKey } from "./public-image-cache.mjs";

const PORT = 8080;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const HEALTH_ATTEMPTS = 100;
const HEALTH_INTERVAL_MS = 200;
// Increment this only when a configuration rollout must restart the existing
// durable container. Containers keep their startup environment for their
// lifetime, so secret rotations otherwise wait for the next natural restart.
const CONTAINER_BOOT_VERSION = "2026-10-12-pinterest-claim-tag-current";
const MAX_ARTWORK_UPLOAD_BYTES = 40 * 1024 * 1024;
const UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Keep this allow-list in source control so every runtime dependency is
// explicit. Values are configured as Worker secrets and are never committed.
const CONTAINER_ENV_KEYS = [
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
  "ANDROID_APP_LINKS_SHA256",
];

function runtimeEnvironment(env) {
  return Object.fromEntries(
    CONTAINER_ENV_KEYS.flatMap((key) => {
      const value = env[key];
      return typeof value === "string" && value.length > 0 ? [[key, value]] : [];
    }),
  );
}

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

export class AniPinsContainer extends DurableObject {
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
      this.starting = undefined;
    });
    await this.starting;

    const forwarded = forwardToContainer(request);
    return this.ctx.container.getTcpPort(PORT).fetch(forwarded);
  }

  async restartForConfigurationRollout() {
    const storedVersion = await this.ctx.storage.get("containerBootVersion");
    if (storedVersion === CONTAINER_BOOT_VERSION) return;

    // This is intentionally limited to a versioned configuration rollout.
    // The container has no persistent AniPins data, while the durable object
    // state records that this one restart has completed.
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
        env: runtimeEnvironment(this.env),
      });
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
}

export default {
  async fetch(request, env, ctx) {
    // Do not allow an arbitrary Worker/custom-domain hostname to become the
    // forwarded host trusted by the application for same-origin checks.
    if (!isAllowedPublicHost(request)) return new Response("Misdirected request", { status: 421 });
    const upload = await signedArtworkUpload(request, env.NEXTAUTH_SECRET);
    if (upload) {
      if (upload.error) return new Response(upload.error === "method" ? "Method not allowed" : "Invalid or expired upload capability", { status: upload.error === "method" ? 405 : 403 });
      const bucket = upload.premium ? env.ARTWORKS_PREMIUM : env.ARTWORKS_PUBLIC;
      if (!bucket) return new Response("Artwork storage is temporarily unavailable", { status: 503 });
      await bucket.put(upload.key, request.body, { httpMetadata: { contentType: upload.contentType } });
      return new Response(null, { status: 201, headers: { "Cache-Control": "no-store" } });
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
    return servePublicImage(
      request,
      () => target.fetch(request),
      caches.default,
      promise => ctx.waitUntil(promise),
    );
  },
};
