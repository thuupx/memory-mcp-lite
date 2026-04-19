import { describe, expect, it } from "vitest";
import {
  normalizeRemoteUrl,
  extractRepoName,
} from "../../src/utils/git";

describe("normalizeRemoteUrl", () => {
  it("lowercases the URL and strips a trailing .git", () => {
    expect(normalizeRemoteUrl("https://GitHub.com/acme/REPO.git")).toBe(
      "https://github.com/acme/repo",
    );
  });

  it("rewrites git@host:org/repo to https://host/org/repo", () => {
    expect(normalizeRemoteUrl("git@github.com:acme/repo.git")).toBe(
      "https://github.com/acme/repo",
    );
  });

  it("removes a trailing slash", () => {
    expect(normalizeRemoteUrl("https://github.com/acme/repo/")).toBe(
      "https://github.com/acme/repo",
    );
  });

  it("is idempotent for already-normalized urls", () => {
    const url = "https://github.com/acme/repo";
    expect(normalizeRemoteUrl(normalizeRemoteUrl(url))).toBe(url);
  });
});

describe("extractRepoName", () => {
  it("returns the last path segment", () => {
    expect(extractRepoName("https://github.com/acme/repo.git")).toBe("repo");
    expect(extractRepoName("git@github.com:acme/repo.git")).toBe("repo");
  });

  it("returns null for an empty string", () => {
    expect(extractRepoName("")).toBe("");
  });
});
