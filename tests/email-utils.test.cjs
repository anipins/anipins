const test = require("node:test");
const assert = require("node:assert/strict");
const { emailFrom } = require("../src/lib/email-utils");

test("uses a configured verified sender and has a safe test fallback", () => {
  assert.equal(emailFrom("AniPins <noreply@anipins.com>"), "AniPins <noreply@anipins.com>");
  assert.equal(emailFrom(""), "AniPins <onboarding@resend.dev>");
});
