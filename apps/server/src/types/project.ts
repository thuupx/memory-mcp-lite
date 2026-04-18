export interface Project {
  id: string;
  scope_path: string;
  git_root: string | null;
  remote_url: string | null;
  repo_name: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectResolutionInput {
  workspace_path?: string;
  git_root?: string;
  remote_url?: string;
  display_name?: string;
  project_id?: string;
}

export interface ProjectResolutionResult {
  project: Project;
  resolved_by: "id" | "remote_url" | "git_root" | "workspace_path";
}
