const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const login = fs.readFileSync("src/app/login/page.tsx", "utf8");
const google = fs.readFileSync("src/components/GoogleSignInButton.tsx", "utf8");
const authClient = fs.readFileSync("src/lib/better-auth-client.ts", "utf8");
const navbar = fs.readFileSync("src/components/Navbar.tsx", "utf8");
const adminShell = fs.readFileSync("src/app/admin/AdminShell.tsx", "utf8");
const accountMenu = fs.readFileSync("src/components/AccountMenu.tsx", "utf8");

test("Better Auth browser flow remains opt-in unless the production container build enables it", () => {
  assert.match(authClient, /NEXT_PUBLIC_AUTH_MODE === "better-auth"/);
  assert.match(authClient, /NEXT_PUBLIC_BETTER_AUTH_BASE_PATH \|\| "\/api\/better-auth"/);
  assert.match(login, /if \(isBetterAuthMode && !legacyAuthFallback\)/);
  assert.match(login, /fetch\(`\/api\/auth\/\$\{mode\}`/);
});

test("Better Auth email sign-in resolves the server-trusted AniPins profile before navigation", () => {
  assert.match(login, /betterAuthClient\.signIn\.email/);
  assert.match(login, /betterAuthClient\.signUp\.email/);
  assert.match(login, /fetch\("\/api\/auth\/me"/);
  assert.match(login, /data\.user\.role/);
});

test("an unresolved Better Auth identity keeps the existing protected sign-in available", () => {
  assert.match(login, /const \[legacyAuthFallback, setLegacyAuthFallback\] = useState\(false\)/);
  assert.match(login, /if \(isBetterAuthMode && !legacyAuthFallback\)/);
  assert.match(login, /if \(!response\.ok \|\| !data\.user\)[\s\S]*?setLegacyAuthFallback\(true\)/);
  assert.match(login, /forceLegacyAuth=\{legacyAuthFallback\}/);
  assert.match(login, /Use existing sign-in/);
});

test("Google sign-in can use the existing account flow during the two-factor transition", () => {
  assert.match(google, /forceLegacyAuth\?: boolean/);
  assert.match(google, /if \(isBetterAuthMode && !forceLegacyAuth\)/);
});

test("Better Auth Google flow forwards Google ID tokens and leaves legacy flow intact", () => {
  assert.match(google, /betterAuthClient\.signIn\.social/);
  assert.match(google, /idToken: \{ token: credential/);
  assert.match(google, /fetch\("\/api\/auth\/google"/);
});

test("Better Auth mobile login keeps the authenticated WebView session instead of minting a legacy ticket", () => {
  assert.match(login, /\(!isBetterAuthMode \|\| legacyAuthFallback\)[\s\S]{0,120}mobile/);
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
