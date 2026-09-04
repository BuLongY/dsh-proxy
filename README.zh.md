# dsh-proxy

[English](README.md) | 简体中文

为 **DeepSeek Harness 宿主 fetch**（LLM 请求、模型发现、插件市场、联网搜索）注入自定义 HTTP/HTTPS 代理（Clash / mihomo / v2ray 等）。**无需 TUN**，也不依赖系统代理。

面向 DSH **0.1.1-rc.2**，并按 [dsh-market](https://github.com/dsh-market/dsh-market) 的插件契约打包。

## 为什么需要它

DSH 桌面端 / Web 端的 LLM 请求由宿主 Node 进程发出，走全局 `fetch`：

- 不读系统代理（Windows 设置、Clash「系统代理」对它无效）
- 不读 `HTTPS_PROXY` 等环境变量
- DSH 自身没有代理选项

某个 API 被 Cloudflare 按 IP 拦截、或必须经代理才能访问时，本插件把宿主 `fetch` 换成带 undici `ProxyAgent` 的实现。Clash 规则模式继续分流。

## 安装

在插件市场搜索 **dsh-proxy**，或在终端执行：

```bash
dsh plugin --profile web add github:BuLongY/dsh-proxy
```

然后重启 DSH Web Host，再刷新页面。

发布包带预编译 `lib/`，从 GitHub 安装时**不需要** `pnpm approve-builds` / `prepare`。

## 使用

1. 先启动 Clash / mihomo / v2ray，打开 mixed / HTTP 端口（默认 `7890`）。
2. 打开 DSH **设置 → HTTP 代理**。
3. 填写主机和端口（可保持 `127.0.0.1:7890`），保持「启用代理」。
4. 可选：编辑直连主机（默认 `localhost, 127.0.0.1, ::1`）。
5. 重新拉模型或发一条对话，流量就会走代理。

配置写在 DSH `settings.yaml` 的 `dsh-proxy:` 段，修改后立即生效。

## 兼容

| 项目 | 要求 |
| --- | --- |
| DSH | `0.1.1-rc.2` 以及仍提供 `ctx.settings.register` 与 `settings.section` 的后续版本 |
| Profile | `web` |
| Node | `>= 20` |
| 市场 | `dsh.bundle.patch`、中英 README、预编译 client factory、无 `prepare` 脚本 |

0.3.x 替换了旧版已经失效的 `installSettingsSection` 和 `settings.plugin.item`。

## License

MIT
