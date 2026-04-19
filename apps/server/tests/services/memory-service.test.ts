import { beforeEach, describe, expect, it } from "vitest";
import { writeMemory } from "../../src/services/memory-service";
import { getMemoryNodeById } from "../../src/db/repositories/nodes-repo";
import { upsertProject } from "../../src/db/repositories/projects-repo";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";
import { libsql } from "../../src/db/client";

const PROJECT_ID = "proj_write";

describe("writeMemory", () => {
  beforeEach(async () => {
    await setupFreshDb();
    await upsertProject({
      id: PROJECT_ID,
      scope_path: "/tmp/w",
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: "Writer",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  });

  it("assigns a mem_ prefixed id and writes the row", async () => {
    const result = await writeMemory({
      project_id: PROJECT_ID,
      memory_type: "fact",
      title: "Base",
      summary: "Base body",
    });
    expect(result.id).toMatch(/^mem_[0-9a-f]{16}$/);

    const row = await getMemoryNodeById(result.id);
    expect(row?.level).toBe("atomic");
    expect(row?.status).toBe("active");
    expect(row?.importance).toBe(0.5);
  });

  it("applies the provided metadata as JSON", async () => {
    const result = await writeMemory({
      project_id: PROJECT_ID,
      memory_type: "fact",
      title: "With metadata",
      summary: "s",
      metadata: { foo: "bar", n: 1 },
    });
    const row = await getMemoryNodeById(result.id);
    expect(JSON.parse(row!.metadata_json!)).toEqual({ foo: "bar", n: 1 });
  });

  it("writes an FTS row that the search index can find", async () => {
    const result = await writeMemory({
      project_id: PROJECT_ID,
      memory_type: "fact",
      title: "Elephant",
      summary: "An elephant never forgets.",
    });
    const fts = await libsql.execute({
      sql: "SELECT node_id FROM memory_search_index WHERE memory_search_index MATCH ?",
      args: ["elephant"],
    });
    expect(fts.rows.map((r) => r.node_id)).toContain(result.id);
  });

  it("inserts the self-referencing closure row", async () => {
    const result = await writeMemory({
      project_id: PROJECT_ID,
      memory_type: "fact",
      title: "Closure",
      summary: "x",
    });
    const closure = await libsql.execute({
      sql: "SELECT ancestor_id, descendant_id, depth FROM memory_closure WHERE descendant_id = ?",
      args: [result.id],
    });
    expect(closure.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ancestor_id: result.id,
          descendant_id: result.id,
          depth: 0,
        }),
      ]),
    );
  });
});
