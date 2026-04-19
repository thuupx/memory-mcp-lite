import { defineConfig } from "drizzle-kit";
import path from "path";
import os from "os";

const dbPath =
  process.env.MEMORY_DB_PATH ??
  path.join(
    process.env.MEMORY_DATA_DIR ?? path.join(os.homedir(), ".memory-mcp"),
    "memory.db",
  );

export default defineConfig({
  dialect: "sqlite",
  schema: "./apps/server/src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: `file:${dbPath}`,
  },
});
