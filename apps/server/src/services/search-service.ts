import { client } from "../db/client";
import { Prisma } from "../generated/prisma/index";
import type { LightSearchResult, DetailOutput } from "../types/tool";
import { getMemoryNodeById } from "../db/repositories/nodes-repo";
import { LIGHT_SEARCH_LIMIT } from "../config/constants";

function sanitizeFtsQuery(query: string): string {
  return query
    .replace(/["'*()\-^]/g, " ")
    .replace(/\b(AND|OR|NOT)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFtsQuery(query: string): string {
  return sanitizeFtsQuery(query)
    .split(" ")
    .filter(Boolean)
    .map((w) => `${w}*`)
    .join(" ");
}

export async function searchMemoryLight(
  query: string,
  projectId?: string,
  limit: number = LIGHT_SEARCH_LIMIT,
): Promise<LightSearchResult[]> {
  const safeQuery = sanitizeFtsQuery(query);
  if (!safeQuery) return [];

  const ftsQuery = buildFtsQuery(safeQuery);
  const projectFilter = projectId
    ? Prisma.sql`AND n.project_id = ${projectId}`
    : Prisma.empty;

  return client.$queryRaw<LightSearchResult[]>`
    SELECT n.id, n.title, n.summary, n.memory_type, n.level, n.importance, n.updated_at
    FROM memory_search_index fts
    JOIN memory_nodes n ON n.id = fts.node_id
    WHERE memory_search_index MATCH ${ftsQuery}
      AND n.status = 'active'
      AND n.memory_type NOT IN ('global_summary', 'project_summary', 'task_summary')
      ${projectFilter}
    ORDER BY rank, n.importance DESC
    LIMIT ${limit}
  `;
}

export async function getMemoryDetail(
  id: string,
): Promise<DetailOutput | null> {
  const node = await getMemoryNodeById(id);
  if (!node) return null;

  let metadata: Record<string, unknown> | null = null;
  if (node.metadata_json) {
    try {
      metadata = JSON.parse(node.metadata_json) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }

  return {
    id: node.id,
    title: node.title,
    summary: node.summary,
    content: node.content,
    memory_type: node.memory_type,
    level: node.level,
    importance: node.importance,
    source: node.source,
    metadata,
    created_at: node.created_at,
    updated_at: node.updated_at,
  };
}
