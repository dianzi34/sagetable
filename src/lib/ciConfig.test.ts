// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(__dirname, "../..");

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

describe("CI and Vercel deployment preview configuration", () => {
  it("defines a GitHub Actions workflow running lint, typecheck, unit, integration, build, and E2E checks on PRs", () => {
    const ciPath = ".github/workflows/ci.yml";
    expect(existsSync(path.join(ROOT_DIR, ciPath))).toBe(true);

    const ciYaml = readRepoFile(ciPath);
    expect(ciYaml).toContain("pull_request:");
    expect(ciYaml).toContain("push:");
    expect(ciYaml).toContain("main");
    expect(ciYaml).toMatch(/node-version:\s*["']?20["']?/);
    expect(ciYaml).toContain("image: postgres:16");
    expect(ciYaml).toContain("5433:5432");
    expect(ciYaml).toContain("DATABASE_URL_TEST");
    expect(ciYaml).toContain("npm run lint");
    expect(ciYaml).toContain("npm run typecheck");
    expect(ciYaml).toContain("npm test");
    expect(ciYaml).toContain("npm run test:integration");
    expect(ciYaml).toContain("npm run build");
    expect(ciYaml).toContain("npm run test:e2e");

    expect(ciYaml).not.toMatch(/ANTHROPIC_API_KEY|OPENAI_API_KEY|VOYAGE_API_KEY/);
  });

  it("configures Vercel deployment settings in vercel.json without external AI API keys", () => {
    const vercelPath = "vercel.json";
    expect(existsSync(path.join(ROOT_DIR, vercelPath))).toBe(true);

    const vercelConfig = JSON.parse(readRepoFile(vercelPath)) as {
      framework?: string;
      installCommand?: string;
      buildCommand?: string;
      env?: Record<string, string>;
    };

    expect(vercelConfig.framework).toBe("nextjs");
    expect(vercelConfig.installCommand).toBe("npm ci");
    expect(vercelConfig.buildCommand).toContain("prisma generate");
    expect(vercelConfig.buildCommand).toContain("npm run build");

    const serialized = JSON.stringify(vercelConfig);
    expect(serialized).not.toMatch(
      /ANTHROPIC_API_KEY|OPENAI_API_KEY|VOYAGE_API_KEY/,
    );
  });

  it("defines a safe Vercel preview workflow supporting PR previews and main deploys when credentials are configured", () => {
    const previewPath = ".github/workflows/vercel-preview.yml";
    expect(existsSync(path.join(ROOT_DIR, previewPath))).toBe(true);

    const previewYaml = readRepoFile(previewPath);
    expect(previewYaml).toContain("pull_request:");
    expect(previewYaml).toContain("push:");
    expect(previewYaml).toContain("VERCEL_TOKEN");
    expect(previewYaml).toContain("VERCEL_ORG_ID");
    expect(previewYaml).toContain("VERCEL_PROJECT_ID");
    expect(previewYaml).toContain("vercel build");
    expect(previewYaml).toContain("vercel deploy --prebuilt");
    expect(previewYaml).toContain("exit 1");
    expect(previewYaml).toContain("Missing required Vercel secrets");
    expect(previewYaml).not.toMatch(
      /ANTHROPIC_API_KEY|OPENAI_API_KEY|VOYAGE_API_KEY/,
    );
  });

  it("ensures package.json typecheck regenerates Next.js types and avoids external AI SDKs", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(pkg.scripts?.typecheck).toContain("next typegen");
    expect(pkg.scripts?.typecheck).toContain("tsc --noEmit");
    expect(pkg.scripts?.postinstall).toBe("prisma generate");

    const allDeps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
    expect(allDeps["@anthropic-ai/sdk"]).toBeUndefined();
    expect(allDeps["voyageai"]).toBeUndefined();
    expect(allDeps["openai"]).toBeUndefined();
  });

  it("includes E2E specs for health checks, home page, and core roundtable cards", () => {
    expect(existsSync(path.join(ROOT_DIR, "e2e/health.spec.ts"))).toBe(true);
    expect(existsSync(path.join(ROOT_DIR, "e2e/home.spec.ts"))).toBe(true);
    expect(existsSync(path.join(ROOT_DIR, "e2e/roundtable.spec.ts"))).toBe(
      true,
    );
  });
});
