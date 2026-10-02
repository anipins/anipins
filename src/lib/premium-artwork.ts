import { run, USE_PG } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function premiumArtworkFilter(premiumOnly: boolean) {
  return premiumOnly ? "COALESCE(premium, 0) = 1" : "COALESCE(premium, 0) = 0";
}

export async function ensurePremiumArtworkSchema() {
  if (!schemaReady) schemaReady = USE_PG ? run("ALTER TABLE artworks ADD COLUMN IF NOT EXISTS premium INTEGER DEFAULT 0") : Promise.resolve();
  return schemaReady;
}
