import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KEY = process.env.DSH_TEST_51TOKENS_KEY;
const PROXY_HOST = process.env.DSH_TEST_PROXY_HOST ?? "127.0.0.1";
const PROXY_PORT = Number(process.env.DSH_TEST_PROXY_PORT ?? 7890);
const API = process.env.DSH_TEST_MODELS_URL ?? "https://api.51tokens.top/v1/models";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("installed plugin can fetch through the proxy when a live key is set", async (t) => {
  if (!KEY) {
    t.skip("DSH_TEST_51TOKENS_KEY not set");
    return;
  }
  const { apply } = await import(pathToFileURL(join(root, "lib", "index.js")).href);
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
  apply(ctx, { enabled: true, host: PROXY_HOST, port: PROXY_PORT, noProxy: ["localhost", "127.0.0.1", "::1"] });
  try {
    const res = await fetch(API, { headers: { authorization: "Bearer " + KEY } });
    assert.equal(res.status, 200, "expected 200 through proxy, got " + res.status);
    const body = await res.json();
    assert.ok(Array.isArray(body.data) && body.data.length > 0, "model list must be non-empty");
  } finally {
    for (const dispose of effects.reverse()) dispose?.();
  }
});
