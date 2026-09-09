import crypto from "crypto";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };
let cached: { token: string; expiresAt: number } | null = null;

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function credentials(): ServiceAccount | null {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value.project_id && value.client_email && value.private_key ? value : null;
  } catch { return null; }
}

async function accessToken(account: ServiceAccount) {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(account.private_key);
  const assertion = `${unsigned}.${base64url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`Firebase token request failed (${response.status})`);
  const data = await response.json();
  cached = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return cached.token;
}

export async function sendPush(tokens: string[], title: string, body: string, path: string) {
  const account = credentials();
  if (!account || !tokens.length) return { configured: false, sent: 0 };
  const bearer = await accessToken(account);
  let sent = 0;
  for (const token of tokens) {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { token, notification: { title, body }, data: { path }, android: { priority: "high", notification: { channel_id: "new_artwork" } } } }),
    });
    if (response.ok) sent++;
  }
  return { configured: true, sent };
}
