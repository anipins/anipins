import crypto from "crypto";

/** Store only a one-way digest of bearer session tokens in D1. */
export function sessionStorageToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Accept old plaintext rows while existing sessions migrate on use. */
export function sessionTokenMatches(storedToken: string, cookieToken: string) {
  return storedToken === sessionStorageToken(cookieToken) || storedToken === cookieToken;
}
