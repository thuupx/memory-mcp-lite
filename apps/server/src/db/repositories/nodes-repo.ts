import { client } from "../client";
import type { MemoryNode, MemoryCandidate } from "../../types/memory";

export async function insertMemoryNode(node: MemoryNode): Promise<void> {
  await client.memoryNode.create({
    data: node as Parameters<typeof client.memoryNode.create>[0]["data"],
  });
}

export async function updateMemoryNode(
  id: string,
  patch: Partial<
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
  >,
): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  await client.memoryNode.update({ where: { id }, data: patch });
}

export async function getMemoryNodeById(
  id: string,
): Promise<MemoryNode | null> {
  return (await client.memoryNode.findUnique({
    where: { id },
  })) as MemoryNode | null;
}

export async function getMemoryNodesByProjectAndType(
  projectId: string,
  memoryType: string,
): Promise<MemoryNode[]> {
  return (await client.memoryNode.findMany({
    where: { project_id: projectId, memory_type: memoryType, status: "active" },
    orderBy: { updated_at: "desc" },
  })) as MemoryNode[];
}

export async function getChildNodes(
  parentId: string,
): Promise<MemoryCandidate[]> {
  return (await client.memoryNode.findMany({
    where: { parent_id: parentId, status: "active" },
    select: {
      id: true,
      title: true,
      summary: true,
      memory_type: true,
      level: true,
      importance: true,
      updated_at: true,
    },
    orderBy: { importance: "desc" },
  })) as MemoryCandidate[];
}

export async function insertClosureRows(
  nodeId: string,
  parentId: string | null,
): Promise<void> {
  await client.$executeRaw`
    INSERT OR IGNORE INTO memory_closure (ancestor_id, descendant_id, depth)
    VALUES (${nodeId}, ${nodeId}, 0)
  `;

  if (parentId) {
    await client.$executeRaw`
      INSERT OR IGNORE INTO memory_closure (ancestor_id, descendant_id, depth)
      SELECT ancestor_id, ${nodeId}, depth + 1
      FROM memory_closure WHERE descendant_id = ${parentId}
    `;
  }
}

export async function getAncestors(nodeId: string): Promise<MemoryNode[]> {
  return (await client.$queryRaw`
    SELECT n.* FROM memory_nodes n
    JOIN memory_closure c ON c.ancestor_id = n.id
    WHERE c.descendant_id = ${nodeId} AND c.depth > 0
    ORDER BY c.depth ASC
  `) as MemoryNode[];
}

export async function syncSearchIndex(node: MemoryNode): Promise<void> {
  await client.$executeRaw`DELETE FROM memory_search_index WHERE node_id = ${node.id}`;
  await client.$executeRaw`
    INSERT INTO memory_search_index (node_id, title, summary, content)
    VALUES (${node.id}, ${node.title}, ${node.summary ?? ""}, ${node.content ?? ""})
  `;
}
