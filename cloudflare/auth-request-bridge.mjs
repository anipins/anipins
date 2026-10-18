import { createAuthAssertion } from "./auth-assertion.mjs";

const CONTEXT_HEADER = "x-anipins-auth-context";
const SIGNATURE_HEADER = "x-anipins-auth-signature";
const ROLE_HEADER = "x-anipins-auth-role";
function sessionCookie(request, cookieName) {
  const cookie = request.headers.get("cookie") || "";
  const cookieNames = Array.isArray(cookieName) ? cookieName : [cookieName, `__Secure-${cookieName}`];
  for (const part of cookie.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || !cookieNames.includes(part.slice(0, separator).trim())) continue;
    return part.slice(separator + 1).trim();
  }
  return "";
}

/** Remove caller-controlled identity headers; only re-add a signed ID after resolving a server-side session. */
export async function prepareContainerAuthRequest(request, { secret, resolveIdentity, cookieName = "anipins_staging_better_auth", now = Date.now() } = {}) {
  const headers = new Headers(request.headers);
  headers.delete(CONTEXT_HEADER);
  headers.delete(SIGNATURE_HEADER);
  headers.delete(ROLE_HEADER);
  let authenticated = false;
  const cookie = sessionCookie(request, cookieName);
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
