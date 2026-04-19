import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { env } from "../config/env";
import { GLOBAL_PROJECT_ID } from "../config/constants";
import { nowIso } from "../utils/time";
import * as schema from "./schema";

function resolveLibsqlUrl(dbPath: string): string {
  if (/^(libsql|http|https|ws|wss):\/\//i.test(dbPath)) {
    return dbPath;
  }
  if (dbPath.startsWith("file:") || dbPath === ":memory:") {
    return dbPath;
  }
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return `file:${dbPath}`;
}

function createLibsql(): Client {
  const authToken = env.dbAuthToken ?? undefined;
  return createClient({ url: resolveLibsqlUrl(env.dbPath), authToken });
}

export const libsql: Client = createLibsql();
export const db = drizzle({ client: libsql, schema });
export type DB = typeof db;

export async function initDb(): Promise<void> {
  const existing = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, GLOBAL_PROJECT_ID))
    .limit(1);

  if (existing.length === 0) {
    const now = nowIso();
    await db.insert(schema.projects).values({
      id: GLOBAL_PROJECT_ID,
      scope_path: GLOBAL_PROJECT_ID,
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: "Global",
      created_at: now,
      updated_at: now,
    });
  }
}

export async function closeDb(): Promise<void> {
  libsql.close();
}
