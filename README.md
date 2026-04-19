# Memory MCP Lite

A **local-first, token-efficient MCP memory server** for AI coding clients (Windsurf, Cursor, Claude Desktop, and any MCP-compatible client).

## What this is

A lightweight, structured memory layer that persists across AI coding sessions. It complements your AI client's built-in context by storing durable, structured knowledge - not raw chat logs.

**What it stores:**

- Technical decisions and their rationale
- Project architecture and conventions
- Gotchas, commands, and environment facts
- Task state for resumable work sessions
- Hierarchical summaries (global → project → task)

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
Stage 1: global / project / task summaries   ← compact, always cheap
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
        └── atomic  ← decision | fact | gotcha | command | link | convention
```

Optional graph-lite edges connect nodes across the tree: `related_to`, `depends_on`, `affects`, `caused_by`, `supersedes`, `references`.

**Stack:**

- TypeScript + Node.js ≥ 20
- Prisma 7 + SQLite (`better-sqlite3` adapter)
- FTS5 for lexical search
- Closure table for efficient subtree traversal
- MCP SDK (`@modelcontextprotocol/sdk`)

## Setup

```bash
npm install
npm run db:push        # creates ~/.memory-mcp/memory.db
npm run dev            # stdio MCP server (for development)
```

**Custom DB path** - set `DATABASE_URL` environment variable:

```bash
DATABASE_URL="file:/path/to/custom.db" npm run dev
```

**Build for production:**

```bash
npm run build
node dist/apps/server/src/index.js
```

## MCP Client Configuration

### Windsurf

Add to your MCP settings (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "node",
      "args": ["/absolute/path/to/memory-mcp/dist/apps/server/src/index"],
      "env": {}
    }
  }
}
```

For development with `tsx`:

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/memory-mcp/apps/server/src/index.ts"],
      "env": {}
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memory-mcp-lite": {
      "command": "node",
      "args": ["/absolute/path/to/memory-mcp/dist/apps/server/src/index"]
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
npm run db:push        # sync schema to DB (no migration history)
npm run db:migrate     # create migration files (for production)
npm run db:studio      # open Prisma Studio to browse data
npm run dev            # start dev server with tsx watch
```

**DB location:** `~/.memory-mcp/memory.db` (default)

**Schema:** `prisma/schema.prisma` - edit here, then run `npm run db:push`

**FTS5 index:** created at server startup by `initDb()` in `db/client.ts` (Prisma does not manage virtual tables)

## Folder Structure

```
apps/server/src/
  index.ts                    # entry point
  server.ts                   # MCP server wiring
  config/
    env.ts                    # DB path, server name/version
    constants.ts              # numeric defaults
  core/
    project-resolver.ts       # robust project identity resolution
    retrieval-gate.ts         # gating policy (skip / summaries / search / detail)
    summary-policy.ts         # summary freshness and update advice
    progressive-loader.ts     # 3-stage staged retrieval coordinator
    memory-policy.ts          # importance defaults and retention config
  db/
    client.ts                 # PrismaClient singleton + FTS5 init
    schema.ts                 # FTS5 SQL + edge relation type definitions
    repositories/             # typed async data access functions
  services/
    summary-service.ts        # global / project / task summary CRUD
    search-service.ts         # FTS5 light search + detail loader
    memory-service.ts         # atomic memory write path
    graph-lite-service.ts     # edge CRUD and related node queries
  mcp/
    instructions.ts           # server-level retrieval instructions
    tool-descriptions.ts      # strong tool descriptions
    tools/                    # 9 tool handlers with Zod validation
  types/
    memory.ts                 # MemoryNode, MemoryLevel, AtomicMemoryType
    project.ts                # Project, resolution types
    tool.ts                   # SummaryOutput, LightSearchResult, DetailOutput
  utils/
    time.ts ids.ts hash.ts git.ts
prisma/
  schema.prisma               # Prisma 7 schema (projects, nodes, closure, edges)
prisma.config.ts              # datasource URL for migrate/push
```

## Roadmap

- **Phase 9** - Optional semantic fallback (local embeddings, feature-flagged)
- **Future** - Node archival/cleanup for long-lived projects
- **Future** - Multi-user / shared-team memory (requires auth layer)
