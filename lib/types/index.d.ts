import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import { NS, type ProxyConfig, proxyUrlOf, shouldBypass } from "./shared.js";
export { NS, proxyUrlOf, shouldBypass };
export type { ProxyConfig };
export declare const name = "dsh-proxy";
/**
 * No hard service dependency: the proxy must install even when the settings
 * service is absent, and the optional settings registration is attached through
 * `ctx.inject` below. DSH 0.1.2 ships `settings` in every profile, but a plugin
 * that declares it as required would simply never activate without it.
 */
export declare const inject: string[];
export declare const Config: Schema<unknown>;
export declare function apply(ctx: Context, config: ProxyConfig): void;
