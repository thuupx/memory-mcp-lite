import { beforeEach, describe, expect, it } from "vitest";
import {
  getGlobalSummaryTool,
  getMemoryDetailTool,
  getProjectSummaryTool,
  getTaskSummaryTool,
  rememberDecisionTool,
  rememberFactTool,
  searchMemoryLightTool,
  upsertProjectSummaryTool,
  upsertTaskSummaryTool,
} from "../../src/mcp/tools";
import { setupFreshDb } from "../helpers/db";

const WORKSPACE = "/tmp/mcp-tools-test";

describe("MCP tool handlers", () => {
  beforeEach(async () => {
    await setupFreshDb();
  });

  it("every tool exposes the required descriptor fields", () => {
    const tools = [
      getGlobalSummaryTool,
      getProjectSummaryTool,
      getTaskSummaryTool,
      searchMemoryLightTool,
      getMemoryDetailTool,
      rememberDecisionTool,
      rememberFactTool,
      upsertProjectSummaryTool,
      upsertTaskSummaryTool,
    ];

    for (const t of tools) {
      expect(t.name).toMatch(/^[a-z_]+$/);
      expect(typeof t.title).toBe("string");
      expect(typeof t.description).toBe("string");
      expect(t.inputShape).toBeTypeOf("object");
      expect(t.outputShape).toBeTypeOf("object");
      expect(t.annotations.title).toBe(t.title);
      expect(t.annotations.openWorldHint).toBe(false);
      expect(t.description).toContain("USE WHEN");
      expect(t.description).toContain("DO NOT USE WHEN");
    }
  });

  it("read-only tools have readOnlyHint=true and writers have readOnlyHint=false", () => {
    expect(getProjectSummaryTool.annotations.readOnlyHint).toBe(true);
    expect(searchMemoryLightTool.annotations.readOnlyHint).toBe(true);
    expect(getMemoryDetailTool.annotations.readOnlyHint).toBe(true);
    expect(rememberFactTool.annotations.readOnlyHint).toBe(false);
    expect(rememberDecisionTool.annotations.readOnlyHint).toBe(false);
    expect(upsertProjectSummaryTool.annotations.readOnlyHint).toBe(false);
  });

  it("round-trips write → read via tool handlers", async () => {
    const upsert = await upsertProjectSummaryTool.handler({
      workspace_path: WORKSPACE,
      title: "Project summary",
      summary: "Uses Drizzle + libSQL.",
    });
    expect(upsert.structuredContent.project_id).toMatch(/^proj_/);

    const fact = await rememberFactTool.handler({
      workspace_path: WORKSPACE,
      title: "Build cmd",
      summary: "Run npm run build for a production bundle.",
      fact_type: "command",
    });
    expect(fact.structuredContent.memory_id).toMatch(/^mem_/);

    const decision = await rememberDecisionTool.handler({
      workspace_path: WORKSPACE,
      title: "Pick libsql",
      summary: "Async + remote support.",
    });
    expect(decision.structuredContent.memory_id).toMatch(/^mem_/);

    const projectSummary = await getProjectSummaryTool.handler({
      workspace_path: WORKSPACE,
    });
    expect(projectSummary.structuredContent.found).toBe(true);
    expect(projectSummary.structuredContent.summary?.title).toBe(
      "Project summary",
    );

    const search = await searchMemoryLightTool.handler({
      workspace_path: WORKSPACE,
      query: "libsql",
      limit: 5,
      scope: "project",
    });
    expect(search.structuredContent.count).toBeGreaterThan(0);

    const detail = await getMemoryDetailTool.handler({
      id: search.structuredContent.results[0].id,
    });
    expect(detail.structuredContent.found).toBe(true);
    expect(detail.structuredContent.memory?.title).toBeDefined();
  });

  it("get_memory_detail sets isError for unknown ids", async () => {
    const result = await getMemoryDetailTool.handler({ id: "mem_unknown" });
    expect(result.structuredContent.found).toBe(false);
    expect(result.isError).toBe(true);
  });

  it("get_global_summary returns found:false when nothing is stored", async () => {
    const result = await getGlobalSummaryTool.handler();
    expect(result.structuredContent).toEqual({ found: false, summary: null });
  });

  it("upsert_task_summary persists and is retrievable", async () => {
    const up = await upsertTaskSummaryTool.handler({
      workspace_path: WORKSPACE,
      title: "Task",
      summary: "Halfway done.",
    });
    expect(up.structuredContent.summary_id).toMatch(/^sum_/);

    const read = await getTaskSummaryTool.handler({
      workspace_path: WORKSPACE,
    });
    expect(read.structuredContent.found).toBe(true);
    expect(read.structuredContent.summary?.summary).toBe("Halfway done.");
  });

  it("content[0].text mirrors structuredContent as JSON", async () => {
    const res = await upsertProjectSummaryTool.handler({
      workspace_path: WORKSPACE,
      title: "t",
      summary: "s",
    });
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed).toEqual(res.structuredContent);
  });
});
