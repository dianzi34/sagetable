import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Apply pending Prisma migrations to DATABASE_URL_TEST before integration suites run.
 */
export function setup(): void {
  const testUrl = process.env.DATABASE_URL_TEST?.trim();
  if (!testUrl) {
    return;
  }

  const prismaBin = path.resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "prisma.cmd" : "prisma",
  );

  execFileSync(prismaBin, ["migrate", "deploy"], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testUrl,
    },
  });
}
