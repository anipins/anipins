export function containerRuntimeEnvironment(env, keys) {
  const runtimeEnvironment = Object.fromEntries(
    keys.flatMap(key => {
      const value = env[key];
      return typeof value === "string" && value.length > 0 ? [[key, value]] : [];
    }),
  );

  // The old GOOGLE_CLIENT_ID secret may still exist for rollback. During the
  // Better Auth cutover, the selected Better Auth OAuth client is canonical
  // for both server-side ID-token validation and native app configuration.
  const betterAuthGoogleClientId = env.BETTER_AUTH_GOOGLE_CLIENT_ID;
  if (typeof betterAuthGoogleClientId === "string" && betterAuthGoogleClientId.length > 0) {
    runtimeEnvironment.GOOGLE_CLIENT_ID = betterAuthGoogleClientId;
    runtimeEnvironment.NEXT_PUBLIC_GOOGLE_CLIENT_ID = betterAuthGoogleClientId;
  }

  return runtimeEnvironment;
}
