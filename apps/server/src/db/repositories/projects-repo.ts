import { client } from "../client";
import type { Project } from "../../types/project";

export async function findProjectById(id: string): Promise<Project | null> {
  return (await client.project.findUnique({ where: { id } })) as Project | null;
}

export async function findProjectByRemoteUrl(
  remoteUrl: string,
): Promise<Project | null> {
  return (await client.project.findUnique({
    where: { remote_url: remoteUrl },
  })) as Project | null;
}

export async function findProjectByGitRoot(
  gitRoot: string,
): Promise<Project | null> {
  return (await client.project.findUnique({
    where: { git_root: gitRoot },
  })) as Project | null;
}

export async function findProjectByScopePath(
  scopePath: string,
): Promise<Project | null> {
  return (await client.project.findUnique({
    where: { scope_path: scopePath },
  })) as Project | null;
}

export async function upsertProject(project: Project): Promise<void> {
  await client.project.upsert({
    where: { id: project.id },
    update: {
      scope_path: project.scope_path,
      git_root: project.git_root,
      remote_url: project.remote_url,
      repo_name: project.repo_name,
      display_name: project.display_name,
      updated_at: project.updated_at,
    },
    create: project,
  });
}
