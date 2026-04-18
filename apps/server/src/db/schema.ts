/**
 * Supported graph-lite edge relation types.
 */
export const EDGE_RELATIONS = [
  "related_to",
  "depends_on",
  "affects",
  "caused_by",
  "supersedes",
  "references",
] as const;

export type EdgeRelation = (typeof EDGE_RELATIONS)[number];
