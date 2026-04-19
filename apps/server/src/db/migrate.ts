import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const SCHEMA_SQL = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope_path" TEXT NOT NULL,
    "git_root" TEXT,
    "remote_url" TEXT,
    "repo_name" TEXT,
    "display_name" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "memory_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "level" TEXT NOT NULL,
    "memory_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "importance" REAL NOT NULL DEFAULT 0.5,
    "source" TEXT,
    "metadata_json" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "memory_nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memory_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "memory_nodes" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "memory_closure" (
    "ancestor_id" TEXT NOT NULL,
    "descendant_id" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    PRIMARY KEY ("ancestor_id", "descendant_id"),
    CONSTRAINT "memory_closure_ancestor_id_fkey" FOREIGN KEY ("ancestor_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memory_closure_descendant_id_fkey" FOREIGN KEY ("descendant_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "memory_edges" (
    "from_id" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "metadata_json" TEXT,
    PRIMARY KEY ("from_id", "to_id", "relation"),
    CONSTRAINT "memory_edges_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memory_edges_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE VIRTUAL TABLE IF NOT EXISTS memory_search_index USING fts5(
    node_id UNINDEXED,
    title,
    summary,
    content,
    tokenize='porter ascii'
);

CREATE UNIQUE INDEX IF NOT EXISTS "projects_scope_path_key" ON "projects"("scope_path");
CREATE UNIQUE INDEX IF NOT EXISTS "projects_git_root_key" ON "projects"("git_root");
CREATE UNIQUE INDEX IF NOT EXISTS "projects_remote_url_key" ON "projects"("remote_url");
CREATE INDEX IF NOT EXISTS "memory_nodes_project_id_idx" ON "memory_nodes"("project_id");
CREATE INDEX IF NOT EXISTS "memory_nodes_parent_id_idx" ON "memory_nodes"("parent_id");
CREATE INDEX IF NOT EXISTS "memory_nodes_memory_type_idx" ON "memory_nodes"("memory_type");
CREATE INDEX IF NOT EXISTS "memory_nodes_level_idx" ON "memory_nodes"("level");
CREATE INDEX IF NOT EXISTS "memory_nodes_status_idx" ON "memory_nodes"("status");
CREATE INDEX IF NOT EXISTS "memory_closure_descendant_id_idx" ON "memory_closure"("descendant_id");
`;

export function ensureSchema(dbPath: string): void {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const db = new Database(dbPath);
  try {
    db.exec(SCHEMA_SQL);
  } finally {
    db.close();
  }
}
