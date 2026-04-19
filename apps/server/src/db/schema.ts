import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Supported graph-lite edge relation types.
 */
export const EDGE_RELATIONS = [
  "related_to",
  "depends_on",
  "affects",
  "caused_by",
  "supersedes",
  "references",
] as const;

export type EdgeRelation = (typeof EDGE_RELATIONS)[number];

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    scope_path: text("scope_path").notNull(),
    git_root: text("git_root"),
    remote_url: text("remote_url"),
    repo_name: text("repo_name"),
    display_name: text("display_name"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => ({
    projects_scope_path_key: uniqueIndex("projects_scope_path_key").on(
      t.scope_path,
    ),
    projects_git_root_key: uniqueIndex("projects_git_root_key").on(t.git_root),
    projects_remote_url_key: uniqueIndex("projects_remote_url_key").on(
      t.remote_url,
    ),
  }),
);

export const memoryNodes = sqliteTable(
  "memory_nodes",
  {
    id: text("id").primaryKey(),
    project_id: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parent_id: text("parent_id"),
    level: text("level").notNull(),
    memory_type: text("memory_type").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    content: text("content"),
    status: text("status").notNull().default("active"),
    importance: real("importance").notNull().default(0.5),
    source: text("source"),
    metadata_json: text("metadata_json"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (t) => ({
    memory_nodes_project_id_idx: index("memory_nodes_project_id_idx").on(
      t.project_id,
    ),
    memory_nodes_parent_id_idx: index("memory_nodes_parent_id_idx").on(
      t.parent_id,
    ),
    memory_nodes_memory_type_idx: index("memory_nodes_memory_type_idx").on(
      t.memory_type,
    ),
    memory_nodes_level_idx: index("memory_nodes_level_idx").on(t.level),
    memory_nodes_status_idx: index("memory_nodes_status_idx").on(t.status),
  }),
);

export const memoryClosure = sqliteTable(
  "memory_closure",
  {
    ancestor_id: text("ancestor_id")
      .notNull()
      .references(() => memoryNodes.id, { onDelete: "cascade" }),
    descendant_id: text("descendant_id")
      .notNull()
      .references(() => memoryNodes.id, { onDelete: "cascade" }),
    depth: integer("depth").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ancestor_id, t.descendant_id] }),
    memory_closure_descendant_id_idx: index(
      "memory_closure_descendant_id_idx",
    ).on(t.descendant_id),
  }),
);

export const memoryEdges = sqliteTable(
  "memory_edges",
  {
    from_id: text("from_id")
      .notNull()
      .references(() => memoryNodes.id, { onDelete: "cascade" }),
    to_id: text("to_id")
      .notNull()
      .references(() => memoryNodes.id, { onDelete: "cascade" }),
    relation: text("relation").notNull(),
    metadata_json: text("metadata_json"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.from_id, t.to_id, t.relation] }),
  }),
);

export type ProjectRow = typeof projects.$inferSelect;
export type MemoryNodeRow = typeof memoryNodes.$inferSelect;
export type MemoryEdgeRow = typeof memoryEdges.$inferSelect;
