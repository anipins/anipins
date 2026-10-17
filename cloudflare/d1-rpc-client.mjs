import { createHash, createHmac } from "node:crypto";

function assertSafeRpcUrl(value) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("D1_RPC_URL must use HTTPS except for local development.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("D1_RPC_URL must not contain credentials, query parameters, or a fragment.");
  }
  return url;
}

/** Send one authenticated D1 statement from the trusted Node container. */
export async function callD1Rpc({ url, secret, operation, sql, params = [], fetchImpl = fetch, now = Date.now() }) {
  if (!secret || secret.length < 32) throw new Error("D1_RPC_SECRET is not configured securely.");
  const target = assertSafeRpcUrl(url);
  const body = JSON.stringify({ operation, sql, params });
  const timestamp = String(now);
  const digest = createHash("sha256").update(body).digest("hex");
  const signature = createHmac("sha256", secret).update(`${timestamp}.${digest}`).digest("base64url");
  let response;
  try {
    response = await fetchImpl(target, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-anipins-d1-time": timestamp,
        "x-anipins-d1-signature": signature,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("D1 database service is unavailable.");
  }
  if (!response.ok) throw new Error(`D1 database request failed (${response.status}).`);
  try {
    return await response.json();
  } catch {
    throw new Error("D1 database service returned an invalid response.");
  }
}
