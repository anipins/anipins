/** Preserve the original public host across the Worker-to-Container hop.
 * Next.js middleware uses x-forwarded-host for same-origin POST protection.
 * Overwrite the inbound header: browsers must not control this trust signal.
 */
export function forwardToContainer(request) {
  const publicUrl = new URL(request.url);
  const url = new URL(request.url);
  url.protocol = "http:";
  url.host = "container";

  const forwarded = new Request(url, request);
  forwarded.headers.delete("host");
  forwarded.headers.set("x-forwarded-host", publicUrl.host);
  forwarded.headers.set("x-forwarded-proto", publicUrl.protocol.slice(0, -1));
  return forwarded;
}
