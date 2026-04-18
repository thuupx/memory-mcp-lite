import type { AtomicMemoryType } from "../types/memory";

export const MemoryPolicy = {
  importance: {
    defaults: {
      decision: 0.8,
      fact: 0.5,
      gotcha: 0.7,
      command: 0.5,
      link: 0.4,
      convention: 0.7,
    } satisfies Record<AtomicMemoryType, number>,
    summary: 1.0,
    minimum: 0.0,
    maximum: 1.0,
  },

  retrieval: {
    lightSearchLimit: 10,
    detailLoadLimit: 3,
    summaryImportanceThreshold: 0.5,
  },

  retention: {
    maxActiveNodesPerProject: 500,
    staleAfterDays: 90,
    archiveNotDelete: true,
  },

  search: {
    minQueryLength: 2,
    prefixWildcard: true,
  },
} as const;

export type MemoryPolicyType = typeof MemoryPolicy;

export function defaultImportance(memoryType: AtomicMemoryType): number {
  return MemoryPolicy.importance.defaults[memoryType];
}

export function clampImportance(value: number): number {
  return Math.min(
    MemoryPolicy.importance.maximum,
    Math.max(MemoryPolicy.importance.minimum, value),
  );
}
