import { beforeEach, describe, expect, it } from "vitest";
import {
  getAncestors,
  getChildNodes,
  getMemoryNodeById,
  getMemoryNodesByProjectAndType,
  insertClosureRows,
  insertMemoryNode,
  syncSearchIndex,
  updateMemoryNode,
} from "../../src/db/repositories/nodes-repo";
import { upsertProject } from "../../src/db/repositories/projects-repo";
import type { MemoryNode } from "../../src/types/memory";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";

const PROJECT_ID = "proj_test";

function project() {
  return {
    id: PROJECT_ID,
    scope_path: "/tmp/workspace",
    git_root: "/tmp/workspace",
    remote_url: null,
    repo_name: null,
    display_name: "Test",
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

function node(overrides: Partial<MemoryNode> = {}): MemoryNode {
  return {
    id: "mem_root",
    project_id: PROJECT_ID,
    parent_id: null,
    level: "atomic",
    memory_type: "fact",
    title: "Build command",
    summary: "npm run build",
    content: null,
    status: "active",
    importance: 0.5,
    source: null,
    metadata_json: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    ...overrides,
  };
}

describe("nodes-repo", () => {
  beforeEach(async () => {
    await setupFreshDb();
    await upsertProject(project());
  });

  it("inserts and fetches a memory node", async () => {
    const n = node();
    await insertMemoryNode(n);

    const loaded = await getMemoryNodeById(n.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.title).toBe(n.title);
    expect(loaded?.status).toBe("active");
  });

  it("updates only the provided fields", async () => {
    const n = node();
    await insertMemoryNode(n);

    await updateMemoryNode(n.id, { title: "Updated", importance: 0.9 });

    const loaded = await getMemoryNodeById(n.id);
    expect(loaded?.title).toBe("Updated");
    expect(loaded?.importance).toBe(0.9);
    expect(loaded?.summary).toBe(n.summary);
  });

  it("is a no-op when updating with an empty patch", async () => {
    const n = node();
    await insertMemoryNode(n);
    await updateMemoryNode(n.id, {});
    const loaded = await getMemoryNodeById(n.id);
    expect(loaded?.title).toBe(n.title);
  });

  it("filters getMemoryNodesByProjectAndType by project + memory_type + active", async () => {
    await insertMemoryNode(node({ id: "mem_fact", memory_type: "fact" }));
    await insertMemoryNode(node({ id: "mem_cmd", memory_type: "command" }));
    await insertMemoryNode(
      node({ id: "mem_archived", memory_type: "fact", status: "archived" }),
    );

    const facts = await getMemoryNodesByProjectAndType(PROJECT_ID, "fact");
    expect(facts.map((f) => f.id).sort()).toEqual(["mem_fact"]);

    const commands = await getMemoryNodesByProjectAndType(
      PROJECT_ID,
      "command",
    );
    expect(commands.map((c) => c.id)).toEqual(["mem_cmd"]);
  });

  it("tracks parent/child via the closure table", async () => {
    const parent = node({ id: "mem_p", level: "task", memory_type: "fact" });
    const child = node({ id: "mem_c", parent_id: "mem_p" });
    const grandchild = node({ id: "mem_gc", parent_id: "mem_c" });

    await insertMemoryNode(parent);
    await insertClosureRows(parent.id, null);

    await insertMemoryNode(child);
    await insertClosureRows(child.id, parent.id);

    await insertMemoryNode(grandchild);
    await insertClosureRows(grandchild.id, child.id);

    const children = await getChildNodes(parent.id);
    expect(children.map((c) => c.id)).toContain("mem_c");
    expect(children.map((c) => c.id)).not.toContain("mem_gc");

    const ancestors = await getAncestors(grandchild.id);
    // Closure returns ancestors in order of increasing depth: closest first.
    expect(ancestors.map((a) => a.id)).toEqual(["mem_c", "mem_p"]);
  });

  it("syncSearchIndex replaces the FTS row for a node", async () => {
    const n = node({
      id: "mem_fts",
      title: "Turso connection",
      summary: "Use libsql:// with the auth token.",
    });
    await insertMemoryNode(n);
    await syncSearchIndex(n);

    // Replace the indexed content and make sure the old tokens disappear.
    await syncSearchIndex({
      ...n,
      title: "Renamed",
      summary: "Totally different body.",
    });

    const { libsql } = await import("../../src/db/client");
    const stillTurso = await libsql.execute({
      sql: "SELECT node_id FROM memory_search_index WHERE memory_search_index MATCH ?",
      args: ["turso"],
    });
    expect(stillTurso.rows).toHaveLength(0);

    const nowMatches = await libsql.execute({
      sql: "SELECT node_id FROM memory_search_index WHERE memory_search_index MATCH ?",
      args: ["renamed"],
    });
    expect(nowMatches.rows).toHaveLength(1);
  });
});
