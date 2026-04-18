/**
 * Schema reference for Memory MCP Lite.
 *
 * The relational tables (projects, memory_nodes, memory_closure, memory_edges)
 * are managed by Prisma 7 via prisma/schema.prisma and prisma.config.ts.
 * Run `npm run db:push` or `npm run db:migrate` to sync them.
 *
 * The FTS5 virtual table below is NOT managed by Prisma (it does not support
 * virtual tables). It is created at server startup via initDb() in db/client.ts.
 */
export const FTS5_INIT_SQL = /* sql */ `
  CREATE VIRTUAL TABLE IF NOT EXISTS memory_search_index USING fts5(
    node_id UNINDEXED,
    title,
    summary,
    content,
    tokenize='porter ascii'
  )
`;

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
