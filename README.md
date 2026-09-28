# dsh-proxy

[简体中文](README.zh.md) | English

Route **DeepSeek Harness host-side fetch** (LLM calls, model discovery, plugin market, web search) through a local HTTP/HTTPS proxy such as Clash / mihomo / v2ray. **No TUN mode**, and no system proxy required.

Built for DSH **0.1.2-rc.1** and the [dsh-market](https://github.com/dsh-market/dsh-market) plugin layout.

> **0.4.0 fix**: DSH 0.1.2 changed the client module contract to `factory(require) => exports` (was `factory(module, exports, require)`) and dropped the `dsh-client-runtime` / `dsh-client-ui-slots` packages. 0.3.x fails to load on both counts; 0.4.0 follows the new contract.

## Why this plugin

DSH Desktop / Web issues LLM traffic from the host Node process using global `fetch`:

- Windows / macOS system proxy settings do not apply
- `HTTPS_PROXY` does not apply to Node global fetch
- DSH has no built-in proxy setting

When an API is blocked by Cloudflare IP reputation, or only reachable via a proxy, this plugin wraps host `fetch` with undici `ProxyAgent`. Clash rule mode still decides what is direct vs proxied.

## Install

From the Plugin Market, search **dsh-proxy**, or from a terminal:

```bash
dsh plugin --profile web add github:BuLongY/dsh-proxy
```

Restart the DSH Web Host, then refresh the page.

The published package ships prebuilt `lib/` files. GitHub installs do **not** need `pnpm approve-builds` / `prepare`.

## Setup

1. Start Clash / mihomo / v2ray with mixed / HTTP port (default `7890`).
2. Open DSH **Settings → HTTP proxy**.
3. Set host / port (or leave `127.0.0.1:7890`), keep Enable on.
4. Optional: edit Direct hosts (`localhost, 127.0.0.1, ::1` by default).
5. Reload models or send a chat. Traffic now leaves through the proxy.

Settings persist in DSH `settings.yaml` under `dsh-proxy:` and apply live.

## Compatibility

| Piece | Requirement |
| --- | --- |
| DSH | `0.1.2-rc.1` and later hosts that still expose `ctx.settings.register` and `settings.section` |
| Profile | `web` |
| Node | `>= 20` |
| Market | `dsh.bundle.patch`, bilingual README, prebuilt client factory, no `prepare` script |

The 0.3.x line replaced the old `installSettingsSection` + `settings.plugin.item` APIs that broke after DSH 0.1.1.

## Implementation (0.4.0)

The host half no longer swaps global `fetch` for an undici one. It keeps **Node's native fetch** and attaches an undici `dispatcher` to each request:

- Proxy-matching hosts use a `ProxyAgent`; `noProxy` hosts use an explicit `Agent` (direct).
- Native `Request` / `Response`, streaming, and error semantics are preserved so SDK type checks keep working.
- Unloading the plugin restores the exact original `fetch`.

The client settings page registers into `settings.section` and depends on the `settingsScope`, `slots`, and `locale` services.

## Desktop note

If a desktop profile fails to load because of one bad plugin, the app enters the **safe profile** and purges every user plugin from it at startup (`SAFE_MODE_PLUGIN_PURGE` in the log). The symptom is plugins that keep disappearing and cannot be installed.

`dsh-proxy` 0.4.0 does not trigger this by itself; other plugins in the same profile can, and should be checked first.

## License

MIT
