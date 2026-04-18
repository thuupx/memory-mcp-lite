export const TOOL_DESCRIPTIONS = {
  get_global_summary:
    "Get the concise global memory summary for this user. Use this when the request depends on recurring preferences, coding style, or stable workflow conventions. Prefer this before searching detailed memories.",

  get_project_summary:
    "Get the concise summary for the current project. Use this first when the request depends on project architecture, conventions, key decisions, or long-term project context. Prefer this before calling memory search tools.",

  get_task_summary:
    "Get the concise summary of the current task or recent work state. Use this when the user asks to continue previous work, resume a task, or recall recent progress, blockers, or next steps.",

  search_memory_light:
    "Search compact memory candidates lightly. Use only when global, project, or task summaries do not provide enough context. This tool returns short candidate records, not full memory content. Follow up with get_memory_detail only for the most relevant 1–3 results.",

  get_memory_detail:
    "Load the full detail of a specific memory after a summary or light search suggests it is relevant. Do not use this as the first retrieval step.",

  remember_decision:
    "Store a durable technical decision for the current project or task. Use for architecture choices, trade-offs, accepted patterns, and rejected alternatives that may matter in future sessions.",

  remember_fact:
    "Store a concise factual memory such as a command, environment detail, integration note, or implementation fact that may be useful later.",

  upsert_project_summary:
    "Create or update the structured project summary. Use after major architectural changes, new conventions, or meaningful decisions that should become part of the project's default context.",

  upsert_task_summary:
    "Create or update the current task summary. Use after meaningful progress, blockers, or plan changes so future sessions can resume work efficiently.",
} as const;
