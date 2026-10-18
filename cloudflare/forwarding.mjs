const PUBLIC_HOSTS = new Set([
  "anipins.com",
  "www.anipins.com",
  "anipins-migration-staging.anipins01.workers.dev",
]);

export function canonicalHostRedirect(request) {
  const url = new URL(request.url);
  if (!PUBLIC_HOSTS.has(url.hostname)) return null;
  if (url.protocol !== "http:" && url.hostname !== "www.anipins.com") return null;

  url.protocol = "https:";
  url.hostname = "anipins.com";
  url.port = "";
  return Response.redirect(url, 308);
}

export function isAllowedPublicHost(request) {
  return PUBLIC_HOSTS.has(new URL(request.url).hostname);
}

/** Preserve the original public host across the Worker-to-Container hop.
 * Next.js middleware uses x-forwarded-host for same-origin POST protection.
 * Overwrite the inbound header: browsers must not control this trust signal.
 */
export function forwardToContainer(request) {
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
