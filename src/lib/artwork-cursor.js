function toBase64(value) {
  if (typeof Buffer !== "undefined") return Buffer.from(value, "utf8").toString("base64url");
  return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64(value) {
  try {
    if (typeof Buffer !== "undefined") return Buffer.from(value, "base64url").toString("utf8");
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch { return ""; }
}

function encodeArtworkCursor({ createdAt, id }) {
  return toBase64(JSON.stringify({ createdAt, id }));
}

function decodeArtworkCursor(value) {
  if (!value || typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(fromBase64(value));
    if (!parsed || typeof parsed.createdAt !== "string" || !parsed.createdAt || !Number.isInteger(parsed.id) || parsed.id < 1) return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch { return null; }
}

module.exports = { decodeArtworkCursor, encodeArtworkCursor };
