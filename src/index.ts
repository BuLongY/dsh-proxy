import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import {
  Agent,
  type Dispatcher,
  type RequestInfo as UndiciRequestInfo,
  type RequestInit as UndiciRequestInit,
  ProxyAgent,
  fetch as undiciFetch,
} from "undici";

import { NS, name as pluginName, type ProxyConfig, proxyUrlOf, shouldBypass } from "./shared.js";

export { NS, proxyUrlOf, shouldBypass };
export type { ProxyConfig };
export const name = pluginName;
export const inject = { settings: { required: false } };

export const Config = Schema.intersect([
  Schema.object({
    enabled: Schema.boolean().default(true).description("Enable the custom HTTP proxy"),
    host: Schema.string().default("127.0.0.1").description("Proxy host"),
    port: Schema.number().default(7890).description("Proxy port"),
    noProxy: Schema.array(Schema.string())
      .role("table")
      .default(["localhost", "127.0.0.1", "::1"])
      .description("Hosts that bypass the proxy"),
  }).description("HTTP proxy"),
  Schema.object({
    proxyUrl: Schema.string().description("Full proxy URL; overrides host/port when set"),
  }).hidden(),
]);

const FETCH_PATCH = Symbol.for("dsh-proxy.fetch");
const ORIGINAL_FETCH = Symbol.for("dsh-proxy.original-fetch");

type PatchedFetch = typeof globalThis.fetch & { [FETCH_PATCH]?: boolean };

type SettingsScope = {
  get(): ProxyConfig;
  watch(callback: (next: ProxyConfig) => void): () => void;
};

type SettingsService = {
  register(ns: string, schema: unknown, options?: { base?: ProxyConfig }): SettingsScope;
};

function originHost(input: UndiciRequestInfo): string {
  try {
    if (typeof input === "string") return new URL(input).hostname;
    if (input instanceof URL) return input.hostname;
    if (typeof Request !== "undefined" && input instanceof Request) {
      return new URL(input.url).hostname;
    }
    if (typeof input === "object" && input && "url" in input) {
      return new URL(String((input as { url: string }).url)).hostname;
    }
  } catch {
    /* leave empty — treat as non-bypass */
  }
  return "";
}

function rememberOriginalFetch(original: typeof globalThis.fetch): void {
  const g = globalThis as typeof globalThis & { [ORIGINAL_FETCH]?: typeof globalThis.fetch };
  if (g[ORIGINAL_FETCH] === undefined) g[ORIGINAL_FETCH] = original;
}

function unwrapOriginalFetch(): typeof globalThis.fetch {
  const g = globalThis as typeof globalThis & { [ORIGINAL_FETCH]?: typeof globalThis.fetch };
  return g[ORIGINAL_FETCH] ?? globalThis.fetch.bind(globalThis);
}

function installFetchPatch(pick: (hostname: string) => Dispatcher): () => void {
  const current = globalThis.fetch as PatchedFetch;
  const original = current[FETCH_PATCH] ? unwrapOriginalFetch() : current;
  const patched = ((input: RequestInfo | URL, init?: RequestInit) => {
    const host = originHost(input as UndiciRequestInfo);
    const dispatcher = pick(host);
    return undiciFetch(input as UndiciRequestInfo, {
      ...(init as UndiciRequestInit | undefined),
      dispatcher,
    }) as unknown as Promise<Response>;
  }) as PatchedFetch;
  patched[FETCH_PATCH] = true;
  rememberOriginalFetch(original);
  globalThis.fetch = patched;
  return () => {
    if ((globalThis.fetch as PatchedFetch)[FETCH_PATCH]) {
      globalThis.fetch = original;
    }
  };
}

export function apply(ctx: Context, config: ProxyConfig): void {
  const logger = ctx.logger("dsh-proxy");
  let direct: Agent | undefined;
  let proxy: ProxyAgent | undefined;
  let uninstallFetch: (() => void) | undefined;
  let current: ProxyConfig = config;

  const uninstall = (reason: string): void => {
    uninstallFetch?.();
    uninstallFetch = undefined;
    try { proxy?.close(); } catch { /* ignore */ }
    try { direct?.close(); } catch { /* ignore */ }
    proxy = undefined;
    direct = undefined;
    logger.info("proxy uninstalled (%s)", reason);
  };

  const install = (raw: ProxyConfig): void => {
    current = raw;
    if (raw.enabled === false) {
      uninstall("disabled");
      return;
    }
    const url = proxyUrlOf(raw);
    const noProxy = raw.noProxy ?? ["localhost", "127.0.0.1", "::1"];
    const nextDirect = new Agent();
    const nextProxy = new ProxyAgent(url);
    const pick = (hostname: string): Dispatcher =>
      hostname && shouldBypass(hostname, noProxy) ? nextDirect : nextProxy;

    uninstallFetch?.();
    try { proxy?.close(); } catch { /* ignore */ }
    try { direct?.close(); } catch { /* ignore */ }
    direct = nextDirect;
    proxy = nextProxy;
    uninstallFetch = installFetchPatch(pick);
    logger.info("proxy installed %s (noProxy=%s)", url, noProxy.join(","));
  };

  install(current);

  const settings = (ctx as Context & { settings?: SettingsService }).settings;
  if (settings && typeof settings.register === "function") {
    const scope = settings.register(NS, Config, { base: config });
    current = scope.get() ?? config;
    install(current);
    scope.watch((next) => {
      try {
        install(next);
      } catch (error) {
        logger.error("failed to apply proxy settings: %s", error);
      }
    });
  }

  ctx.effect(() => () => uninstall("plugin unloaded"), "dsh-proxy: restore fetch");
}
