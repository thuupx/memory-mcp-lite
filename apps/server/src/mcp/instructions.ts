export const SERVER_INSTRUCTIONS = `
You are connected to Memory MCP Lite, a lightweight structured memory server.

HOW TO READ MEMORIES (strict order):
1. Call the summary tools first: get_global_summary, get_project_summary, get_task_summary.
   - get_global_summary: cross-project user preferences and style.
   - get_project_summary: architecture, conventions, decisions for THIS project.
   - get_task_summary: current task progress, blockers, next steps.
2. If summaries are insufficient, call search_memory_light ONCE with a concrete query.
   - Returns compact candidates — id, title, summary, memory_type, importance.
3. For at most 1-3 relevant candidates, call get_memory_detail(id) to load full content.
4. Never loop search + detail across all memories. Stop once you have enough context.

WHEN TO USE MEMORY AT ALL:
- Use memory when the request references: previous work, conventions, architecture,
  decisions, task state, or phrases like "resume", "continue", "remember".
- Skip memory for: syntax questions, self-contained tasks, general language questions.

HOW TO WRITE MEMORIES:
- remember_decision: architecture choices, trade-offs, accepted/rejected patterns.
- remember_fact: commands, env notes, integration gotchas, conventions.
  - Set fact_type to "command" | "gotcha" | "link" | "convention" | "fact"
    so the search/ranking layer can use it.
- upsert_project_summary: after meaningful architecture / convention changes.
- upsert_task_summary: after progress, blockers, or plan changes worth resuming.

PROJECT CONTEXT PARAMETERS:
- Every write and scoped-read tool accepts workspace_path / git_root / remote_url / project_id.
- Pass workspace_path (absolute) as the default — the server will derive git_root and remote_url.
- project_id overrides auto-resolution once you know it.

STRUCTURED OUTPUTS:
- Every tool returns both a JSON text block and a structuredContent object.
- Rely on structuredContent for programmatic access.

BE CONCISE: store structured summaries, not raw chat transcripts.
`.trim();
