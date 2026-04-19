# memory-mcp-lite

A small, opinionated memory server for AI coding assistants (Windsurf, Cursor, Claude Desktop — anything that speaks MCP).

It runs locally, stores durable knowledge on your disk, and tries very hard to stay out of your agent's way until you actually need it.

## Why this exists

Most AI clients already have some form of short-term memory. They remember the current conversation, maybe a few rules you've set, and that's about it. What they don't give you is a place to park things that should outlive the session — the architectural decision you made last week, the one weird build command for this repo, the gotcha that bit you three times in a row.

memory-mcp-lite is that place. It stores:

- technical decisions and the reasoning behind them,
- project architecture and conventions,
- commands, env notes, links, and gotchas,
- task state so you can resume work later,
- rolled-up summaries at the global / project / task level.

It deliberately does **not** store raw chat transcripts, replace your client's built-in rules, run embeddings or vector search, or need a server or cloud connection.

## How it's organised

Memory lives in a tree:

```
global
└── project
    ├── [project_summary]
    └── task
        ├── [task_summary]
        └── atomic  // decision | fact | gotcha | command | link | convention
```

On top of the tree you can draw optional graph-lite edges between any two nodes — `related_to`, `depends_on`, `affects`, `caused_by`, `supersedes`, `references`. Handy when one decision obsoletes another, or a gotcha only matters in the context of a specific command.

The retrieval side is built to be cheap. The server's instructions push agents through three stages, from least to most expensive:

```
Stage 1 — summaries              get_global_summary / get_project_summary / get_task_summary
        │
        ▼ (only if summaries aren't enough)
Stage 2 — FTS5 light search      search_memory_light → compact candidates
        │
        ▼ (only for the 1–3 most relevant hits)
Stage 3 — full detail            get_memory_detail
```

In practice this means your agent asks for a summary first, and only pays for the big payload when it has a specific reason to. If you skip this policy, you just end up dumping a bunch of stringly-typed JSON into context for no reason.

## Stack

- TypeScript, Node ≥ 20
- Drizzle ORM over libSQL (`@libsql/client`)
- SQLite FTS5 for lexical search
- A closure table for efficient subtree traversal
- The MCP TypeScript SDK (`@modelcontextprotocol/sdk`)

You can point it at a local file, a remote libSQL instance, or a Turso database — they all work the same.

## Install

The fast path is to let your MCP client fetch the package via `npx`.

**Windsurf** — `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "npx",
      "args": ["memory-mcp-lite"]
    }
  }
}
```

**Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "npx",
      "args": ["memory-mcp-lite"]
    }
  }
}
```

Same pattern for any other MCP-compatible client; only the config file path changes.

### From source

```bash
npm install
npm run build    # outputs dist/index.js; the schema is created on first run
```

Then point your client at the compiled bundle:

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "node",
      "args": ["/absolute/path/to/memory-mcp-lite/dist/index.js"]
    }
  }
}
```

If you want to iterate on the code without a build step, `tsx` works:

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/memory-mcp-lite/apps/server/src/index.ts"]
    }
  }
}
```

### Where the data lives

By default: `~/.memory-mcp/memory.db`. Override it with any of:

| Env var                  | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `MEMORY_DB_PATH`         | Full path or `libsql://…` / `file:` URL.   |
| `MEMORY_DATA_DIR`        | Directory; the file is still `memory.db`.  |
| `DATABASE_URL`           | Accepted for backwards compatibility.      |
| `MEMORY_DB_AUTH_TOKEN`   | Bearer token for remote libSQL / Turso.    |

So running against Turso is just:

```bash
MEMORY_DB_PATH="libsql://your-db.turso.io" \
MEMORY_DB_AUTH_TOKEN="eyJhbGci..." \
npm run dev
```

## Tools

Nine tools, all returning both a human-readable JSON block and a `structuredContent` object for programmatic clients. The server also ships a strict `description` and `annotations` payload for each tool so agents can pick the right one without guessing.

| Tool                     | Reach for it when…                                      |
| ------------------------ | ------------------------------------------------------- |
| `get_global_summary`     | recurring preferences, cross-project conventions        |
| `get_project_summary`    | architecture, key decisions, long-term project context  |
| `get_task_summary`       | resuming a specific piece of work                       |
| `search_memory_light`    | summaries aren't enough; you want compact candidates    |
| `get_memory_detail`      | you've picked a candidate and need the full body        |
| `remember_decision`      | an architecture choice, trade-off, or rejected path     |
| `remember_fact`          | a command, env note, gotcha, link, or convention        |
| `upsert_project_summary` | after an arch change or new convention worth recording  |
| `upsert_task_summary`    | after progress, blockers, or a plan change              |

The retrieval discipline the server asks agents to follow:

1. summaries first,
2. light search only if summaries aren't enough,
3. full detail for at most 1–3 hits,
4. never dump every memory just because you can.

## Project identity

Projects are looked up in this priority order:

1. **Normalised git remote URL** — the most stable; survives directory moves and clones.
2. **Git root path** — used when there's no remote.
3. **Normalised workspace path** — the fallback.

This means the same project keeps the same memory even if different clients hand you slightly different paths, and moving a repo doesn't orphan everything you've stored.

## Development

```bash
npm run typecheck      # TypeScript
npm run lint           # oxlint
npm run test           # vitest
npm run build          # esbuild bundle to dist/
npm run dev            # tsx watch
npm run db:studio      # Drizzle Studio for poking at the DB
npm run db:generate    # generate migration SQL when the schema changes
```

The schema is defined in `apps/server/src/db/schema.ts` and re-asserted on every startup by `ensureSchema()` (see `apps/server/src/db/migrate.ts`). That function is also where the FTS5 virtual table and its triggers get created — Drizzle doesn't manage virtual tables, so we do it ourselves with plain SQL. It's idempotent, so there's nothing to run manually.

## Roadmap

- Optional semantic fallback (local embeddings, feature-flagged).
- Node archival / cleanup for long-lived projects.
- Shared-team memory, once there's a good story for auth.
