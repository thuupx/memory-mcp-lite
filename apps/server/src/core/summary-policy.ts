import type { SummaryOutput } from "../types/tool";

const SUMMARY_MAX_AGE_DAYS = 30;
const SUMMARY_STALE_NODE_THRESHOLD = 10;

export type SummaryLevel = "global" | "project" | "task";

export interface SummaryAdvice {
  shouldRefresh: boolean;
  reason: string;
}

export function adviseSummaryRefresh(
  existing: SummaryOutput | null,
  newNodesSinceUpdate: number,
): SummaryAdvice {
  if (!existing) {
    return { shouldRefresh: true, reason: "no_existing_summary" };
  }

  const ageMs = Date.now() - new Date(existing.updated_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays > SUMMARY_MAX_AGE_DAYS) {
    return { shouldRefresh: true, reason: "summary_stale_by_age" };
  }

  if (newNodesSinceUpdate >= SUMMARY_STALE_NODE_THRESHOLD) {
    return { shouldRefresh: true, reason: "many_new_nodes" };
  }

  return { shouldRefresh: false, reason: "summary_is_current" };
}

export function buildSummaryHint(level: SummaryLevel, projectName?: string): string {
  switch (level) {
    case "global":
      return [
        "Write a concise global summary covering:",
        "- Recurring coding preferences and conventions",
        "- Stable workflow patterns",
        "- Cross-project rules that always apply",
        "Keep it under 300 words. Do not include project-specific decisions.",
      ].join("\n");

    case "project":
      return [
        `Write a concise project summary for: ${projectName ?? "this project"}`,
        "Cover:",
        "- Core architecture and tech stack",
        "- Key decisions and accepted patterns",
        "- Rejected approaches and reasons",
        "- Current development conventions",
        "Keep it under 400 words. Do not include task-level progress.",
      ].join("\n");

    case "task":
      return [
        "Write a concise task summary covering:",
        "- What was accomplished in the current task",
        "- Active blockers or open questions",
        "- Immediate next steps",
        "Keep it under 200 words. Focus on resumability.",
      ].join("\n");
  }
}

export function isSummaryFresh(summary: SummaryOutput | null): boolean {
  if (!summary) return false;
  const ageMs = Date.now() - new Date(summary.updated_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays <= SUMMARY_MAX_AGE_DAYS;
}
