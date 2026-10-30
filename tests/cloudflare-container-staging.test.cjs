const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), "utf8");

test("Cloudflare app release config targets production D1 and keeps the container readiness path", () => {
  const config = read("wrangler.jsonc");
  const worker = read("cloudflare", "worker.mjs");
  const dockerfile = read("Dockerfile");
  const dockerignore = read(".dockerignore");
  const health = read("src", "app", "health", "route.ts");
  const packageJson = JSON.parse(read("package.json"));

  assert.match(config, /"name"\s*:\s*"anipins-staging"/);
  assert.match(config, /"class_name"\s*:\s*"AniPinsContainer"/);
  assert.match(config, /"scheduling_policy"\s*:\s*"durable_object"/);
  assert.match(config, /"dockerfile"\s*:\s*"\.\/Dockerfile"/);
  assert.match(config, /"database_name"\s*:\s*"anipins-production-db"/);
  assert.match(config, /"NEXT_PUBLIC_AUTH_MODE"\s*:\s*"better-auth"/);
  assert.doesNotMatch(config, /"routes"\s*:/);

  assert.match(worker, /class AniPinsContainer extends DurableObject/);
  assert.match(worker, /enableInternet:\s*true/);
  assert.match(worker, /const PORT = 8080/);
  assert.match(worker, /getTcpPort\(PORT\)/);
  assert.match(worker, /http:\/\/container\/health/);
  assert.match(worker, /this\.starting \?\?= this\.ensureReady\(\)/);
  assert.match(worker, /async ensureReady\(\) \{\s*await this\.restartForConfigurationRollout\(\);\s*await this\.startAndWaitForPort\(\);/);
  assert.match(worker, /CONTAINER_INSTANCE_NAME = "anipins-web-mobile-premium-v5"/);
  assert.match(worker, /getByName\(CONTAINER_INSTANCE_NAME\)/);
  assert.match(worker, /resolveBetterAuthIdentity\(request, env, \{ authFactory:/);
  assert.match(worker, /const containerInfo = await container\.inspect\(\)/);
  assert.match(worker, /containerInfo\?\.image && containerInfo\.image !== container\.images\.base/);
  assert.match(worker, /await container\.destroy\("Configuration rollout"\)/);

  assert.match(dockerfile, /"\.\/node_modules\/\.bin\/next", "start", "-H", "0\.0\.0\.0", "-p", "8080"/);
  assert.match(dockerfile, /EXPOSE 8080/);
  assert.match(dockerignore, /^\.env\*$/m);
  assert.match(dockerignore, /^node_modules\/$/m);
  assert.match(health, /NextResponse\.json\(\{ ok: true \}\)/);
  assert.equal(packageJson.scripts["cf:deploy:staging"], "wrangler deploy");
});
