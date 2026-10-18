import { betterAuth } from "better-auth";
import { hashCompatiblePassword, verifyLegacyCompatiblePassword } from "./legacy-password.mjs";

const PRODUCTION_PATH = "/api/better-auth";
const PRODUCTION_HOSTS = new Set(["anipins.com", "www.anipins.com"]);

export function isProductionBetterAuthRequest(request) {
  const pathname = new URL(request.url).pathname;
  return pathname === PRODUCTION_PATH || pathname.startsWith(`${PRODUCTION_PATH}/`);
}

export function isLegacyAuthRequest(request) {
  const pathname = new URL(request.url).pathname;
  return pathname === "/api/auth" || pathname.startsWith("/api/auth/");
}

export function isProductionBetterAuthHost(request) {
  return PRODUCTION_HOSTS.has(new URL(request.url).hostname);
}

export function getProductionGoogleClientId(env) {
  return env.BETTER_AUTH_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || "";
}

export function createProductionBetterAuth(env, _request) {
  if (!env.DB) throw new Error("D1 production binding is not configured.");
  if (typeof env.BETTER_AUTH_SECRET !== "string" || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("Better Auth production secret is not configured securely.");
  }

  const socialProviders = {};
  const googleClientId = getProductionGoogleClientId(env);
  if (googleClientId && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: googleClientId,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    appName: "AniPins",
    baseURL: "https://anipins.com",
    basePath: "/api/better-auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: ["https://anipins.com", "https://www.anipins.com"],
    database: env.DB,
    emailAndPassword: {
      enabled: true,
      password: {
        hash: hashCompatiblePassword,
        verify: verifyLegacyCompatiblePassword,
      },
    },
    socialProviders,
    user: { modelName: "better_auth_user" },
    session: { modelName: "better_auth_session" },
    account: { modelName: "better_auth_account" },
    verification: { modelName: "better_auth_verification" },
    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: {
        path: "/",
        sameSite: "lax",
        secure: true,
      },
      cookies: {
        session_token: { name: "anipins_better_auth" },
      },
    },
  });
}
