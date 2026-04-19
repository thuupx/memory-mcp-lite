import { beforeEach, describe, expect, it } from "vitest";
import {
  getSummaryByTypeAndProject,
  upsertSummaryNode,
} from "../../src/db/repositories/summaries-repo";
import { upsertProject } from "../../src/db/repositories/projects-repo";
import type { MemoryNode } from "../../src/types/memory";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";

const PROJECT_ID = "proj_summaries";

function makeSummary(overrides: Partial<MemoryNode> = {}): MemoryNode {
  const now = nowIso();
  return {
    id: "sum_1",
    project_id: PROJECT_ID,
    parent_id: null,
    level: "project",
    memory_type: "project_summary",
    title: "Project overview",
    summary: "Initial summary.",
    content: null,
    status: "active",
    importance: 1,
    source: null,
    metadata_json: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe("summaries-repo", () => {
  beforeEach(async () => {
    await setupFreshDb();
    await upsertProject({
      id: PROJECT_ID,
      scope_path: "/proj",
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: "Sum",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  });

  it("returns null when no summary has been stored yet", async () => {
    const result = await getSummaryByTypeAndProject(
      PROJECT_ID,
      "project_summary",
    );
    expect(result).toBeNull();
  });

  it("upserts by id and keeps the latest content", async () => {
    await upsertSummaryNode(makeSummary());
    await upsertSummaryNode(
      makeSummary({
        summary: "Updated summary.",
        updated_at: "2099-01-01T00:00:00.000Z",
      }),
    );

    const row = await getSummaryByTypeAndProject(
      PROJECT_ID,
      "project_summary",
    );
    expect(row?.summary).toBe("Updated summary.");
    expect(row?.updated_at).toBe("2099-01-01T00:00:00.000Z");
  });

  it("scopes by parent_id when provided", async () => {
    const taskId = "mem_task_1";
    // Insert a pseudo task node so we can attach a task_summary to it.
    await upsertSummaryNode(
      makeSummary({
        id: taskId,
        memory_type: "task_summary",
        level: "task",
        title: "Task",
        summary: "Task body",
        parent_id: null,
      }),
    );
    await upsertSummaryNode(
      makeSummary({
        id: "sum_task_child",
        memory_type: "task_summary",
        level: "task",
        parent_id: taskId,
        summary: "Child task summary",
      }),
    );

    const withParent = await getSummaryByTypeAndProject(
      PROJECT_ID,
      "task_summary",
      taskId,
    );
    expect(withParent?.id).toBe("sum_task_child");

    const withoutParent = await getSummaryByTypeAndProject(
      PROJECT_ID,
      "task_summary",
    );
    // Without a parent filter we get the most recently updated; deterministic here
    // because both rows were upserted and ordered by updated_at desc.
    expect(withoutParent).not.toBeNull();
  });
});
