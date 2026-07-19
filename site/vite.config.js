import { defineConfig } from "vite";

// Relative base so the built site works when hosted under any subpath
// (e.g. apps.charliekrug.com/order-flow), not just the domain root.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**", "test-results/**"],
    coverage: {
      provider: "v8",
      include: ["js/audio.js", "js/format.js", "js/ladder-model.js", "js/timeline.js", "js/tween.js"],
      thresholds: {
        lines: 85,
      },
    },
  },
});
