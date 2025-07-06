import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    "packages/*": {
      entry: [
        "src/bpmn-js-entry.ts",
        "src/camunda-modeler-entry.ts",
        "rolldown.config.ts",
      ],
      project: ["src/**/*.ts"],
      ignore: ["src/typings/**/*"],
    },
    "examples/*": {},
  },
  ignoreBinaries: ["playwright"],
  ignoreDependencies: ["playwright", "@vitest/coverage-v8"],
};

export default config;
