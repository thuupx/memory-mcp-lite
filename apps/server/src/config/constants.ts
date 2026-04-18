export const MEMORY_LEVELS = ["global", "project", "task", "atomic"] as const;

export const ATOMIC_MEMORY_TYPES = [
  "decision",
  "fact",
  "gotcha",
  "command",
  "link",
  "convention",
] as const;

export const SUMMARY_MEMORY_TYPES = ["global_summary", "project_summary", "task_summary"] as const;

export const MEMORY_STATUSES = ["active", "archived", "superseded"] as const;

export const RELATION_TYPES = [
  "related_to",
  "depends_on",
  "affects",
  "caused_by",
  "supersedes",
  "references",
] as const;

export const GLOBAL_PROJECT_ID = "__global__";

export const LIGHT_SEARCH_LIMIT = 10;
export const DETAIL_LOAD_LIMIT = 3;

export const DEFAULT_IMPORTANCE = 0.5;
export const HIGH_IMPORTANCE = 0.8;
