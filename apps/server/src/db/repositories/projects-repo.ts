import { eq } from "drizzle-orm";
import { db } from "../client";
import { projects } from "../schema";
import type { Project } from "../../types/project";

export async function findProjectById(id: string): Promise<Project | null> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return (rows[0] as Project | undefined) ?? null;
}

export async function findProjectByRemoteUrl(
  remoteUrl: string,
): Promise<Project | null> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.remote_url, remoteUrl))
    .limit(1);
  return (rows[0] as Project | undefined) ?? null;
}

export async function findProjectByGitRoot(
  gitRoot: string,
): Promise<Project | null> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.git_root, gitRoot))
    .limit(1);
  return (rows[0] as Project | undefined) ?? null;
}

export async function findProjectByScopePath(
  scopePath: string,
): Promise<Project | null> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.scope_path, scopePath))
    .limit(1);
  return (rows[0] as Project | undefined) ?? null;
}

export async function upsertProject(project: Project): Promise<void> {
  await db
    .insert(projects)
    .values(project)
    .onConflictDoUpdate({
      target: projects.id,
      set: {
        scope_path: project.scope_path,
        git_root: project.git_root,
        remote_url: project.remote_url,
        repo_name: project.repo_name,
        display_name: project.display_name,
        updated_at: project.updated_at,
      },
    });
}
