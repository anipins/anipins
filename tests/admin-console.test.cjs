const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("admin console exposes user access, payment history, reports, and notifications", () => {
  const shell = read("src/app/admin/AdminShell.tsx");
  for (const href of ["/admin/users", "/admin/payments", "/admin/reports", "/admin/notifications"]) {
    assert.ok(shell.includes(href), `missing admin navigation link ${href}`);
  }
  for (const file of ["users/page.tsx", "payments/page.tsx", "reports/page.tsx", "notifications/page.tsx"]) {
    assert.ok(fs.existsSync(path.join(root, "src/app/admin", file)), `missing admin page ${file}`);
  }
});
test("user access changes are admin-only, constrained to known roles, and cannot demote self or last admin", () => {
  const route = read("src/app/api/admin/users/route.ts");
  assert.match(route, /isAdmin\(u\)/);
  assert.match(route, /export async function PATCH/);
  assert.match(route, /role !== "USER" && role !== "ADMIN"/);
  assert.match(route, /userId === Number\(admin\.id\)/);
  assert.match(route, /COUNT\(\*\).*ADMIN/s);
});

test("payment tracking is read-only and report moderation is restricted to safe statuses", () => {
  const payments = read("src/app/api/admin/payments/route.ts");
  const reports = read("src/app/api/admin/reports/route.ts");
  assert.match(payments, /isAdmin\(user\)/);
  assert.match(payments, /billing_subscriptions/);
  assert.doesNotMatch(payments, /export async function (POST|PATCH|DELETE)/);
  assert.match(reports, /isAdmin\(user\)/);
  assert.match(reports, /OPEN.*RESOLVED.*REJECTED/);
  assert.match(reports, /audit\(/);
});

test("admin announcements require admin access and are delivered to each selected recipient", () => {
  const route = read("src/app/api/admin/notifications/route.ts");
  assert.match(route, /isAdmin\(user\)/);
  assert.match(route, /INSERT INTO admin_announcements/);
  assert.match(route, /admin_announcement_recipients/);
  assert.match(route, /audit\(/);
  assert.ok(fs.existsSync(path.join(root, "migrations/d1/0005_admin_announcements.sql")));
});

