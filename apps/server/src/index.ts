import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server";
import { initDb, closeDb } from "./db/client";
import { ensureSchema } from "./db/migrate";
import { env } from "./config/env";

async function main(): Promise<void> {
  ensureSchema(env.dbPath);
  await initDb();

  const server = createServer();
  const transport = new StdioServerTransport();

  process.on("SIGINT", async () => {
    await closeDb();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closeDb();
    process.exit(0);
  });

  await server.connect(transport);
  process.stderr.write("memory-mcp-lite: server started\n");
}

main().catch((err: unknown) => {
  process.stderr.write(`memory-mcp-lite: fatal error: ${String(err)}\n`);
  process.exit(1);
});
