import path from "path";
import os from "os";
import pkg from "../../../../package.json" with { type: "json" };

function resolveDbPath(): string {
  if (process.env.MEMORY_DB_PATH) {
    return process.env.MEMORY_DB_PATH;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const dataDir =
    process.env.MEMORY_DATA_DIR ?? path.join(os.homedir(), ".memory-mcp");
  return path.join(dataDir, "memory.db");
}

export const env = {
  dbPath: resolveDbPath(),
  dbAuthToken: process.env.MEMORY_DB_AUTH_TOKEN ?? null,
  logLevel: (process.env.LOG_LEVEL ?? "info") as
    | "debug"
    | "info"
    | "warn"
    | "error",
  serverName: process.env.SERVER_NAME ?? "memory-mcp-lite",
  serverVersion: pkg.version,
} as const;
