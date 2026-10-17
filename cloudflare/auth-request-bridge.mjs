import { createAuthAssertion } from "./auth-assertion.mjs";

const CONTEXT_HEADER = "x-anipins-auth-context";
const SIGNATURE_HEADER = "x-anipins-auth-signature";
const ROLE_HEADER = "x-anipins-auth-role";
const COOKIE_NAME = "anipins_staging_better_auth";

function stagingSessionCookie(request) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== COOKIE_NAME) continue;
    return part.slice(separator + 1).trim();
  }
  return "";
}

/** Remove caller-controlled identity headers; only re-add a signed ID after resolving a server-side session. */
export async function prepareContainerAuthRequest(request, { secret, resolveIdentity, now = Date.now() } = {}) {
  const headers = new Headers(request.headers);
  headers.delete(CONTEXT_HEADER);
  headers.delete(SIGNATURE_HEADER);
  headers.delete(ROLE_HEADER);
  let authenticated = false;
  const cookie = stagingSessionCookie(request);
  if (cookie && typeof resolveIdentity === "function") {
    try {
      const identity = await resolveIdentity(cookie);
      if (Number.isSafeInteger(identity?.userId) && identity.userId > 0) {
        const assertion = await createAuthAssertion(identity, secret, now);
        headers.set(CONTEXT_HEADER, assertion.get(CONTEXT_HEADER));
        headers.set(SIGNATURE_HEADER, assertion.get(SIGNATURE_HEADER));
        authenticated = true;
      }
    } catch {
      // Bad, expired, or conflicting staged identities remain anonymous.
    }
  }
  return { request: new Request(request.clone(), { headers }), authenticated };
}
