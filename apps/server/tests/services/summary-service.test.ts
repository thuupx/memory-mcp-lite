import { beforeEach, describe, expect, it } from "vitest";
import {
  getGlobalSummary,
  getProjectSummary,
  getTaskSummary,
  upsertSummary,
} from "../../src/services/summary-service";
import { upsertProject } from "../../src/db/repositories/projects-repo";
import { GLOBAL_PROJECT_ID } from "../../src/config/constants";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";

const PROJECT_ID = "proj_sum";

async function ensureProjects() {
  await upsertProject({
    id: GLOBAL_PROJECT_ID,
    scope_path: GLOBAL_PROJECT_ID,
    git_root: null,
    remote_url: null,
    repo_name: null,
    display_name: "Global",
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  await upsertProject({
    id: PROJECT_ID,
    scope_path: "/tmp/s",
    git_root: null,
    remote_url: null,
    repo_name: null,
    display_name: "S",
    created_at: nowIso(),
    updated_at: nowIso(),
  });
}

describe("summary-service", () => {
  beforeEach(async () => {
    await setupFreshDb();
    await ensureProjects();
  });

  it("returns null for each summary kind before anything is written", async () => {
    expect(await getGlobalSummary()).toBeNull();
    expect(await getProjectSummary(PROJECT_ID)).toBeNull();
    expect(await getTaskSummary(PROJECT_ID)).toBeNull();
  });

  it("upserts the global summary and reuses the same id on subsequent updates", async () => {
    const first = await upsertSummary(
      GLOBAL_PROJECT_ID,
      "global_summary",
      "Global",
      "First body.",
    );
    const second = await upsertSummary(
      GLOBAL_PROJECT_ID,
      "global_summary",
      "Global",
      "Second body.",
    );
    expect(first.id).toBe(second.id);

    const loaded = await getGlobalSummary();
    expect(loaded?.summary).toBe("Second body.");
  });

  it("upserts a project summary", async () => {
    const result = await upsertSummary(
      PROJECT_ID,
      "project_summary",
      "P",
      "Body.",
    );
    expect(result.id).toMatch(/^sum_/);
    const loaded = await getProjectSummary(PROJECT_ID);
    expect(loaded?.title).toBe("P");
  });

  it("upserts a task summary attached to a parent task", async () => {
    await upsertSummary(
      PROJECT_ID,
      "task_summary",
      "Task progress",
      "Work so far.",
    );
    const loaded = await getTaskSummary(PROJECT_ID);
    expect(loaded?.summary).toBe("Work so far.");
  });
});
