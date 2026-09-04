import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadHost() {
  return import(pathToFileURL(join(root, "lib", "index.js")).href + "?t=" + Date.now());
}

test("proxyUrlOf prefers proxyUrl then host/port", async () => {
  const { proxyUrlOf } = await loadHost();
  assert.equal(proxyUrlOf({}), "http://127.0.0.1:7890");
  assert.equal(proxyUrlOf({ host: "10.0.0.1", port: 1080 }), "http://10.0.0.1:1080");
  assert.equal(proxyUrlOf({ proxyUrl: "http://127.0.0.1:7897" }), "http://127.0.0.1:7897");
});

test("shouldBypass matches exact, suffix, and dotted rules", async () => {
  const { shouldBypass } = await loadHost();
  const rules = ["localhost", "127.0.0.1", "::1", ".internal"];
  assert.equal(shouldBypass("localhost", rules), true);
  assert.equal(shouldBypass("127.0.0.1", rules), true);
  assert.equal(shouldBypass("foo.internal", rules), true);
  assert.equal(shouldBypass("internal", rules), true);
  assert.equal(shouldBypass("api.example.com", rules), false);
});

test("apply patches global fetch and restores it on dispose", async () => {
  const { apply } = await loadHost();
  const original = globalThis.fetch;
  const effects = [];
  const ctx = {
    logger() {
      return { info() {}, warn() {}, error() {} };
    },
    effect(factory) {
      const dispose = factory();
      effects.push(dispose);
      return dispose;
    },
  };
  apply(ctx, { enabled: true, host: "127.0.0.1", port: 7890, noProxy: ["localhost"] });
  assert.notEqual(globalThis.fetch, original);
  for (const dispose of effects.reverse()) dispose?.();
  assert.equal(globalThis.fetch, original);
});

test("disabled config leaves fetch untouched", async () => {
  const { apply } = await loadHost();
  const original = globalThis.fetch;
  const ctx = {
    logger() {
      return { info() {}, warn() {}, error() {} };
    },
    effect(factory) {
      return factory();
    },
  };
  apply(ctx, { enabled: false });
  assert.equal(globalThis.fetch, original);
});
