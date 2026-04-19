import { describe, expect, it } from "vitest";
import { nowIso, isMoreRecentThan } from "../../src/utils/time";

describe("nowIso", () => {
  it("returns a parseable ISO-8601 UTC string", () => {
    const iso = nowIso();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Number.isNaN(Date.parse(iso))).toBe(false);
  });
});

describe("isMoreRecentThan", () => {
  it("returns true for a timestamp within the threshold", () => {
    const iso = new Date(Date.now() - 1000).toISOString();
    expect(isMoreRecentThan(iso, 5000)).toBe(true);
  });

  it("returns false for a timestamp older than the threshold", () => {
    const iso = new Date(Date.now() - 10_000).toISOString();
    expect(isMoreRecentThan(iso, 5000)).toBe(false);
  });
});
