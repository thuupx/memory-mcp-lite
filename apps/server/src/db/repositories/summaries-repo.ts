import { client } from "../client";
import type { MemoryNode } from "../../types/memory";

export async function getSummaryByTypeAndProject(
  projectId: string,
  memoryType: "global_summary" | "project_summary" | "task_summary",
  parentId?: string,
): Promise<MemoryNode | null> {
  return (await client.memoryNode.findFirst({
    where: {
      project_id: projectId,
      memory_type: memoryType,
      status: "active",
      ...(parentId !== undefined ? { parent_id: parentId } : {}),
    },
    orderBy: { updated_at: "desc" },
  })) as MemoryNode | null;
}

export async function upsertSummaryNode(node: MemoryNode): Promise<void> {
  await client.memoryNode.upsert({
    where: { id: node.id },
    update: {
      title: node.title,
      summary: node.summary,
      content: node.content,
      importance: node.importance,
      metadata_json: node.metadata_json,
      updated_at: node.updated_at,
    },
    create: node as Parameters<typeof client.memoryNode.create>[0]["data"],
  });
}
