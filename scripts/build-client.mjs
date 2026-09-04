import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outfile = join(root, "lib", "client.js");

await mkdir(join(root, "lib"), { recursive: true });

await build({
  absWorkingDir: root,
  entryPoints: ["src/client.tsx"],
  outfile,
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: ["es2022"],
  jsx: "automatic",
  logLevel: "info",
  external: [
    "react",
    "react/jsx-runtime",
    "react-dom",
    "@deepseek-ai/dsh-client-runtime/client",
    "@deepseek-ai/dsh-client-runtime",
  ],
});

const body = await readFile(outfile, "utf8");
const wrapped = [
  "window.__ModuleLoader__.load({",
  '  id: "dsh-proxy",',
  "  factory: function (module, exports, require) {",
  body.replace(/^"use strict";\s*/m, ""),
  "return module.exports;",
  "  }",
  "});",
  "",
].join("\n");
await writeFile(outfile, wrapped);
const typesDir = join(root, "lib", "types");
await mkdir(typesDir, { recursive: true });
await writeFile(
  join(typesDir, "client.d.ts"),
  [
    'export declare const name: "dsh-proxy";',
    "export declare const inject: string[];",
    "export declare function apply(ctx: unknown): void;",
    "",
  ].join("\n"),
);
console.log("wrote", outfile);
