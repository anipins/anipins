import { createStagingBetterAuth, isStagingBetterAuthHost, isStagingBetterAuthRequest } from "./better-auth-staging.mjs";
import { createD1BusinessIdentityStore, ensureBusinessIdentityLink } from "./business-identity-link.mjs";
import { enforceEdgeRateLimit } from "./rate-limit.mjs";

const IDENTITY_PATH = "/__staging/identity";

function json(body, status) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function handleStagingIdentityRequest(request, env, dependencies = {}) {
  if (new URL(request.url).pathname !== IDENTITY_PATH) return json({ error: "not_found" }, 404);
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const authFactory = dependencies.authFactory || createStagingBetterAuth;
  const identityStoreFactory = dependencies.identityStoreFactory || createD1BusinessIdentityStore;
  const auth = authFactory(env, request);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return json({ error: "unauthorized" }, 401);

  const linked = await ensureBusinessIdentityLink(
    identityStoreFactory(env.DB),
    session.user,
  );
  if (!linked.ok) {
    const status = ["email_verification_required", "admin_second_factor_required"].includes(linked.reason) ? 403 : 409;
    return json({ error: linked.reason }, status);
  }
  return json({ user: linked.user }, 200);
}

export default {
  async fetch(request, env) {
    const isIdentityRequest = new URL(request.url).pathname === IDENTITY_PATH;
    if ((!isIdentityRequest && !isStagingBetterAuthRequest(request)) || !isStagingBetterAuthHost(request)) {
      return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    const rateLimited = await enforceEdgeRateLimit(request, env);
    if (rateLimited) return rateLimited;
    try {
      if (isIdentityRequest) return await handleStagingIdentityRequest(request, env);
      return await createStagingBetterAuth(env, request).handler(request);
    } catch {
      return new Response("Staging authentication is not configured", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  },
};
