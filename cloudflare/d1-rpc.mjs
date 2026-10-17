const MAX_BODY_BYTES = 64 * 1024;
const MAX_SQL_BYTES = 16 * 1024;
const MAX_PARAMS = 100;
const MAX_CLOCK_SKEW_MS = 30_000;

function json(body, status, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

async function readLimitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function verifySignature(secret, timestamp, body, signature) {
  if (!secret || !timestamp || !signature) return false;
  const digest = await crypto.subtle.digest("SHA-256", body);
  const digestHex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  let signatureBytes;
  try {
    const normalized = signature.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
    signatureBytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  } catch {
    return false;
  }
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(`${timestamp}.${digestHex}`),
  );
}

function validPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!["all", "first", "run"].includes(value.operation)) return false;
  if (typeof value.sql !== "string" || !value.sql.trim() || new TextEncoder().encode(value.sql).byteLength > MAX_SQL_BYTES) return false;
  if (!Array.isArray(value.params) || value.params.length > MAX_PARAMS) return false;
  return value.params.every(parameter =>
    parameter === null || typeof parameter === "string" ||
    typeof parameter === "number" && Number.isFinite(parameter) ||
    typeof parameter === "boolean"
  );
}

/** Authenticated, bounded SQL bridge used only by the private Next.js Container. */
export async function handleD1RpcRequest(request, env, { now = Date.now() } = {}) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  if (!env?.DB || !env?.D1_RPC_SECRET) return json({ error: "database_unavailable" }, 503);
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "unsupported_media_type" }, 415);
  }

  const timestamp = request.headers.get("x-anipins-d1-time") || "";
  const timestampMs = Number(timestamp);
  if (!/^\d{13}$/.test(timestamp) || !Number.isSafeInteger(timestampMs) || Math.abs(now - timestampMs) > MAX_CLOCK_SKEW_MS) {
    return json({ error: "unauthorized" }, 401);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ error: "request_too_large" }, 413);
  const body = await readLimitedBody(request);
  if (!body) return json({ error: "request_too_large" }, 413);
  const validSignature = await verifySignature(env.D1_RPC_SECRET, timestamp, body, request.headers.get("x-anipins-d1-signature") || "");
  if (!validSignature) return json({ error: "unauthorized" }, 401);

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  if (!validPayload(payload)) {
    const oversizedSql = typeof payload?.sql === "string" && new TextEncoder().encode(payload.sql).byteLength > MAX_SQL_BYTES;
    return json({ error: oversizedSql ? "statement_too_large" : "invalid_request" }, oversizedSql ? 413 : 400);
  }

  try {
    const statement = env.DB.prepare(payload.sql).bind(...payload.params);
    if (payload.operation === "first") return json(await statement.first(), 200);
    if (payload.operation === "run") {
      const result = await statement.run();
      return json({ success: Boolean(result?.success), meta: result?.meta || null }, 200);
    }
    const result = await statement.all();
    return json({ results: Array.isArray(result?.results) ? result.results : [] }, 200);
  } catch {
    // Do not include SQL or bound values in logs or error responses.
    return json({ error: "database_query_failed" }, 500);
  }
}
