import { beforeEach, describe, expect, it } from "vitest";
import {
  findProjectById,
  findProjectByGitRoot,
  findProjectByRemoteUrl,
  findProjectByScopePath,
  upsertProject,
} from "../../src/db/repositories/projects-repo";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";

const baseProject = () => ({
  id: "proj_test",
  scope_path: "/tmp/workspace",
  git_root: "/tmp/workspace",
  remote_url: "https://github.com/acme/repo",
  repo_name: "repo",
  display_name: "Acme Repo",
  created_at: nowIso(),
  updated_at: nowIso(),
});

describe("projects-repo", () => {
  beforeEach(async () => {
    await setupFreshDb();
  });

  it("upserts and finds a project by every index", async () => {
    const p = baseProject();
    await upsertProject(p);

    expect(await findProjectById(p.id)).toMatchObject({ id: p.id });
    expect(await findProjectByRemoteUrl(p.remote_url!)).toMatchObject({
      id: p.id,
    });
    expect(await findProjectByGitRoot(p.git_root!)).toMatchObject({
      id: p.id,
    });
    expect(await findProjectByScopePath(p.scope_path)).toMatchObject({
      id: p.id,
    });
  });

  it("returns null when nothing matches", async () => {
    expect(await findProjectById("missing")).toBeNull();
    expect(await findProjectByRemoteUrl("https://example.com/x")).toBeNull();
    expect(await findProjectByGitRoot("/nope")).toBeNull();
    expect(await findProjectByScopePath("/nope")).toBeNull();
  });

  it("updates the mutable fields on conflict", async () => {
    const p = baseProject();
    await upsertProject(p);

    const later = nowIso();
    await upsertProject({
      ...p,
      display_name: "Renamed",
      updated_at: later,
    });

    const found = await findProjectById(p.id);
    expect(found?.display_name).toBe("Renamed");
    expect(found?.updated_at).toBe(later);
  });
});
