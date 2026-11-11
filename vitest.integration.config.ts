import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "server-only": path.resolve(__dirname, "./vitest.server-only.ts"),
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.integration.test.{ts,tsx}"],
      exclude: ["node_modules", ".next", "e2e"],
      fileParallelism: false,
    },
  };
});
