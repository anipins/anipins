const test = require("node:test");
const assert = require("node:assert/strict");

const { ensureBusinessIdentityLink } = require("../cloudflare/business-identity-link.mjs");

function createStore(initialUsers = []) {
  const users = initialUsers.map(user => ({ ...user }));
  const links = new Map();
  let nextId = Math.max(0, ...users.map(user => user.id)) + 1;
  return {
    users,
    links,
    async findLink(authUserId) {
      const id = links.get(authUserId);
      return id === undefined ? null : users.find(user => user.id === id) || null;
    },
    async findBusinessUser(email) {
      return users.find(user => user.email.toLowerCase() === email) || null;
    },
    async createBusinessUser({ email, name }) {
      const conflict = users.find(user => user.email.toLowerCase() === email);
      if (conflict) return { created: false, user: conflict };
      const user = { id: nextId++, email, name, role: "USER" };
      users.push(user);
      return { created: true, user };
    },
    async createLink(authUserId, userId) {
      if (links.has(authUserId) || [...links.values()].includes(userId)) return false;
      links.set(authUserId, userId);
      return true;
    },
  };
}

test("new Better Auth user gets a USER profile without trusting client role claims", async () => {
  const store = createStore();
  const result = await ensureBusinessIdentityLink(store, {
    id: "ba-user-1", email: "New.User@Example.com", name: "New User", emailVerified: false,
    role: "ADMIN",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.user, { id: 1, email: "new.user@example.com", role: "USER" });
  assert.equal(store.users.length, 1);
});

test("unverified Better Auth email cannot attach to an existing AniPins account", async () => {
  const store = createStore([{ id: 41, email: "owner@example.com", name: "Owner", role: "ADMIN" }]);
  const result = await ensureBusinessIdentityLink(store, {
    id: "ba-attacker", email: "OWNER@example.com", emailVerified: false,
  });

  assert.deepEqual(result, { ok: false, reason: "email_verification_required" });
  assert.equal(store.links.size, 0);
});

test("verified email can link to an existing profile and uses its database role", async () => {
  const store = createStore([{ id: 41, email: "owner@example.com", name: "Owner", role: "ADMIN" }]);
  const result = await ensureBusinessIdentityLink(store, {
    id: "ba-owner", email: "OWNER@example.com", emailVerified: true,
    role: "USER",
  });

  assert.deepEqual(result, { ok: true, user: { id: 41, email: "owner@example.com", role: "ADMIN" } });
});

test("identity linking is idempotent and will not reassign an existing link", async () => {
  const store = createStore();
  const first = await ensureBusinessIdentityLink(store, {
    id: "ba-a", email: "a@example.com", emailVerified: false,
  });
  const second = await ensureBusinessIdentityLink(store, {
    id: "ba-a", email: "changed@example.com", emailVerified: true,
  });

  assert.deepEqual(second, first);
  assert.equal(store.users.length, 1);
  assert.equal(store.links.get("ba-a"), 1);
});

test("invalid auth identity fields fail closed", async () => {
  await assert.rejects(() => ensureBusinessIdentityLink(createStore(), {
    id: "", email: "invalid@example.com",
  }), /valid Better Auth identity/);
});
