import { defineConfig } from "prisma/config";
import os from "os";
import path from "path";

const defaultDbPath = path.join(os.homedir(), ".memory-mcp", "memory.db");
const dbUrl = process.env.DATABASE_URL ?? `file:${defaultDbPath}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: dbUrl,
  },
});
