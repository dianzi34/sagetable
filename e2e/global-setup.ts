import { execFileSync } from "node:child_process";
import path from "node:path";

export default async function globalSetup(): Promise<void> {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_TEST?.trim() ||
    "";
  if (!url) return;

  const tsxBin = path.resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsx.cmd" : "tsx",
  );

  execFileSync(tsxBin, ["prisma/seed.ts"], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: url,
    },
  });
}
