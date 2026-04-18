export function nowIso(): string {
  return new Date().toISOString();
}

export function isMoreRecentThan(
  isoDate: string,
  thresholdMs: number,
): boolean {
  return Date.now() - new Date(isoDate).getTime() < thresholdMs;
}
