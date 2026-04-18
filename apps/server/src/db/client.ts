import { PrismaClient } from "../generated/prisma/index";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";
import { env } from "../config/env";
import { GLOBAL_PROJECT_ID } from "../config/constants";
import { nowIso } from "../utils/time";

function createClient(): PrismaClient {
  const dbDir = path.dirname(env.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const adapter = new PrismaBetterSqlite3({ url: `file:${env.dbPath}` });
  return new PrismaClient({ adapter });
}

export const client = createClient();

export async function initDb(): Promise<void> {
  const existing = await client.project.findUnique({
    where: { id: GLOBAL_PROJECT_ID },
  });
  if (!existing) {
    const now = nowIso();
    await client.project.create({
      data: {
        id: GLOBAL_PROJECT_ID,
        scope_path: GLOBAL_PROJECT_ID,
        git_root: null,
        remote_url: null,
        repo_name: null,
        display_name: "Global",
        created_at: now,
        updated_at: now,
      },
    });
  }
}

export async function closeDb(): Promise<void> {
  await client.$disconnect();
}
