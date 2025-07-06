import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "rolldown";

// Plugin to copy static assets
function copyAssets() {
  return {
    name: "copy-assets",
    generateBundle() {
      // Copy style.css
      const styleSrc = path.resolve(__dirname, "src/style.css");
      const styleDest = path.resolve(__dirname, "dist/style.css");
      if (fs.existsSync(styleSrc)) {
        const dir = path.dirname(styleDest);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.copyFileSync(styleSrc, styleDest);
      }

      // Copy index.js (Camunda Modeler plugin manifest)
      const indexSrc = path.resolve(__dirname, "src/index.js");
      const indexDest = path.resolve(__dirname, "dist/index.js");
      if (fs.existsSync(indexSrc)) {
        fs.copyFileSync(indexSrc, indexDest);
      }
    },
  };
}

const isProduction = process.env.NODE_ENV === "production";

// ESM build for browser/bpmn-js
const esmConfig = defineConfig({
  input: {
    "bpmn-js-entry": "src/bpmn-js-entry.ts",
  },
  output: {
    dir: "dist",
    format: "es",
    entryFileNames: "[name].js",
    chunkFileNames: "[name]-[hash].js",
    exports: "named",
    minify: isProduction,
  },
  external: ["bpmn-js", "marked"],
  plugins: [copyAssets()],
  treeshake: true,
});

// CommonJS build for Camunda Modeler - bundle all dependencies
const cjsConfig = defineConfig({
  input: {
    "camunda-modeler-entry": "src/camunda-modeler-entry.ts",
  },
  output: {
    dir: "dist",
    format: "cjs",
    entryFileNames: "[name].js",
    chunkFileNames: "[name]-[hash].js",
    exports: "named",
    minify: isProduction,
  },
  treeshake: true,
});

export default [esmConfig, cjsConfig];
