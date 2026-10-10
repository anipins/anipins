import { DurableObject } from "cloudflare:workers";

const PORT = 8080;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const HEALTH_ATTEMPTS = 100;
const HEALTH_INTERVAL_MS = 200;

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
    this.starting ??= this.startAndWaitForPort().finally(() => {
      this.starting = undefined;
    });
    await this.starting;

    const url = new URL(request.url);
    url.protocol = "http:";
    url.host = "container";
    const forwarded = new Request(url, request);
    forwarded.headers.delete("host");
    return this.ctx.container.getTcpPort(PORT).fetch(forwarded);
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
  fetch(request, env) {
    return env.ANIPINS_CONTAINER.getByName("anipins-web").fetch(request);
  },
};
