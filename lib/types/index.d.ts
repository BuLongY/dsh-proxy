import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import { NS, type ProxyConfig, proxyUrlOf, shouldBypass } from "./shared.js";
export { NS, proxyUrlOf, shouldBypass };
export type { ProxyConfig };
export declare const name = "dsh-proxy";
export declare const inject: {
    settings: {
        required: boolean;
    };
};
export declare const Config: Schema<unknown>;
export declare function apply(ctx: Context, config: ProxyConfig): void;
