import { libsql } from "../../src/db/client";
import { ensureSchema } from "../../src/db/migrate";

/**
 * Drop every row from the memory-mcp tables so each test starts from a
 * clean slate without having to recreate the singleton libSQL client.
 *
 * The schema itself is created once by `setupFreshDb()` and then reused.
 */
export async function resetDb(): Promise<void> {
  await libsql.batch(
    [
      "DELETE FROM memory_search_index",
      "DELETE FROM memory_edges",
      "DELETE FROM memory_closure",
      "DELETE FROM memory_nodes",
      "DELETE FROM projects",
    ],
    "write",
  );
}

let schemaReady = false;

/**
 * Ensure the libSQL in-memory DB has the full schema. Safe to call from
 * every test file; the underlying `ensureSchema()` is idempotent but we
 * short-circuit after the first successful run in a given worker.
 */
export async function setupFreshDb(): Promise<void> {
  if (!schemaReady) {
    await ensureSchema();
    schemaReady = true;
  }
  await resetDb();
}
