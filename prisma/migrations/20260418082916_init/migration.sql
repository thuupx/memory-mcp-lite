-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope_path" TEXT NOT NULL,
    "git_root" TEXT,
    "remote_url" TEXT,
    "repo_name" TEXT,
    "display_name" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "memory_nodes" (
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

-- CreateTable
CREATE TABLE "memory_closure" (
    "ancestor_id" TEXT NOT NULL,
    "descendant_id" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,

    PRIMARY KEY ("ancestor_id", "descendant_id"),
    CONSTRAINT "memory_closure_ancestor_id_fkey" FOREIGN KEY ("ancestor_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memory_closure_descendant_id_fkey" FOREIGN KEY ("descendant_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "memory_edges" (
    "from_id" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "metadata_json" TEXT,

    PRIMARY KEY ("from_id", "to_id", "relation"),
    CONSTRAINT "memory_edges_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memory_edges_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "memory_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create FTS5 virtual table for search
CREATE VIRTUAL TABLE IF NOT EXISTS memory_search_index USING fts5(
    node_id UNINDEXED,
    title,
    summary,
    content,
    tokenize='porter ascii'
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_scope_path_key" ON "projects"("scope_path");

-- CreateIndex
CREATE UNIQUE INDEX "projects_git_root_key" ON "projects"("git_root");

-- CreateIndex
CREATE UNIQUE INDEX "projects_remote_url_key" ON "projects"("remote_url");

-- CreateIndex
CREATE INDEX "memory_nodes_project_id_idx" ON "memory_nodes"("project_id");

-- CreateIndex
CREATE INDEX "memory_nodes_parent_id_idx" ON "memory_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "memory_nodes_memory_type_idx" ON "memory_nodes"("memory_type");

-- CreateIndex
CREATE INDEX "memory_nodes_level_idx" ON "memory_nodes"("level");

-- CreateIndex
CREATE INDEX "memory_nodes_status_idx" ON "memory_nodes"("status");

-- CreateIndex
CREATE INDEX "memory_closure_descendant_id_idx" ON "memory_closure"("descendant_id");
