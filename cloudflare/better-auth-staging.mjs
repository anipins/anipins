import { betterAuth } from "better-auth";
import { hashCompatiblePassword, verifyLegacyCompatiblePassword } from "./legacy-password.mjs";

const STAGING_HOSTS = new Set([
  "anipins-staging.anipins01.workers.dev",
  "anipins-better-auth-staging.anipins01.workers.dev",
]);
const STAGING_PATH = "/__staging/auth";

export function isStagingBetterAuthRequest(request) {
  const url = new URL(request.url);
  return url.pathname === STAGING_PATH || url.pathname.startsWith(`${STAGING_PATH}/`);
}

export function isStagingBetterAuthHost(request) {
  const hostname = new URL(request.url).hostname;
  return STAGING_HOSTS.has(hostname) || hostname === "localhost" || hostname === "127.0.0.1";
}

export function createStagingBetterAuth(env, request) {
  if (!env.DB) throw new Error("D1 staging binding is not configured.");
  if (typeof env.BETTER_AUTH_SECRET !== "string" || env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("Better Auth staging secret is not configured securely.");
  }

  const requestUrl = new URL(request.url);
  const localDevelopment = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const baseURL = env.BETTER_AUTH_URL || (localDevelopment
    ? requestUrl.origin
    : `https://${requestUrl.hostname}`);
  const trustedOrigins = [baseURL];
  if (localDevelopment) trustedOrigins.push(requestUrl.origin);

  const socialProviders = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    appName: "AniPins Staging",
    baseURL,
    basePath: STAGING_PATH,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
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
      cookies: {
        session_token: { name: "anipins_staging_better_auth" },
      },
    },
  });
}
