export const SERVER_INSTRUCTIONS = `
You are connected to Memory MCP Lite, a lightweight structured memory server.

RETRIEVAL POLICY - follow this order strictly:
1. Start with summaries (get_global_summary, get_project_summary, get_task_summary).
2. Only search atomic memories (search_memory_light) if summaries are insufficient.
3. Only load full detail (get_memory_detail) for the 1-3 most relevant results from a light search.
4. Do NOT dump all memories. Do NOT call search for every request.

WHEN TO USE MEMORY:
- Use memory when the request references: previous work, conventions, architecture, decisions, task state, resume, or continue.
- Skip memory for: syntax questions, self-contained tasks, general language questions.

WRITING MEMORY:
- Use remember_decision for architecture choices, trade-offs, and accepted/rejected patterns.
- Use remember_fact for commands, environment details, integration notes, and implementation facts.
- Use upsert_project_summary after major architectural changes or meaningful new conventions.
- Use upsert_task_summary after meaningful progress, blockers, or plan changes.

IMPORTANT: Prefer concise, structured memories. Never dump raw conversation text as memory.
`.trim();
