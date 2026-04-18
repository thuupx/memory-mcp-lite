import { execSync } from "child_process";

export function tryGetGitRoot(cwd: string): string | null {
  try {
    const result = execSync("git rev-parse --show-toplevel", {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim();
  } catch {
    return null;
  }
}

export function tryGetRemoteUrl(cwd: string): string | null {
  try {
    const result = execSync("git remote get-url origin", {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim();
  } catch {
    return null;
  }
}

export function normalizeRemoteUrl(url: string): string {
  let normalized = url.trim().toLowerCase();
  normalized = normalized.replace(/\.git$/i, "");
  normalized = normalized.replace(/^git@([^:]+):/, "https://$1/");
  normalized = normalized.replace(/\/$/, "");
  return normalized;
}

export function extractRepoName(url: string): string | null {
  try {
    const normalized = normalizeRemoteUrl(url);
    const parts = normalized.split("/");
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}
