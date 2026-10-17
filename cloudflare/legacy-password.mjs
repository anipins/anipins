import bcrypt from "bcryptjs";
import { hashPassword, verifyPassword } from "better-auth/crypto";

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

/** Keep migrated AniPins bcrypt credentials usable while accepting Better Auth test hashes. */
export async function verifyLegacyCompatiblePassword({ password, hash }) {
  if (typeof password !== "string" || typeof hash !== "string" || !hash) return false;
  if (BCRYPT_HASH.test(hash)) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
  try {
    return await verifyPassword({ password, hash });
  } catch {
    return false;
  }
}

/** Use the existing AniPins bcrypt format for credentials created during migration. */
export async function hashCompatiblePassword(password) {
  if (typeof password !== "string") throw new TypeError("Password must be a string.");
  return bcrypt.hash(password, 10);
}

export { hashPassword as hashBetterAuthPassword };
