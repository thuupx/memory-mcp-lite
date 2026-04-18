import { build } from "esbuild";

await build({
  entryPoints: ["apps/server/src/index.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "esm",
  minify: true,
  external: ["@modelcontextprotocol/sdk", "better-sqlite3"],
  banner: {
    js: [
      "import { createRequire } from 'module';",
      "import { fileURLToPath } from 'url';",
      "import { dirname } from 'path';",
      "const require = createRequire(import.meta.url);",
      "const __filename = fileURLToPath(import.meta.url);",
      "const __dirname = dirname(__filename);",
    ].join("\n"),
  },
});
