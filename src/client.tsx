import { createElement, useEffect, useState, type CSSProperties, type ReactElement } from "react";
import type { ClientContext } from "./client-context.js";
import { NS, type ProxyConfig } from "./shared.js";

export const name = "dsh-proxy";
/**
 * DSH 0.1.2 resolves `dsh.client.inject` (package ids) for module arrival, then
 * cordis injects the services these packages provide. The service names are the
 * ones the ui-settings, ui-renderer and locale plugins actually register.
 */
export const inject = ["settingsScope", "slots", "locale"];

const SLOT = "settings.section";
const SLOT_ID = "dsh-proxy";
const SLOT_ORDER = 85;

const zh = {
  nav: "HTTP 代理",
  title: "HTTP 代理",
  intro: "让 DSH 宿主进程的 fetch（LLM、模型发现、插件市场、联网搜索）走本地 HTTP 代理，无需开启 TUN。",
  enabled: "启用代理",
  host: "代理主机",
  port: "代理端口",
  noProxy: "直连主机",
  noProxyHint: "逗号分隔。匹配该列表的主机不走代理，例如 localhost, 127.0.0.1",
  hint: "改完会立刻写入设置并作用于宿主 fetch。请确认 Clash / mihomo / v2ray 已在该地址监听。",
};

const en = {
  nav: "HTTP proxy",
  title: "HTTP proxy",
  intro: "Send DeepSeek Harness host-side fetch (LLM, model discovery, market, web search) through a local HTTP proxy without TUN mode.",
  enabled: "Enable proxy",
  host: "Proxy host",
  port: "Proxy port",
  noProxy: "Direct hosts",
  noProxyHint: "Comma-separated. Matching hosts bypass the proxy, e.g. localhost, 127.0.0.1",
  hint: "Changes persist immediately and apply to host fetch. Make sure Clash / mihomo / v2ray is listening on this address.",
};

type LocaleTable = typeof en;
type Translate = (key: keyof LocaleTable) => string;

type SettingsSnapshot = {
  status?: string;
  value?: ProxyConfig;
};

type SettingsScope = {
  getSnapshot(): SettingsSnapshot;
  subscribe(listener: () => void): () => void;
  set(field: string, value: unknown): Promise<void>;
};

type SettingsScopeService = {
  bind(spec: { namespace: string }): SettingsScope;
};

function defaults(value: ProxyConfig | undefined): {
  enabled: boolean;
  host: string;
  port: number;
  noProxy: string;
} {
  return {
    enabled: value?.enabled !== false,
    host: value?.host?.trim() || "127.0.0.1",
    port: Number.isFinite(Number(value?.port)) ? Number(value?.port) : 7890,
    noProxy: (value?.noProxy ?? ["localhost", "127.0.0.1", "::1"]).join(", "),
  };
}

function parseNoProxy(raw: string): string[] {
  return raw.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

const card: CSSProperties = { display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 };
const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const row: CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const hint: CSSProperties = { opacity: 0.72, fontSize: 12, lineHeight: 1.5 };

function useScopeValue(scope: SettingsScope): SettingsSnapshot {
  const [snap, setSnap] = useState(() => scope.getSnapshot());
  useEffect(() => scope.subscribe(() => setSnap(scope.getSnapshot())), [scope]);
  return snap;
}

function ProxySection({ scope, t }: { scope: SettingsScope; t: Translate }): ReactElement {
  const snap = useScopeValue(scope);
  const value = defaults(snap.value);
  const [host, setHost] = useState(value.host);
  const [port, setPort] = useState(String(value.port));
  const [noProxy, setNoProxy] = useState(value.noProxy);
  useEffect(() => {
    setHost(value.host);
    setPort(String(value.port));
    setNoProxy(value.noProxy);
  }, [value.host, value.port, value.noProxy]);
  const ready = snap.status === "ready" || snap.value !== undefined;

  return createElement(
    "section",
    { style: card },
    createElement("h2", { style: { margin: 0, fontSize: 18 } }, t("title")),
    createElement("p", { style: hint }, t("intro")),
    createElement(
      "label",
      { style: row },
      createElement("input", {
        type: "checkbox",
        checked: value.enabled,
        disabled: !ready,
        onChange: (event: { target: { checked: boolean } }) => {
          void scope.set("enabled", event.target.checked);
        },
      }),
      createElement("span", null, t("enabled")),
    ),
    createElement(
      "label",
      { style: field },
      createElement("span", null, t("host")),
      createElement("input", {
        value: host,
        disabled: !ready,
        onChange: (event: { target: { value: string } }) => setHost(event.target.value),
        onBlur: () => {
          const next = host.trim() || "127.0.0.1";
          setHost(next);
          void scope.set("host", next);
        },
      }),
    ),
    createElement(
      "label",
      { style: field },
      createElement("span", null, t("port")),
      createElement("input", {
        type: "number",
        min: 1,
        max: 65535,
        value: port,
        disabled: !ready,
        onChange: (event: { target: { value: string } }) => setPort(event.target.value),
        onBlur: () => {
          const next = Number(port);
          const safe = Number.isFinite(next) && next > 0 ? Math.trunc(next) : 7890;
          setPort(String(safe));
          void scope.set("port", safe);
        },
      }),
    ),
    createElement(
      "label",
      { style: field },
      createElement("span", null, t("noProxy")),
      createElement("input", {
        value: noProxy,
        disabled: !ready,
        onChange: (event: { target: { value: string } }) => setNoProxy(event.target.value),
        onBlur: () => {
          const list = parseNoProxy(noProxy);
          setNoProxy(list.join(", "));
          void scope.set("noProxy", list);
        },
      }),
      createElement("span", { style: hint }, t("noProxyHint")),
    ),
    createElement("p", { style: hint }, t("hint")),
  );
}

export function apply(ctx: ClientContext): void {
  const slots = ctx.get("slots") as {
    inject: (name: string, factory: () => unknown) => void;
    register: (
      meta: { name: string; id: string; order: number; locale: string; label: () => string },
      render: () => ReactElement,
    ) => unknown;
  } | undefined;
  const settingsScope = ctx.get("settingsScope") as SettingsScopeService | undefined;
  const locale = ctx.get("locale") as {
    register: (ns: string, tables: { zh: LocaleTable; en: LocaleTable }) => () => void;
    bind: (ns: string) => Translate;
  } | undefined;
  if (!slots || !settingsScope || !locale) return;

  ctx.effect(() => locale.register(NS, { zh, en }), "dsh-proxy: dictionaries");
  const t = locale.bind(NS);
  const scope = settingsScope.bind({ namespace: NS });

  slots.inject(SLOT, () =>
    slots.register(
      {
        name: SLOT,
        id: SLOT_ID,
        order: SLOT_ORDER,
        locale: NS,
        label: () => t("nav"),
      },
      () => createElement(ProxySection, { scope, t }),
    ),
  );
}
