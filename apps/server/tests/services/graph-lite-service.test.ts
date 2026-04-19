import { beforeEach, describe, expect, it } from "vitest";
import {
  addRelation,
  findSupersededBy,
  getNodeEdges,
  getRelatedNodes,
  removeRelation,
} from "../../src/services/graph-lite-service";
import { writeMemory } from "../../src/services/memory-service";
import { upsertProject } from "../../src/db/repositories/projects-repo";
import { setupFreshDb } from "../helpers/db";
import { nowIso } from "../../src/utils/time";

const PROJECT_ID = "proj_graph";

async function makeMem(title: string) {
  const res = await writeMemory({
    project_id: PROJECT_ID,
    memory_type: "fact",
    title,
    summary: title,
  });
  return res.id;
}

describe("graph-lite-service", () => {
  let a: string;
  let b: string;
  let c: string;

  beforeEach(async () => {
    await setupFreshDb();
    await upsertProject({
      id: PROJECT_ID,
      scope_path: "/tmp/g",
      git_root: null,
      remote_url: null,
      repo_name: null,
      display_name: "G",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    a = await makeMem("a");
    b = await makeMem("b");
    c = await makeMem("c");
  });

  it("adds and resolves related nodes in both directions", async () => {
    await addRelation(a, b, "depends_on");
    await addRelation(c, a, "references", { note: "see a" });

    const edgesOfA = await getNodeEdges(a);
    expect(edgesOfA.outgoing).toHaveLength(1);
    expect(edgesOfA.incoming).toHaveLength(1);

    const related = await getRelatedNodes(a);
    const idsByDirection = Object.fromEntries(
      related.map((r) => [r.id, r.direction]),
    );
    expect(idsByDirection[b]).toBe("from");
    expect(idsByDirection[c]).toBe("to");
  });

  it("filters getRelatedNodes by relation", async () => {
    await addRelation(a, b, "depends_on");
    await addRelation(a, c, "references");

    const onlyRefs = await getRelatedNodes(a, "references");
    expect(onlyRefs.map((r) => r.id)).toEqual([c]);
  });

  it("removes a relation", async () => {
    await addRelation(a, b, "related_to");
    await removeRelation(a, b, "related_to");
    const related = await getRelatedNodes(a);
    expect(related).toHaveLength(0);
  });

  it("findSupersededBy returns the superseding node id", async () => {
    // b supersedes a
    await addRelation(b, a, "supersedes");
    expect(await findSupersededBy(a)).toBe(b);
    expect(await findSupersededBy(b)).toBeNull();
  });
});
