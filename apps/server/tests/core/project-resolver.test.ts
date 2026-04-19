import { beforeEach, describe, expect, it } from "vitest";
import { resolveProject } from "../../src/core/project-resolver";
import { findProjectById } from "../../src/db/repositories/projects-repo";
import { setupFreshDb } from "../helpers/db";

describe("resolveProject", () => {
  beforeEach(async () => {
    await setupFreshDb();
  });

  it("creates a new project from workspace_path and reuses it on the next call", async () => {
    const first = await resolveProject({
      workspace_path: "/tmp/my-workspace",
    });
    expect(first.project.id).toMatch(/^proj_/);
    expect(first.resolved_by).toBe("workspace_path");

    const second = await resolveProject({
      workspace_path: "/tmp/my-workspace/",
    });
    expect(second.project.id).toBe(first.project.id);
  });

  it("prefers remote_url over workspace_path when both are provided", async () => {
    const a = await resolveProject({
      workspace_path: "/tmp/one",
      remote_url: "https://github.com/acme/repo.git",
    });
    const b = await resolveProject({
      workspace_path: "/tmp/DIFFERENT",
      remote_url: "git@github.com:acme/repo.git",
    });
    expect(b.project.id).toBe(a.project.id);
    expect(b.resolved_by).toBe("remote_url");
  });

  it("looks up an existing project by id directly", async () => {
    const created = await resolveProject({
      workspace_path: "/tmp/look-me-up",
    });
    const again = await resolveProject({ project_id: created.project.id });
    expect(again.resolved_by).toBe("id");
    expect(again.project.id).toBe(created.project.id);
  });

  it("throws when nothing identifies a project", async () => {
    await expect(resolveProject({})).rejects.toThrow(/Cannot resolve project/);
  });

  it("persists new projects to the DB", async () => {
    const { project } = await resolveProject({
      workspace_path: "/tmp/persisted",
      display_name: "Persisted",
    });
    const loaded = await findProjectById(project.id);
    expect(loaded?.display_name).toBe("Persisted");
  });

  it("uses a provided display_name only when creating the project", async () => {
    const first = await resolveProject({
      workspace_path: "/tmp/display-name-test",
      display_name: "Chosen name",
    });
    expect(first.project.display_name).toBe("Chosen name");
  });
});
