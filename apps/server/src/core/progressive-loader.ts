import type {
  SummaryOutput,
  LightSearchResult,
  DetailOutput,
} from "../types/tool";
import {
  getGlobalSummary,
  getProjectSummary,
  getTaskSummary,
} from "../services/summary-service";
import { searchMemoryLight, getMemoryDetail } from "../services/search-service";
import { gateRetrieval } from "./retrieval-gate";
import { MemoryPolicy } from "./memory-policy";

export interface ProgressiveLoadOptions {
  query: string;
  projectId?: string;
  includeGlobal?: boolean;
  autoDetailTopN?: number;
}

export interface SummaryStage {
  global: SummaryOutput | null;
  project: SummaryOutput | null;
  task: SummaryOutput | null;
}

export interface ProgressiveLoadResult {
  stage: "skipped" | "summaries_only" | "light_search" | "full_detail";
  summaries: SummaryStage;
  candidates: LightSearchResult[];
  details: DetailOutput[];
}

const EMPTY_SUMMARIES: SummaryStage = {
  global: null,
  project: null,
  task: null,
};

export async function progressiveLoad(
  options: ProgressiveLoadOptions,
): Promise<ProgressiveLoadResult> {
  const {
    query,
    projectId,
    includeGlobal = true,
    autoDetailTopN = 0,
  } = options;

  const decision = gateRetrieval(query);

  if (decision === "skip") {
    return {
      stage: "skipped",
      summaries: EMPTY_SUMMARIES,
      candidates: [],
      details: [],
    };
  }

  const summaries = await loadSummaryStage(projectId, includeGlobal);

  if (decision === "summaries_only") {
    return { stage: "summaries_only", summaries, candidates: [], details: [] };
  }

  const candidates = await searchMemoryLight(
    query,
    projectId,
    MemoryPolicy.retrieval.lightSearchLimit,
  );

  if (decision === "light_search" && autoDetailTopN === 0) {
    return { stage: "light_search", summaries, candidates, details: [] };
  }

  const topN = Math.min(
    autoDetailTopN || MemoryPolicy.retrieval.detailLoadLimit,
    MemoryPolicy.retrieval.detailLoadLimit,
  );

  const topIds = candidates.slice(0, topN).map((c) => c.id);
  const details = (
    await Promise.all(topIds.map((id) => getMemoryDetail(id)))
  ).filter((d): d is DetailOutput => d !== null);

  return { stage: "full_detail", summaries, candidates, details };
}

async function loadSummaryStage(
  projectId: string | undefined,
  includeGlobal: boolean,
): Promise<SummaryStage> {
  const [global, project, task] = await Promise.all([
    includeGlobal ? getGlobalSummary() : Promise.resolve(null),
    projectId ? getProjectSummary(projectId) : Promise.resolve(null),
    projectId ? getTaskSummary(projectId) : Promise.resolve(null),
  ]);

  return { global, project, task };
}
