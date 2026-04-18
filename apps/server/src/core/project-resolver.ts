import path from "path";
import type {
  Project,
  ProjectResolutionInput,
  ProjectResolutionResult,
} from "../types/project";
import {
  findProjectById,
  findProjectByRemoteUrl,
  findProjectByGitRoot,
  findProjectByScopePath,
  upsertProject,
} from "../db/repositories/projects-repo";
import {
  tryGetGitRoot,
  tryGetRemoteUrl,
  normalizeRemoteUrl,
  extractRepoName,
} from "../utils/git";
import { shortHash } from "../utils/hash";
import { nowIso } from "../utils/time";

function normalizePath(p: string): string {
  return path.resolve(p).replace(/\\/g, "/").replace(/\/$/, "");
}

export async function resolveProject(
  input: ProjectResolutionInput,
): Promise<ProjectResolutionResult> {
  if (input.project_id) {
    const existing = await findProjectById(input.project_id);
    if (existing) return { project: existing, resolved_by: "id" };
  }

  const explicitRemoteUrl = input.remote_url
    ? normalizeRemoteUrl(input.remote_url)
    : null;
  if (explicitRemoteUrl) {
    const existing = await findProjectByRemoteUrl(explicitRemoteUrl);
    if (existing) return { project: existing, resolved_by: "remote_url" };
  }

  const workspacePath = input.workspace_path
    ? normalizePath(input.workspace_path)
    : null;
  const gitRoot = input.git_root
    ? normalizePath(input.git_root)
    : workspacePath
      ? (tryGetGitRoot(workspacePath) ?? null)
      : null;

  const rawRemote = gitRoot ? tryGetRemoteUrl(gitRoot) : null;
  const remoteUrl =
    explicitRemoteUrl ?? (rawRemote ? normalizeRemoteUrl(rawRemote) : null);

  if (remoteUrl) {
    const existing = await findProjectByRemoteUrl(remoteUrl);
    if (existing) return { project: existing, resolved_by: "remote_url" };
  }

  if (gitRoot) {
    const existing = await findProjectByGitRoot(gitRoot);
    if (existing) return { project: existing, resolved_by: "git_root" };
  }

  const scopePath = gitRoot ?? workspacePath ?? null;

  if (!scopePath) {
    throw new Error(
      "Cannot resolve project: provide at least one of workspace_path, git_root, remote_url, or project_id.",
    );
  }

  const existing = await findProjectByScopePath(scopePath);
  if (existing) return { project: existing, resolved_by: "workspace_path" };

  const id = `proj_${shortHash(remoteUrl ?? gitRoot ?? scopePath)}`;
  const repoName = remoteUrl ? extractRepoName(remoteUrl) : null;
  const now = nowIso();

  const newProject: Project = {
    id,
    scope_path: scopePath,
    git_root: gitRoot,
    remote_url: remoteUrl,
    repo_name: repoName,
    display_name: input.display_name ?? repoName ?? path.basename(scopePath),
    created_at: now,
    updated_at: now,
  };

  await upsertProject(newProject);

  const resolvedBy = remoteUrl
    ? "remote_url"
    : gitRoot
      ? "git_root"
      : "workspace_path";
  return { project: newProject, resolved_by: resolvedBy };
}
