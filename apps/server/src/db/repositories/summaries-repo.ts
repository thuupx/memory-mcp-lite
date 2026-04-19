import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { memoryNodes } from "../schema";
import type { MemoryNode } from "../../types/memory";

export async function getSummaryByTypeAndProject(
  projectId: string,
  memoryType: "global_summary" | "project_summary" | "task_summary",
  parentId?: string,
): Promise<MemoryNode | null> {
  const conditions = [
    eq(memoryNodes.project_id, projectId),
    eq(memoryNodes.memory_type, memoryType),
    eq(memoryNodes.status, "active"),
  ];
  if (parentId !== undefined) {
    conditions.push(eq(memoryNodes.parent_id, parentId));
  }

  const rows = await db
    .select()
    .from(memoryNodes)
    .where(and(...conditions))
    .orderBy(desc(memoryNodes.updated_at))
    .limit(1);

  return (rows[0] as MemoryNode | undefined) ?? null;
}

export async function upsertSummaryNode(node: MemoryNode): Promise<void> {
  await db
    .insert(memoryNodes)
    .values(node)
    .onConflictDoUpdate({
      target: memoryNodes.id,
      set: {
        title: node.title,
        summary: node.summary,
        content: node.content,
        importance: node.importance,
        metadata_json: node.metadata_json,
        updated_at: node.updated_at,
      },
    });
}
