import path from "path";
import os from "os";

function resolveDbPath(): string {
  if (process.env.MEMORY_DB_PATH) {
    return process.env.MEMORY_DB_PATH;
  }
  const dataDir =
    process.env.MEMORY_DATA_DIR ?? path.join(os.homedir(), ".memory-mcp");
  return path.join(dataDir, "memory.db");
}

export const env = {
  dbPath: resolveDbPath(),
  logLevel: (process.env.LOG_LEVEL ?? "info") as
    | "debug"
    | "info"
    | "warn"
    | "error",
  serverName: process.env.SERVER_NAME ?? "memory-mcp-lite",
  serverVersion: "0.1.0",
} as const;
