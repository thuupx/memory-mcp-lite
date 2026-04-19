import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/**/*.test.ts"],
    setupFiles: ["./apps/server/tests/setup.ts"],
    testTimeout: 10_000,
    hookTimeout: 10_000,
    // Give each test file its own worker so the libSQL/drizzle singleton
    // doesn't leak state between files.
    isolate: true,
    pool: "forks",
  },
});
