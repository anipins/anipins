const test = require("node:test");
const assert = require("node:assert/strict");

const { handleStagingIdentityRequest } = require("../cloudflare/better-auth-staging-worker.mjs");

function setup({ sessionUser, existingBusinessUser } = {}) {
  const state = { users: existingBusinessUser ? [{ ...existingBusinessUser }] : [], links: new Map() };
  let nextId = Math.max(0, ...state.users.map(user => user.id)) + 1;
  return {
    state,
    dependencies: {
      authFactory: () => ({ api: { getSession: async () => sessionUser ? { user: sessionUser } : null } }),
      identityStoreFactory: () => ({
        findLink: async id => {
          const userId = state.links.get(id);
          return state.users.find(user => user.id === userId) || null;
        },
        findBusinessUser: async email => state.users.find(user => user.email === email) || null,
        createBusinessUser: async ({ email, name }) => {
          const found = state.users.find(user => user.email === email);
          if (found) return { created: false, user: found };
          const user = { id: nextId++, email, name, role: "USER" };
          state.users.push(user);
          return { created: true, user };
        },
        createLink: async (authUserId, userId) => {
          if (state.links.has(authUserId) || [...state.links.values()].includes(userId)) return false;
          state.links.set(authUserId, userId);
          return true;
        },
      }),
    },
  };
}

test("identity endpoint requires an authenticated Better Auth session", async () => {
  const { state, dependencies } = setup();
  const response = await handleStagingIdentityRequest(
    new Request("https://anipins-better-auth-staging.anipins01.workers.dev/__staging/identity"),
    { DB: {} }, dependencies,
  );

  assert.equal(response.status, 401);
  assert.equal(state.users.length, 0);
});

test("identity endpoint returns only the linked profile and trusted database role", async () => {
  const { state, dependencies } = setup({
    sessionUser: { id: "ba-1", email: "owner@example.com", emailVerified: true, role: "USER" },
    existingBusinessUser: { id: 19, email: "owner@example.com", name: "Owner", role: "ADMIN" },
  });
  const response = await handleStagingIdentityRequest(
    new Request("https://anipins-better-auth-staging.anipins01.workers.dev/__staging/identity"),
    { DB: {} }, dependencies,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    user: { id: 19, email: "owner@example.com", role: "ADMIN" },
  });
  assert.equal(state.links.get("ba-1"), 19);
});

test("identity endpoint refuses unverified email collision with an existing account", async () => {
  const { state, dependencies } = setup({
    sessionUser: { id: "ba-unverified", email: "owner@example.com", emailVerified: false },
    existingBusinessUser: { id: 19, email: "owner@example.com", name: "Owner", role: "ADMIN" },
  });
  const response = await handleStagingIdentityRequest(
    new Request("https://anipins-better-auth-staging.anipins01.workers.dev/__staging/identity"),
    { DB: {} }, dependencies,
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "email_verification_required" });
  assert.equal(state.links.size, 0);
});

test("identity endpoint blocks an admin with legacy 2FA until the new server verification is complete", async () => {
  const { state, dependencies } = setup({
    sessionUser: { id: "ba-admin", email: "owner@example.com", emailVerified: true },
    existingBusinessUser: { id: 19, email: "owner@example.com", name: "Owner", role: "ADMIN", two_factor_enabled: 1 },
  });
  const response = await handleStagingIdentityRequest(
    new Request("https://anipins-better-auth-staging.anipins01.workers.dev/__staging/identity"),
    { DB: {} }, dependencies,
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "admin_second_factor_required" });
  assert.equal(state.links.size, 0);
});

test("identity endpoint is GET-only", async () => {
  const { dependencies } = setup();
  const response = await handleStagingIdentityRequest(
    new Request("https://anipins-better-auth-staging.anipins01.workers.dev/__staging/identity", { method: "POST" }),
    { DB: {} }, dependencies,
  );
  assert.equal(response.status, 405);
});
