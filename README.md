# Memory MCP Lite

A **local-first, token-efficient MCP memory server** for AI coding clients (Windsurf, Cursor, Claude Desktop, and any MCP-compatible client).

## What this is

A lightweight, structured memory layer that persists across AI coding sessions. It complements your AI client's built-in context by storing durable, structured knowledge.

**What it stores:**

- Technical decisions and their rationale
- Project architecture and conventions
- Gotchas, commands, and environment facts
- Task state for resumable work sessions
- Hierarchical summaries (global -> project -> task)

**What it does NOT do:**

- Store raw chat transcripts
- Replace your AI client's built-in memory or rules
- Run embeddings or vector search (phase 1)
- Require a server or cloud connection

## Architecture

```
Retrieval policy (summary-first)
        │
        ▼
Stage 1: global / project / task summaries   // compact, always cheap
        │
        ▼ (only if summaries insufficient)
Stage 2: FTS5 light search → compact candidates
        │
        ▼ (only for top 1-3 results)
Stage 3: full memory detail
```

Memory is organized in a tree:

```
global
└── project
    ├── [project_summary]
    └── task
        ├── [task_summary]
        └── atomic  // decision | fact | gotcha | command | link | convention
```

Optional graph-lite edges connect nodes across the tree: `related_to`, `depends_on`, `affects`, `caused_by`, `supersedes`, `references`.

**Stack:**

- TypeScript + Node.js ≥ 20
- Drizzle ORM + SQLite via libSQL (`@libsql/client`)
- FTS5 for lexical search
- Closure table for efficient subtree traversal
- MCP SDK (`@modelcontextprotocol/sdk`)

## Installation

### Via npm (Recommended)

Add to your MCP client config and the package will be fetched automatically via `npx`.

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):

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

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### From Source

```bash
npm install
npm run build          # outputs to dist/index.js (schema is auto-created on first run)
```

**Custom DB path** - set `MEMORY_DB_PATH` (preferred) or `DATABASE_URL`:

```bash
MEMORY_DB_PATH="/path/to/custom.db" npm run dev
# or point at a remote libSQL / Turso database:
MEMORY_DB_PATH="libsql://your-db.turso.io" MEMORY_DB_AUTH_TOKEN="..." npm run dev
```

After building, point your MCP client at the compiled output:

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "node",
      "args": ["/absolute/path/to/memory-mcp/dist/index.js"]
    }
  }
}
```

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "node",
      "args": ["/absolute/path/to/memory-mcp/dist/index.js"]
    }
  }
}
```

For development without a build step, use `tsx`:

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/memory-mcp/apps/server/src/index.ts"]
    }
  }
}
```

## MCP Tool Reference

| Tool                     | When to use                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `get_global_summary`     | Recurring preferences, coding style, cross-project conventions |
| `get_project_summary`    | Project architecture, key decisions, long-term context         |
| `get_task_summary`       | Resume previous work, recall progress or next steps            |
| `search_memory_light`    | When summaries aren't enough - returns compact candidates only |
| `get_memory_detail`      | Load full detail for a specific memory (follow-up to search)   |
| `remember_decision`      | Store architecture choices, trade-offs, rejected alternatives  |
| `remember_fact`          | Store commands, env facts, gotchas, links, conventions         |
| `upsert_project_summary` | Update after major architectural changes or new conventions    |
| `upsert_task_summary`    | Update after progress, blockers, or plan changes               |

**Retrieval discipline enforced by server instructions:**

1. Always start with summaries
2. Only search if summaries are insufficient
3. Load full detail for at most 1-3 results
4. Never dump large memory bodies by default

## Project Identity

Projects are identified by (in priority order):

1. Normalized git remote URL - most stable, survives moves
2. Git root path - fallback when no remote
3. Normalized workspace path - last resort

This makes memory portable even when clients provide inconsistent paths.

## Development

```bash
npm run typecheck      # TypeScript check
npm run lint           # oxlint
npm run build          # bundle with esbuild
npm run dev            # start dev server with tsx watch
npm run db:studio      # open Drizzle Studio to browse data
npm run db:generate    # generate migration SQL from schema changes
```

**DB location:** `~/.memory-mcp/memory.db` (default). Override with `MEMORY_DB_PATH`, `MEMORY_DATA_DIR`, or `DATABASE_URL`.

**Schema:** `apps/server/src/db/schema.ts` (Drizzle). The schema is re-asserted on every startup via `ensureSchema()` in `apps/server/src/db/migrate.ts`, which also creates the FTS5 virtual table and triggers.

**Remote libSQL / Turso:** set `MEMORY_DB_PATH` to a `libsql://…` URL and `MEMORY_DB_AUTH_TOKEN` to the token.

## Tools

| Tool                     | Use when                                                |
| ------------------------ | ------------------------------------------------------- |
| `get_global_summary`     | recurring preferences, cross-project conventions        |
| `get_project_summary`    | architecture, key decisions, long-term context          |
| `get_task_summary`       | resuming work                                           |
| `search_memory_light`    | summaries aren't enough — compact candidates only       |
| `get_memory_detail`      | full detail for a specific result (follow-up to search) |
| `remember_decision`      | architecture choices, trade-offs, rejected alternatives |
| `remember_fact`          | commands, env facts, gotchas, links, conventions        |
| `upsert_project_summary` | after major arch changes or new conventions             |
| `upsert_task_summary`    | after progress, blockers, or plan changes               |

## Roadmap

- **Phase 9** - Optional semantic fallback (local embeddings, feature-flagged)
- **Future** - Node archival/cleanup for long-lived projects
- **Future** - Multi-user / shared-team memory (requires auth layer)
