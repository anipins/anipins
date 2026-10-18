"use client";

import { createAuthClient } from "better-auth/react";

/** Keep the current production login untouched until the D1 cutover is ready. */
export const isBetterAuthMode = process.env.NEXT_PUBLIC_AUTH_MODE === "better-auth";

/** Better Auth lives under its own namespace so legacy `/api/auth/*` routes remain available. */
export const betterAuthClient = createAuthClient({
  basePath: process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_PATH || "/api/better-auth",
});

export async function signOutFromApp() {
  if (isBetterAuthMode) {
    const result = await betterAuthClient.signOut({});
    if (result.error) throw new Error(result.error.message || "Sign-out failed.");
    return;
  }
  const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  if (!response.ok) throw new Error("Sign-out failed.");
}
