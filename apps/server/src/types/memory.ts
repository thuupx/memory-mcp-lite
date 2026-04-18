export type MemoryLevel = "global" | "project" | "task" | "atomic";

export type AtomicMemoryType =
  | "decision"
  | "fact"
  | "gotcha"
  | "command"
  | "link"
  | "convention";

export type SummaryMemoryType =
  | "global_summary"
  | "project_summary"
  | "task_summary";

export type MemoryType = AtomicMemoryType | SummaryMemoryType;

export type MemoryStatus = "active" | "archived" | "superseded";

export type RelationType =
  | "related_to"
  | "depends_on"
  | "affects"
  | "caused_by"
  | "supersedes"
  | "references";

export interface MemoryNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  level: MemoryLevel;
  memory_type: MemoryType;
  title: string;
  summary: string | null;
  content: string | null;
  status: MemoryStatus;
  importance: number;
  source: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemoryEdge {
  from_id: string;
  to_id: string;
  relation: RelationType;
  metadata_json: string | null;
}

export interface MemoryClosureRow {
  ancestor_id: string;
  descendant_id: string;
  depth: number;
}

export interface MemoryCandidate {
  id: string;
  title: string;
  summary: string | null;
  memory_type: MemoryType;
  level: MemoryLevel;
  importance: number;
  updated_at: string;
}

export interface MemoryDetail extends MemoryNode {
  metadata: Record<string, unknown> | null;
}
