export const name = "dsh-proxy";
export const NS = "dsh-proxy";

export interface ProxyConfig {
  enabled?: boolean;
  host?: string;
  port?: number;
  noProxy?: string[];
  proxyUrl?: string;
}

export function proxyUrlOf(config: ProxyConfig): string {
  const explicit = config.proxyUrl?.trim();
  if (explicit) return explicit;
  const host = (config.host ?? "127.0.0.1").trim() || "127.0.0.1";
  const port = Number(config.port ?? 7890);
  return "http://" + host + ":" + (Number.isFinite(port) ? port : 7890);
}

export function shouldBypass(hostname: string, noProxy: string[]): boolean {
  const host = hostname.toLowerCase();
  for (const raw of noProxy) {
    const rule = raw.trim().toLowerCase();
    if (!rule) continue;
    if (rule === "*") return true;
    if (rule.startsWith(".")) {
      if (host === rule.slice(1) || host.endsWith(rule)) return true;
      continue;
    }
    if (host === rule || host.endsWith("." + rule)) return true;
  }
  return false;
}
