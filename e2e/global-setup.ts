import { execFileSync } from "node:child_process";
import path from "node:path";

export default async function globalSetup(): Promise<void> {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_TEST?.trim() ||
    "";
  if (!url) return;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      throw new Error(
        `Refusing to run E2E globalSetup on non-local database host "${parsed.hostname}". Only localhost or 127.0.0.1 is permitted.`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Refusing to run")) {
      throw err;
    }
    throw new Error(`Invalid database URL provided to E2E globalSetup: ${err}`);
  }

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
