const LEGACY_DATABASE_ENV_KEYS = new Set([
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
]);

export function containerRuntimeEnvironment(env, keys) {
  const useD1 = typeof env.D1_RPC_URL === "string" && env.D1_RPC_URL.length > 0;
  return Object.fromEntries(
    keys.flatMap(key => {
      if (useD1 && LEGACY_DATABASE_ENV_KEYS.has(key)) return [];
      const value = env[key];
      return typeof value === "string" && value.length > 0 ? [[key, value]] : [];
    }),
  );
}
