import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "tests/**/*.test.ts", "examples/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { statements: 90, lines: 90, branches: 90, functions: 80 },
    },
  },
});
