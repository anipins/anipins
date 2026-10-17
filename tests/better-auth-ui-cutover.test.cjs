const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const login = fs.readFileSync("src/app/login/page.tsx", "utf8");
const google = fs.readFileSync("src/components/GoogleSignInButton.tsx", "utf8");
const authClient = fs.readFileSync("src/lib/better-auth-client.ts", "utf8");
const navbar = fs.readFileSync("src/components/Navbar.tsx", "utf8");
const adminShell = fs.readFileSync("src/app/admin/AdminShell.tsx", "utf8");
const accountMenu = fs.readFileSync("src/components/AccountMenu.tsx", "utf8");

test("Better Auth browser flow is opt-in and production defaults stay on legacy login", () => {
  assert.match(authClient, /NEXT_PUBLIC_AUTH_MODE === "better-auth"/);
  assert.match(authClient, /NEXT_PUBLIC_BETTER_AUTH_BASE_PATH \|\| "\/__staging\/auth"/);
  assert.match(login, /if \(isBetterAuthMode\)/);
  assert.match(login, /fetch\(`\/api\/auth\/\$\{mode\}`/);
});

test("Better Auth email sign-in resolves the server-trusted AniPins profile before navigation", () => {
  assert.match(login, /betterAuthClient\.signIn\.email/);
  assert.match(login, /betterAuthClient\.signUp\.email/);
  assert.match(login, /fetch\("\/api\/auth\/me"/);
  assert.match(login, /data\.user\.role/);
});

test("Better Auth Google flow forwards Google ID tokens and leaves legacy flow intact", () => {
  assert.match(google, /betterAuthClient\.signIn\.social/);
  assert.match(google, /idToken: \{ token: credential/);
  assert.match(google, /fetch\("\/api\/auth\/google"/);
});

test("Better Auth mobile login keeps the authenticated WebView session instead of minting a legacy ticket", () => {
  assert.match(login, /!isBetterAuthMode[\s\S]{0,100}mobile/);
});

test("sign-out revokes the active Better Auth session and keeps legacy deletion on its own path", () => {
  assert.match(authClient, /betterAuthClient\.signOut\(\{\}\)/);
  assert.match(authClient, /if \(isBetterAuthMode\)[\s\S]*?return;[\s\S]*?\/api\/auth\/logout/);
  assert.match(navbar, /signOutFromApp\(\)/);
  assert.match(adminShell, /signOutFromApp\(\)/);
});

test("Better Auth mode does not show the legacy saved-session switcher", () => {
  assert.match(accountMenu, /if \(isBetterAuthMode\) return <Link href="\/profile"/);
});
