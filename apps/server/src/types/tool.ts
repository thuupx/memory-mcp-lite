export interface ToolSuccess<T> {
  ok: true;
  data: T;
}

export interface ToolError {
  ok: false;
  error: string;
  code?: string;
}

export type ToolResult<T> = ToolSuccess<T> | ToolError;

export interface ProjectContext {
  project_id?: string;
  workspace_path?: string;
  git_root?: string;
  remote_url?: string;
}

export interface SummaryOutput {
  id: string;
  title: string;
  summary: string;
  updated_at: string;
}

export interface LightSearchResult {
  id: string;
  title: string;
  summary: string | null;
  memory_type: string;
  level: string;
  importance: number;
  updated_at: string;
}

export interface DetailOutput {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  memory_type: string;
  level: string;
  importance: number;
  source: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
