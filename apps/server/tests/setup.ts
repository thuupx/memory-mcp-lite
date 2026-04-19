/**
 * Test setup — runs before every test file.
 *
 * We pin the database path to libSQL's in-memory mode so tests never touch
 * the real filesystem. Production defaults stay unchanged (file-backed DB
 * under ~/.memory-mcp/memory.db).
 *
 * IMPORTANT: this file is listed in vitest.config.ts `setupFiles` so its
 * top-level code executes before any `import` in the test file itself is
 * evaluated. That matters because `apps/server/src/config/env.ts` reads
 * process.env at module-load time.
 */
process.env.MEMORY_DB_PATH = ":memory:";
process.env.MEMORY_DB_AUTH_TOKEN = "";
process.env.LOG_LEVEL = "error";
