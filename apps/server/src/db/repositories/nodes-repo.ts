import { and, desc, eq, sql } from "drizzle-orm";
import { db, libsql } from "../client";
import { memoryNodes } from "../schema";
import type { MemoryNode, MemoryCandidate } from "../../types/memory";

type NodeUpdate = Partial<
  Pick<
    MemoryNode,
    | "title"
    | "summary"
    | "content"
    | "status"
    | "importance"
    | "metadata_json"
    | "updated_at"
  >
>;

export async function insertMemoryNode(node: MemoryNode): Promise<void> {
  await db.insert(memoryNodes).values(node);
}

export async function updateMemoryNode(
  id: string,
  patch: NodeUpdate,
): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  await db.update(memoryNodes).set(patch).where(eq(memoryNodes.id, id));
}

export async function getMemoryNodeById(
  id: string,
): Promise<MemoryNode | null> {
  const rows = await db
    .select()
    .from(memoryNodes)
    .where(eq(memoryNodes.id, id))
    .limit(1);
  return (rows[0] as MemoryNode | undefined) ?? null;
}

export async function getMemoryNodesByProjectAndType(
  projectId: string,
  memoryType: string,
): Promise<MemoryNode[]> {
  const rows = await db
    .select()
    .from(memoryNodes)
    .where(
      and(
        eq(memoryNodes.project_id, projectId),
        eq(memoryNodes.memory_type, memoryType),
        eq(memoryNodes.status, "active"),
      ),
    )
    .orderBy(desc(memoryNodes.updated_at));
  return rows as MemoryNode[];
}

export async function getChildNodes(
  parentId: string,
): Promise<MemoryCandidate[]> {
  const rows = await db
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
        eq(memoryNodes.parent_id, parentId),
        eq(memoryNodes.status, "active"),
      ),
    )
    .orderBy(desc(memoryNodes.importance));
  return rows as MemoryCandidate[];
}

export async function insertClosureRows(
  nodeId: string,
  parentId: string | null,
): Promise<void> {
  await db.run(sql`
    INSERT OR IGNORE INTO memory_closure (ancestor_id, descendant_id, depth)
    VALUES (${nodeId}, ${nodeId}, 0)
  `);

  if (parentId) {
    await db.run(sql`
      INSERT OR IGNORE INTO memory_closure (ancestor_id, descendant_id, depth)
      SELECT ancestor_id, ${nodeId}, depth + 1
      FROM memory_closure WHERE descendant_id = ${parentId}
    `);
  }
}

export async function getAncestors(nodeId: string): Promise<MemoryNode[]> {
  const result = await libsql.execute({
    sql: `
      SELECT n.* FROM memory_nodes n
      JOIN memory_closure c ON c.ancestor_id = n.id
      WHERE c.descendant_id = ? AND c.depth > 0
      ORDER BY c.depth ASC
    `,
    args: [nodeId],
  });
  return result.rows as unknown as MemoryNode[];
}

export async function syncSearchIndex(node: MemoryNode): Promise<void> {
  await libsql.batch(
    [
      {
        sql: `DELETE FROM memory_search_index WHERE node_id = ?`,
        args: [node.id],
      },
      {
        sql: `INSERT INTO memory_search_index (node_id, title, summary, content) VALUES (?, ?, ?, ?)`,
        args: [node.id, node.title, node.summary ?? "", node.content ?? ""],
      },
    ],
    "write",
  );
}
