import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tmp = mkdtempSync(join(tmpdir(), "memory-mcp-smoke-"));
const dbPath = join(tmp, "memory.db");

const child = spawn(process.execPath, ["dist/index.js"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, MEMORY_DB_PATH: dbPath },
});

let buffer = "";
const pending = new Map();
let nextId = 1;

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {
      /* ignore */
    }
  }
});

child.stderr.on("data", (c) => process.stderr.write(`[srv] ${c}`));

function send(method, params) {
  const id = nextId++;
  const req = { jsonrpc: "2.0", id, method, params };
  return new Promise((resolve, reject) => {
    pending.set(id, (msg) => {
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    });
    child.stdin.write(JSON.stringify(req) + "\n");
  });
}

function notify(method, params) {
  child.stdin.write(
    JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n",
  );
}

async function run() {
  await send("initialize", {
    protocolVersion: "2025-06-18",
    clientInfo: { name: "smoke", version: "0" },
    capabilities: {},
  });
  notify("notifications/initialized");

  const tools = await send("tools/list", {});
  console.log(`tools: ${tools.tools.length}`);
  for (const t of tools.tools) {
    const keys = Object.keys(t.inputSchema?.properties ?? {});
    const outKeys = Object.keys(t.outputSchema?.properties ?? {});
    console.log(
      `  - ${t.name} :: in=${keys.join(",") || "-"} :: out=${outKeys.join(",") || "-"} :: readOnly=${t.annotations?.readOnlyHint ?? "?"}`,
    );
  }

  const r1 = await send("tools/call", {
    name: "upsert_project_summary",
    arguments: {
      workspace_path: process.cwd(),
      title: "Smoke project",
      summary: "Drizzle+libSQL smoke test",
    },
  });
  console.log("upsert_project_summary:", JSON.stringify(r1.structuredContent));

  const r2 = await send("tools/call", {
    name: "remember_fact",
    arguments: {
      workspace_path: process.cwd(),
      title: "Build command",
      summary: "npm run build bundles with esbuild",
      fact_type: "command",
    },
  });
  console.log("remember_fact:", JSON.stringify(r2.structuredContent));

  const r3 = await send("tools/call", {
    name: "get_project_summary",
    arguments: { workspace_path: process.cwd() },
  });
  console.log("get_project_summary:", JSON.stringify(r3.structuredContent));

  const r4 = await send("tools/call", {
    name: "search_memory_light",
    arguments: {
      workspace_path: process.cwd(),
      query: "build",
      limit: 5,
    },
  });
  console.log("search_memory_light:", JSON.stringify(r4.structuredContent));

  if (r4.structuredContent.results.length > 0) {
    const id = r4.structuredContent.results[0].id;
    const r5 = await send("tools/call", {
      name: "get_memory_detail",
      arguments: { id },
    });
    console.log(
      "get_memory_detail.found:",
      r5.structuredContent.found,
      "title:",
      r5.structuredContent.memory?.title,
    );
  }

  console.log("SMOKE OK");
  child.kill("SIGTERM");
}

run()
  .catch((e) => {
    console.error("SMOKE FAIL", e);
    child.kill("SIGTERM");
    process.exitCode = 1;
  })
  .finally(() => rmSync(tmp, { recursive: true, force: true }));
