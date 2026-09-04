export declare const name = "dsh-proxy";
export declare const NS = "dsh-proxy";
export interface ProxyConfig {
    enabled?: boolean;
    host?: string;
    port?: number;
    noProxy?: string[];
    proxyUrl?: string;
}
export declare function proxyUrlOf(config: ProxyConfig): string;
export declare function shouldBypass(hostname: string, noProxy: string[]): boolean;
