import { describe, expect, it } from "vitest";
import { sha256Hex, shortHash } from "../../src/utils/hash";

describe("sha256Hex", () => {
  it("returns a 64-char lowercase hex digest", () => {
    const digest = sha256Hex("hello");
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("is deterministic", () => {
    expect(sha256Hex("abc")).toBe(sha256Hex("abc"));
  });
});

describe("shortHash", () => {
  it("returns the first 12 chars of the sha256 digest", () => {
    const full = sha256Hex("hello");
    expect(shortHash("hello")).toBe(full.slice(0, 12));
    expect(shortHash("hello")).toHaveLength(12);
  });
});
