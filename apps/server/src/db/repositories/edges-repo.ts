import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { memoryEdges } from "../schema";
import type { MemoryEdge } from "../../types/memory";

export async function insertEdge(edge: MemoryEdge): Promise<void> {
  await db
    .insert(memoryEdges)
    .values(edge)
    .onConflictDoUpdate({
      target: [memoryEdges.from_id, memoryEdges.to_id, memoryEdges.relation],
      set: { metadata_json: edge.metadata_json },
    });
}

export async function getEdgesFrom(fromId: string): Promise<MemoryEdge[]> {
  const rows = await db
    .select()
    .from(memoryEdges)
    .where(eq(memoryEdges.from_id, fromId));
  return rows as MemoryEdge[];
}

export async function getEdgesTo(toId: string): Promise<MemoryEdge[]> {
  const rows = await db
    .select()
    .from(memoryEdges)
    .where(eq(memoryEdges.to_id, toId));
  return rows as MemoryEdge[];
}

export async function deleteEdge(
  fromId: string,
  toId: string,
  relation: string,
): Promise<void> {
  await db
    .delete(memoryEdges)
    .where(
      and(
        eq(memoryEdges.from_id, fromId),
        eq(memoryEdges.to_id, toId),
        eq(memoryEdges.relation, relation),
      ),
    );
}
