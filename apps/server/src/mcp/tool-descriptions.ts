/**
 * Tool metadata table — single source of truth used both when registering
 * tools with the MCP server and when documenting them in the README.
 *
 * Descriptions follow a consistent shape so agents can route calls deterministically:
 *
 *   <one-line purpose>
 *   USE WHEN: <concrete trigger conditions>
 *   DO NOT USE WHEN: <anti-patterns>
 *   RETURNS: <short description of structured output>
 */
export interface ToolMeta {
  title: string;
  description: string;
  /** Read-only tools do not mutate state; used for `annotations.readOnlyHint`. */
  readOnly: boolean;
  /**
   * Idempotent tools return the same outcome for repeated identical calls
   * (e.g. upserts). Used for `annotations.idempotentHint`.
   */
  idempotent: boolean;
}

export const TOOL_META: Record<string, ToolMeta> = {
  get_global_summary: {
    title: "Get global memory summary",
    description: [
      "Return the user's cross-project global memory summary (coding style, recurring preferences, stable workflow conventions).",
      "USE WHEN: the request depends on durable user-level preferences that apply across projects.",
      "DO NOT USE WHEN: the question is project-specific, purely syntactic, or self-contained.",
      "RETURNS: { found, summary? } where summary has { id, title, summary, updated_at }.",
    ].join("\n"),
    readOnly: true,
    idempotent: true,
  },

  get_project_summary: {
    title: "Get project memory summary",
    description: [
      "Return the concise summary for the current project (architecture, key decisions, conventions).",
      "USE WHEN: the request depends on project-level context — architecture, conventions, long-term decisions, or project overview.",
      "DO NOT USE WHEN: the request is about the current task's state, global preferences, or is self-contained.",
      "CALL ORDER: prefer this before search_memory_light. Pass workspace_path OR git_root OR remote_url OR project_id so the server can identify the project.",
      "RETURNS: { project_id, found, summary? } where summary has { id, title, summary, updated_at }.",
    ].join("\n"),
    readOnly: true,
    idempotent: true,
  },

  get_task_summary: {
    title: "Get task memory summary",
    description: [
      "Return the current task summary (what was done, blockers, next steps).",
      "USE WHEN: the user asks to continue, resume, or recall recent work on a task.",
      "DO NOT USE WHEN: there is no prior task state referenced, or the request is about global / project-level context.",
      "RETURNS: { project_id, found, summary? } where summary has { id, title, summary, updated_at }.",
    ].join("\n"),
    readOnly: true,
    idempotent: true,
  },

  search_memory_light: {
    title: "Search memories (compact candidates)",
    description: [
      "Lexical FTS5 search across atomic memories. Returns compact candidate records only — not full content.",
      "USE WHEN: the summary tools above do not provide enough context AND the request includes a concrete search phrase (command name, symbol, past event).",
      "DO NOT USE WHEN: summaries already answer the question, the query is empty/too vague, or you only need the global/project/task summary.",
      "CALL ORDER: always call summary tools first. Then follow up this tool's top 1-3 results with get_memory_detail — never dump all candidates.",
      "RETURNS: { count, results: [{ id, title, summary, memory_type, level, importance, updated_at }] }.",
    ].join("\n"),
    readOnly: true,
    idempotent: true,
  },

  get_memory_detail: {
    title: "Load full memory detail",
    description: [
      "Load the full body of a specific memory by id.",
      "USE WHEN: a search_memory_light candidate looks relevant and you need its full content / metadata.",
      "DO NOT USE WHEN: you have not identified a specific memory id, or you are tempted to call this many times in a row.",
      "LIMIT: call at most 3 times per user turn.",
      "RETURNS: { found, memory? } where memory has { id, title, summary, content, memory_type, level, importance, source, metadata, created_at, updated_at }.",
    ].join("\n"),
    readOnly: true,
    idempotent: true,
  },

  remember_decision: {
    title: "Store a technical decision",
    description: [
      "Persist a durable technical decision (architecture choice, trade-off, accepted pattern, rejected alternative).",
      "USE WHEN: the user confirms a decision that should outlive the current session.",
      "DO NOT USE WHEN: the info is a transient fact/command (use remember_fact) or raw chat log.",
      "IMPORTANCE: defaults to 0.8 — override only if the user signals otherwise.",
      "RETURNS: { project_id, memory_id }.",
    ].join("\n"),
    readOnly: false,
    idempotent: false,
  },

  remember_fact: {
    title: "Store a fact / command / gotcha",
    description: [
      "Persist a concise atomic memory: fact, command, gotcha, link, or convention.",
      "USE WHEN: the user gives concrete reusable info (a command, env detail, integration note, rule).",
      "DO NOT USE WHEN: the info is a major decision (use remember_decision) or a summary (use upsert_*_summary).",
      "FACT TYPES: fact | command | gotcha | link | convention | decision (prefer remember_decision for 'decision').",
      "RETURNS: { project_id, memory_id }.",
    ].join("\n"),
    readOnly: false,
    idempotent: false,
  },

  upsert_project_summary: {
    title: "Create or update project summary",
    description: [
      "Idempotently create or replace the structured project summary node.",
      "USE WHEN: architecture, conventions, or key decisions changed enough that a fresh summary is worth storing.",
      "DO NOT USE WHEN: the change is a single fact / decision (use remember_fact or remember_decision).",
      "RETURNS: { project_id, summary_id }.",
    ].join("\n"),
    readOnly: false,
    idempotent: true,
  },

  upsert_task_summary: {
    title: "Create or update task summary",
    description: [
      "Idempotently create or replace the current task summary (progress, blockers, next steps).",
      "USE WHEN: meaningful progress was made, a blocker appeared, or the plan changed and the next session must resume.",
      "DO NOT USE WHEN: the update fits better as a single fact or decision.",
      "RETURNS: { project_id, summary_id }.",
    ].join("\n"),
    readOnly: false,
    idempotent: true,
  },
} as const;

/**
 * Back-compat alias used in a handful of older call-sites.
 * Kept as a plain description map.
 */
export const TOOL_DESCRIPTIONS: Record<keyof typeof TOOL_META, string> =
  Object.fromEntries(
    Object.entries(TOOL_META).map(([k, v]) => [k, v.description]),
  ) as Record<keyof typeof TOOL_META, string>;
