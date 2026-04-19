import { beforeEach, describe, expect, it } from "vitest";
import {
  getMemoryDetail,
  searchMemoryLight,
} from "../../src/services/search-service";
import { writeMemory } from "../../src/services/memory-service";
import { upsertSummary } from "../../src/services/summary-service";
import { upsertProject } from "../../src/db/repositories/projects-repo";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";

const PROJECT_A = "proj_a";
const PROJECT_B = "proj_b";

async function seed() {
  for (const id of [PROJECT_A, PROJECT_B]) {
    await upsertProject({
      id,
      scope_path: `/tmp/${id}`,
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: id,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  }

  const libsqlCmd = await writeMemory({
    project_id: PROJECT_A,
    memory_type: "command",
    title: "libsql build command",
    summary: "Run npm run build to bundle the libsql server.",
  });

  const tursoGotcha = await writeMemory({
    project_id: PROJECT_A,
    memory_type: "gotcha",
    title: "Turso auth token",
    summary: "Set MEMORY_DB_AUTH_TOKEN when pointing at a remote turso DB.",
  });

  const other = await writeMemory({
    project_id: PROJECT_B,
    memory_type: "fact",
    title: "Unrelated",
    summary: "This belongs to the other project.",
  });

  // A summary should never appear in search results.
  await upsertSummary(
    PROJECT_A,
    "project_summary",
    "Project summary",
    "libsql is used everywhere.",
  );

  return { libsqlCmd, tursoGotcha, other };
}

describe("searchMemoryLight", () => {
  beforeEach(async () => {
    await setupFreshDb();
  });

  it("returns atomic memories matching the query ordered by rank/importance", async () => {
    const { libsqlCmd, tursoGotcha } = await seed();
    const hits = await searchMemoryLight("libsql", PROJECT_A);

    const ids = hits.map((h) => h.id);
    expect(ids).toContain(libsqlCmd.id);
    // Tokenizing "turso" only, but it shouldn't appear for a "libsql" query.
    expect(ids).not.toContain(tursoGotcha.id);
  });

  it("scopes results to the given project", async () => {
    const { other } = await seed();
    const inA = await searchMemoryLight("unrelated", PROJECT_A);
    expect(inA.map((h) => h.id)).not.toContain(other.id);

    const inB = await searchMemoryLight("unrelated", PROJECT_B);
    expect(inB.map((h) => h.id)).toContain(other.id);
  });

  it("supports prefix matching on partial tokens", async () => {
    await seed();
    const hits = await searchMemoryLight("libs", PROJECT_A);
    expect(hits.length).toBeGreaterThan(0);
  });

  it("excludes summary memories from search results", async () => {
    await seed();
    const hits = await searchMemoryLight("summary", PROJECT_A);
    expect(hits.every((h) => !h.memory_type.endsWith("_summary"))).toBe(true);
  });

  it("returns [] for an empty / operator-only query", async () => {
    await seed();
    expect(await searchMemoryLight("", PROJECT_A)).toEqual([]);
    expect(await searchMemoryLight("AND OR NOT", PROJECT_A)).toEqual([]);
    expect(await searchMemoryLight('"*"(', PROJECT_A)).toEqual([]);
  });

  it("respects the limit argument", async () => {
    const { libsqlCmd } = await seed();
    const hits = await searchMemoryLight("libsql", PROJECT_A, 1);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe(libsqlCmd.id);
  });
});

describe("getMemoryDetail", () => {
  beforeEach(async () => {
    await setupFreshDb();
  });

  it("returns the full node detail with parsed metadata", async () => {
    await upsertProject({
      id: PROJECT_A,
      scope_path: "/tmp/a",
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: "A",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    const written = await writeMemory({
      project_id: PROJECT_A,
      memory_type: "decision",
      title: "Pick libsql",
      summary: "Async, remote-capable.",
      content: "Picked over better-sqlite3.",
      metadata: { author: "team" },
    });
    const detail = await getMemoryDetail(written.id);
    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("Pick libsql");
    expect(detail?.metadata).toEqual({ author: "team" });
  });

  it("returns null for an unknown id", async () => {
    expect(await getMemoryDetail("mem_missing")).toBeNull();
  });

  it("tolerates malformed metadata_json", async () => {
    await upsertProject({
      id: PROJECT_A,
      scope_path: "/tmp/a",
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: "A",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    const written = await writeMemory({
      project_id: PROJECT_A,
      memory_type: "fact",
      title: "Broken",
      summary: "ok",
    });
    const { libsql } = await import("../../src/db/client");
    await libsql.execute({
      sql: "UPDATE memory_nodes SET metadata_json = ? WHERE id = ?",
      args: ["{not valid json", written.id],
    });
    const detail = await getMemoryDetail(written.id);
    expect(detail?.metadata).toBeNull();
  });
});
