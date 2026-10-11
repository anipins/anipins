const test = require("node:test");
const assert = require("node:assert/strict");
const { connectionMessage, shouldTreatAsExpiredSession } = require("../src/lib/reliability-state");

test("describes offline and slow-network states without treating normal connections as failures", () => {
  assert.equal(connectionMessage({ online: false }), "You're offline. Check your connection and try again.");
  assert.equal(connectionMessage({ online: true, effectiveType: "2g", saveData: false }), "Your connection is slow. Artwork may take a little longer to load.");
  assert.equal(connectionMessage({ online: true, effectiveType: "4g", saveData: false }), null);
});

test("only marks a response as session-expired when the server explicitly says so", () => {
  assert.equal(shouldTreatAsExpiredSession(401, { sessionExpired: true }), true);
  assert.equal(shouldTreatAsExpiredSession(401, { error: "Sign in to save artwork." }), false);
  assert.equal(shouldTreatAsExpiredSession(403, { sessionExpired: true }), false);
});
