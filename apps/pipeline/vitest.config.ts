import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@wywy/http": path.resolve(__dirname, "../http/src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
