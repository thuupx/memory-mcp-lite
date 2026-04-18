import type { MemoryNode } from "../types/memory";
import type { DetailOutput } from "../types/tool";
import {
  insertMemoryNode,
  insertClosureRows,
  syncSearchIndex,
} from "../db/repositories/nodes-repo";
import { generateId } from "../utils/ids";
import { nowIso } from "../utils/time";
import { DEFAULT_IMPORTANCE } from "../config/constants";

export interface WriteMemoryInput {
  project_id: string;
  parent_id?: string;
  title: string;
  summary: string;
  content?: string;
  memory_type: MemoryNode["memory_type"];
  importance?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export async function writeMemory(
  input: WriteMemoryInput,
): Promise<DetailOutput> {
  const id = generateId("mem");
  const now = nowIso();

  const node: MemoryNode = {
    id,
    project_id: input.project_id,
    parent_id: input.parent_id ?? null,
    level: "atomic",
    memory_type: input.memory_type,
    title: input.title,
    summary: input.summary,
    content: input.content ?? null,
    status: "active",
    importance: input.importance ?? DEFAULT_IMPORTANCE,
    source: input.source ?? null,
    metadata_json: input.metadata ? JSON.stringify(input.metadata) : null,
    created_at: now,
    updated_at: now,
  };

  await insertMemoryNode(node);
  await insertClosureRows(id, input.parent_id ?? null);
  await syncSearchIndex(node);

  return {
    id: node.id,
    title: node.title,
    summary: node.summary,
    content: node.content,
    memory_type: node.memory_type,
    level: node.level,
    importance: node.importance,
    source: node.source,
    metadata: input.metadata ?? null,
    created_at: node.created_at,
    updated_at: node.updated_at,
  };
}
