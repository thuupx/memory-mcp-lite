import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteEdge,
  getEdgesFrom,
  getEdgesTo,
  insertEdge,
} from "../../src/db/repositories/edges-repo";
import { insertMemoryNode } from "../../src/db/repositories/nodes-repo";
import { upsertProject } from "../../src/db/repositories/projects-repo";
import type { MemoryNode } from "../../src/types/memory";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";

const PROJECT_ID = "proj_edges";

function n(id: string): MemoryNode {
  return {
    id,
    project_id: PROJECT_ID,
    parent_id: null,
    level: "atomic",
    memory_type: "fact",
    title: id,
    summary: id,
    content: null,
    status: "active",
    importance: 0.5,
    source: null,
    metadata_json: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

describe("edges-repo", () => {
  beforeEach(async () => {
    await setupFreshDb();
    await upsertProject({
      id: PROJECT_ID,
      scope_path: "/x",
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: "Edges",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    await insertMemoryNode(n("mem_a"));
    await insertMemoryNode(n("mem_b"));
    await insertMemoryNode(n("mem_c"));
  });

  it("inserts, queries, and deletes edges", async () => {
    await insertEdge({
      from_id: "mem_a",
      to_id: "mem_b",
      relation: "depends_on",
      metadata_json: null,
    });
    await insertEdge({
      from_id: "mem_a",
      to_id: "mem_c",
      relation: "references",
      metadata_json: null,
    });

    const outA = await getEdgesFrom("mem_a");
    expect(outA).toHaveLength(2);
    expect(outA.map((e) => e.relation).sort()).toEqual([
      "depends_on",
      "references",
    ]);

    const inB = await getEdgesTo("mem_b");
    expect(inB).toHaveLength(1);
    expect(inB[0]?.from_id).toBe("mem_a");

    await deleteEdge("mem_a", "mem_b", "depends_on");
    expect(await getEdgesFrom("mem_a")).toHaveLength(1);
    expect(await getEdgesTo("mem_b")).toHaveLength(0);
  });

  it("upserts metadata on conflict", async () => {
    await insertEdge({
      from_id: "mem_a",
      to_id: "mem_b",
      relation: "related_to",
      metadata_json: JSON.stringify({ weight: 1 }),
    });
    await insertEdge({
      from_id: "mem_a",
      to_id: "mem_b",
      relation: "related_to",
      metadata_json: JSON.stringify({ weight: 5 }),
    });

    const edges = await getEdgesFrom("mem_a");
    expect(edges).toHaveLength(1);
    expect(JSON.parse(edges[0]!.metadata_json!)).toEqual({ weight: 5 });
  });
});
