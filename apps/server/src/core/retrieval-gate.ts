export type RetrievalDecision = "skip" | "summaries_only" | "light_search" | "full_detail";

const SUMMARY_KEYWORDS = [
  "continue",
  "resume",
  "convention",
  "architecture",
  "decision",
  "pattern",
  "previous",
  "last time",
  "we decided",
  "project structure",
  "we use",
  "how do we",
  "our approach",
  "remind me",
];

const SEARCH_KEYWORDS = [
  "how did we",
  "what was",
  "do you remember",
  "recall",
  "find the",
  "where is",
  "which file",
  "the command for",
];

export function gateRetrieval(requestText: string): RetrievalDecision {
  const lower = requestText.toLowerCase();

  if (SEARCH_KEYWORDS.some((k) => lower.includes(k))) {
    return "light_search";
  }
  if (SUMMARY_KEYWORDS.some((k) => lower.includes(k))) {
    return "summaries_only";
  }

  return "skip";
}
