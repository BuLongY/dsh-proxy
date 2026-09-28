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
    inject(_names, callback) {
      callback({});
      return undefined;
    },
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
    inject(_names, callback) {
      callback({});
      return undefined;
    },
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

test("patched fetch routes each host to the proxy or the direct agent", async () => {
  // Deterministic routing check: capture the dispatcher the patch hands to the
  // underlying fetch instead of depending on live network reachability.
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = ((input, init) => {
    calls.push({ url: String(input), dispatcher: init?.dispatcher });
    return Promise.resolve(new Response("ok", { status: 200 }));
  });

  const { apply } = await loadHost();
  const effects = [];
  const ctx = {
    inject(_names, callback) {
      callback({});
      return undefined;
    },
    logger() {
      return { info() {}, warn() {}, error() {} };
    },
    effect(factory) {
      const dispose = factory();
      effects.push(dispose);
      return dispose;
    },
  };

  apply(ctx, {
    enabled: true,
    host: "127.0.0.1",
    port: 7890,
    noProxy: ["localhost", "127.0.0.1", "::1"],
  });

  try {
    await fetch("https://api.51tokens.top/v1/models");
    await fetch("http://127.0.0.1:3080/plugins/x.js");
    await fetch("https://localhost/health");

    assert.equal(calls.length, 3);
    // Every call must carry a dispatcher — that is what makes it use the proxy
    // or the explicit direct agent instead of the ambient global dispatcher.
    assert.ok(calls.every((call) => call.dispatcher !== undefined));
    // The remote host goes through the proxy agent; the two local hosts share
    // one direct agent and must not reuse the proxy dispatcher.
    assert.notEqual(calls[0].dispatcher, calls[1].dispatcher);
    assert.equal(calls[1].dispatcher, calls[2].dispatcher);
  } finally {
    for (const dispose of effects.reverse()) dispose?.();
    globalThis.fetch = original;
  }
});
