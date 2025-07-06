import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Browser mode configuration
    browser: {
      enabled: true,
      name: "chromium",
      provider: "playwright",
      headless: true,
      screenshotOnFailure: true,
    },
    // Test file patterns
    include: ["src/**/*.{test,spec}.{js,ts}"],
    // Exclude patterns
    exclude: ["node_modules", "dist", "coverage"],
    // Test environment setup
    setupFiles: ["./test-setup.ts"],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "test-setup.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/__tests__/**",
        "**/__mocks__/**",
      ],
    },
    // Global test timeout
    testTimeout: 10000,
    // Hooks timeout
    hookTimeout: 10000,
  },
});
