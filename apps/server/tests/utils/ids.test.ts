import { describe, expect, it } from "vitest";
import { generateId } from "../../src/utils/ids";

describe("generateId", () => {
  it("produces a 16-char hex string when no prefix is given", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it("prefixes the id with `<prefix>_` when a prefix is given", () => {
    const id = generateId("mem");
    expect(id).toMatch(/^mem_[0-9a-f]{16}$/);
  });

  it("generates unique ids across calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId("x")));
    expect(ids.size).toBe(1000);
  });
});
