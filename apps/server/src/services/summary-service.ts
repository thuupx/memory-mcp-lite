import type { MemoryNode } from "../types/memory.js";
import type { SummaryOutput } from "../types/tool.js";
import {
  getSummaryByTypeAndProject,
  upsertSummaryNode,
} from "../db/repositories/summaries-repo.js";
import { syncSearchIndex, insertClosureRows } from "../db/repositories/nodes-repo.js";
import { generateId } from "../utils/ids.js";
import { nowIso } from "../utils/time.js";
import { GLOBAL_PROJECT_ID } from "../config/constants.js";

type SummaryType = "global_summary" | "project_summary" | "task_summary";

function toOutput(node: MemoryNode): SummaryOutput {
  return {
    id: node.id,
    title: node.title,
    summary: node.summary ?? node.content ?? "",
    updated_at: node.updated_at,
  };
}

export async function getGlobalSummary(): Promise<SummaryOutput | null> {
  const node = await getSummaryByTypeAndProject(GLOBAL_PROJECT_ID, "global_summary");
  return node ? toOutput(node) : null;
}

export async function getProjectSummary(projectId: string): Promise<SummaryOutput | null> {
  const node = await getSummaryByTypeAndProject(projectId, "project_summary");
  return node ? toOutput(node) : null;
}

export async function getTaskSummary(
  projectId: string,
  taskId?: string,
): Promise<SummaryOutput | null> {
  const node = await getSummaryByTypeAndProject(projectId, "task_summary", taskId);
  return node ? toOutput(node) : null;
}

export async function upsertSummary(
  projectId: string,
  memoryType: SummaryType,
  title: string,
  summary: string,
  parentId?: string,
): Promise<SummaryOutput> {
  const existing = await getSummaryByTypeAndProject(projectId, memoryType);
  const level =
    memoryType === "global_summary"
      ? "global"
      : memoryType === "project_summary"
        ? "project"
        : "task";

  const id = existing?.id ?? generateId("sum");
  const now = nowIso();

  const node: MemoryNode = {
    id,
    project_id: projectId,
    parent_id: parentId ?? null,
    level: level as MemoryNode["level"],
    memory_type: memoryType,
    title,
    summary,
    content: null,
    status: "active",
    importance: 1.0,
    source: null,
    metadata_json: null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  await upsertSummaryNode(node);
  await syncSearchIndex(node);
  if (!existing) {
    await insertClosureRows(id, parentId ?? null);
  }

  return toOutput(node);
}
