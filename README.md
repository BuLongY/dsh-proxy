# dsh-proxy

[简体中文](README.zh.md) | English

Route **DeepSeek Harness host-side fetch** (LLM calls, model discovery, plugin market, web search) through a local HTTP/HTTPS proxy such as Clash / mihomo / v2ray. **No TUN mode**, and no system proxy required.

Built for DSH **0.1.1-rc.2** and the [dsh-market](https://github.com/dsh-market/dsh-market) plugin layout.

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
| DSH | `0.1.1-rc.2` and later `0.1.1` / `0.1.2` hosts that still expose `ctx.settings.register` and `settings.section` |
| Profile | `web` |
| Node | `>= 20` |
| Market | `dsh.bundle.patch`, bilingual README, prebuilt client factory, no `prepare` script |

This 0.3.x line replaces the old `installSettingsSection` + `settings.plugin.item` APIs that broke after DSH 0.1.1.

## License

MIT
