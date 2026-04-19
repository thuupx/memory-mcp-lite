import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { memoryNodes } from "../db/schema";
import type { MemoryEdge } from "../types/memory";
import type { LightSearchResult } from "../types/tool";
import {
  insertEdge,
  getEdgesFrom,
  getEdgesTo,
  deleteEdge,
} from "../db/repositories/edges-repo";
import { EDGE_RELATIONS, type EdgeRelation } from "../db/schema";

export { EDGE_RELATIONS };
export type { EdgeRelation };

export interface RelatedNode extends LightSearchResult {
  relation: string;
  direction: "from" | "to";
}

export async function addRelation(
  fromId: string,
  toId: string,
  relation: EdgeRelation,
  metadata?: Record<string, unknown>,
): Promise<MemoryEdge> {
  const edge: MemoryEdge = {
    from_id: fromId,
    to_id: toId,
    relation,
    metadata_json: metadata ? JSON.stringify(metadata) : null,
  };
  await insertEdge(edge);
  return edge;
}

export async function removeRelation(
  fromId: string,
  toId: string,
  relation: EdgeRelation,
): Promise<void> {
  await deleteEdge(fromId, toId, relation);
}

export async function getRelatedNodes(
  nodeId: string,
  relation?: EdgeRelation,
): Promise<RelatedNode[]> {
  const [outEdges, inEdges] = await Promise.all([
    getEdgesFrom(nodeId),
    getEdgesTo(nodeId),
  ]);

  const filtered = {
    out: relation ? outEdges.filter((e) => e.relation === relation) : outEdges,
    in: relation ? inEdges.filter((e) => e.relation === relation) : inEdges,
  };

  const targetIds = [
    ...filtered.out.map((e) => ({
      id: e.to_id,
      relation: e.relation,
      direction: "from" as const,
    })),
    ...filtered.in.map((e) => ({
      id: e.from_id,
      relation: e.relation,
      direction: "to" as const,
    })),
  ];

  if (targetIds.length === 0) return [];

  const nodeRows = await db
    .select({
      id: memoryNodes.id,
      title: memoryNodes.title,
      summary: memoryNodes.summary,
      memory_type: memoryNodes.memory_type,
      level: memoryNodes.level,
      importance: memoryNodes.importance,
      updated_at: memoryNodes.updated_at,
    })
    .from(memoryNodes)
    .where(
      and(
        inArray(
          memoryNodes.id,
          targetIds.map((t) => t.id),
        ),
        eq(memoryNodes.status, "active"),
      ),
    );

  const nodeMap = new Map(nodeRows.map((n) => [n.id, n]));

  return targetIds
    .map(({ id, relation: rel, direction }) => {
      const node = nodeMap.get(id);
      if (!node) return null;
      const result: RelatedNode = {
        id: node.id,
        title: node.title,
        summary: node.summary ?? null,
        memory_type: node.memory_type,
        level: node.level,
        importance: node.importance,
        updated_at: node.updated_at,
        relation: rel,
        direction,
      };
      return result;
    })
    .filter((n): n is RelatedNode => n !== null);
}

export async function getNodeEdges(
  nodeId: string,
): Promise<{ outgoing: MemoryEdge[]; incoming: MemoryEdge[] }> {
  const [outgoing, incoming] = await Promise.all([
    getEdgesFrom(nodeId),
    getEdgesTo(nodeId),
  ]);
  return { outgoing, incoming };
}

export async function findSupersededBy(nodeId: string): Promise<string | null> {
  const edges = await getEdgesTo(nodeId);
  const edge = edges.find((e) => e.relation === "supersedes");
  return edge ? edge.from_id : null;
}
