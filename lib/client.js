window.__ModuleLoader__.load({
  id: "dsh-proxy",
  factory: function (require) {
var module = { exports: {} };
var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");

// src/shared.ts
var NS = "dsh-proxy";

// src/client.tsx
var name = "dsh-proxy";
var inject = ["settingsScope", "slots", "locale"];
var SLOT = "settings.section";
var SLOT_ID = "dsh-proxy";
var SLOT_ORDER = 85;
var zh = {
  nav: "HTTP \u4EE3\u7406",
  title: "HTTP \u4EE3\u7406",
  intro: "\u8BA9 DSH \u5BBF\u4E3B\u8FDB\u7A0B\u7684 fetch\uFF08LLM\u3001\u6A21\u578B\u53D1\u73B0\u3001\u63D2\u4EF6\u5E02\u573A\u3001\u8054\u7F51\u641C\u7D22\uFF09\u8D70\u672C\u5730 HTTP \u4EE3\u7406\uFF0C\u65E0\u9700\u5F00\u542F TUN\u3002",
  enabled: "\u542F\u7528\u4EE3\u7406",
  host: "\u4EE3\u7406\u4E3B\u673A",
  port: "\u4EE3\u7406\u7AEF\u53E3",
  noProxy: "\u76F4\u8FDE\u4E3B\u673A",
  noProxyHint: "\u9017\u53F7\u5206\u9694\u3002\u5339\u914D\u8BE5\u5217\u8868\u7684\u4E3B\u673A\u4E0D\u8D70\u4EE3\u7406\uFF0C\u4F8B\u5982 localhost, 127.0.0.1",
  hint: "\u6539\u5B8C\u4F1A\u7ACB\u523B\u5199\u5165\u8BBE\u7F6E\u5E76\u4F5C\u7528\u4E8E\u5BBF\u4E3B fetch\u3002\u8BF7\u786E\u8BA4 Clash / mihomo / v2ray \u5DF2\u5728\u8BE5\u5730\u5740\u76D1\u542C\u3002"
};
var en = {
  nav: "HTTP proxy",
  title: "HTTP proxy",
  intro: "Send DeepSeek Harness host-side fetch (LLM, model discovery, market, web search) through a local HTTP proxy without TUN mode.",
  enabled: "Enable proxy",
  host: "Proxy host",
  port: "Proxy port",
  noProxy: "Direct hosts",
  noProxyHint: "Comma-separated. Matching hosts bypass the proxy, e.g. localhost, 127.0.0.1",
  hint: "Changes persist immediately and apply to host fetch. Make sure Clash / mihomo / v2ray is listening on this address."
};
function defaults(value) {
  return {
    enabled: value?.enabled !== false,
    host: value?.host?.trim() || "127.0.0.1",
    port: Number.isFinite(Number(value?.port)) ? Number(value?.port) : 7890,
    noProxy: (value?.noProxy ?? ["localhost", "127.0.0.1", "::1"]).join(", ")
  };
}
function parseNoProxy(raw) {
  return raw.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}
var card = { display: "flex", flexDirection: "column", gap: 12, maxWidth: 560 };
var field = { display: "flex", flexDirection: "column", gap: 6 };
var row = { display: "flex", alignItems: "center", gap: 8 };
var hint = { opacity: 0.72, fontSize: 12, lineHeight: 1.5 };
function useScopeValue(scope) {
  const [snap, setSnap] = (0, import_react.useState)(() => scope.getSnapshot());
  (0, import_react.useEffect)(() => scope.subscribe(() => setSnap(scope.getSnapshot())), [scope]);
  return snap;
}
function ProxySection({ scope, t }) {
  const snap = useScopeValue(scope);
  const value = defaults(snap.value);
  const [host, setHost] = (0, import_react.useState)(value.host);
  const [port, setPort] = (0, import_react.useState)(String(value.port));
  const [noProxy, setNoProxy] = (0, import_react.useState)(value.noProxy);
  (0, import_react.useEffect)(() => {
    setHost(value.host);
    setPort(String(value.port));
    setNoProxy(value.noProxy);
  }, [value.host, value.port, value.noProxy]);
  const ready = snap.status === "ready" || snap.value !== void 0;
  return (0, import_react.createElement)(
    "section",
    { style: card },
    (0, import_react.createElement)("h2", { style: { margin: 0, fontSize: 18 } }, t("title")),
    (0, import_react.createElement)("p", { style: hint }, t("intro")),
    (0, import_react.createElement)(
      "label",
      { style: row },
      (0, import_react.createElement)("input", {
        type: "checkbox",
        checked: value.enabled,
        disabled: !ready,
        onChange: (event) => {
          void scope.set("enabled", event.target.checked);
        }
      }),
      (0, import_react.createElement)("span", null, t("enabled"))
    ),
    (0, import_react.createElement)(
      "label",
      { style: field },
      (0, import_react.createElement)("span", null, t("host")),
      (0, import_react.createElement)("input", {
        value: host,
        disabled: !ready,
        onChange: (event) => setHost(event.target.value),
        onBlur: () => {
          const next = host.trim() || "127.0.0.1";
          setHost(next);
          void scope.set("host", next);
        }
      })
    ),
    (0, import_react.createElement)(
      "label",
      { style: field },
      (0, import_react.createElement)("span", null, t("port")),
      (0, import_react.createElement)("input", {
        type: "number",
        min: 1,
        max: 65535,
        value: port,
        disabled: !ready,
        onChange: (event) => setPort(event.target.value),
        onBlur: () => {
          const next = Number(port);
          const safe = Number.isFinite(next) && next > 0 ? Math.trunc(next) : 7890;
          setPort(String(safe));
          void scope.set("port", safe);
        }
      })
    ),
    (0, import_react.createElement)(
      "label",
      { style: field },
      (0, import_react.createElement)("span", null, t("noProxy")),
      (0, import_react.createElement)("input", {
        value: noProxy,
        disabled: !ready,
        onChange: (event) => setNoProxy(event.target.value),
        onBlur: () => {
          const list = parseNoProxy(noProxy);
          setNoProxy(list.join(", "));
          void scope.set("noProxy", list);
        }
      }),
      (0, import_react.createElement)("span", { style: hint }, t("noProxyHint"))
    ),
    (0, import_react.createElement)("p", { style: hint }, t("hint"))
  );
}
function apply(ctx) {
  const slots = ctx.get("slots");
  const settingsScope = ctx.get("settingsScope");
  const locale = ctx.get("locale");
  if (!slots || !settingsScope || !locale) return;
  ctx.effect(() => locale.register(NS, { zh, en }), "dsh-proxy: dictionaries");
  const t = locale.bind(NS);
  const scope = settingsScope.bind({ namespace: NS });
  slots.inject(
    SLOT,
    () => slots.register(
      {
        name: SLOT,
        id: SLOT_ID,
        order: SLOT_ORDER,
        locale: NS,
        label: () => t("nav")
      },
      () => (0, import_react.createElement)(ProxySection, { scope, t })
    )
  );
}

return module.exports;
  }
});
