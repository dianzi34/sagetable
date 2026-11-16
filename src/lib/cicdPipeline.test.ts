// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT_DIR = path.resolve(__dirname, "../..");

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

describe("US-10 / Issue #16: Multi-stage CI/CD, CodeQL, Environment Management, and Prod Deploy", () => {
  it("defines a multi-stage CI pipeline with quality, security audit, unit/integration, and E2E stages", () => {
    const ciPath = ".github/workflows/ci.yml";
    expect(existsSync(path.join(ROOT_DIR, ciPath))).toBe(true);

    const ciYaml = readRepoFile(ciPath);
    expect(ciYaml).toContain("npm audit");
    expect(ciYaml).toMatch(/npm run lint/);
    expect(ciYaml).toMatch(/npm run typecheck/);
    expect(ciYaml).toMatch(/npm test/);
    expect(ciYaml).toMatch(/npm run test:integration/);
    expect(ciYaml).toMatch(/npm run test:e2e/);

    // Verify multi-stage structure via job dependencies
    expect(ciYaml).toContain("needs:");
  });

  it("configures CodeQL static security analysis workflow for JavaScript and TypeScript", () => {
    const codeqlPath = ".github/workflows/codeql.yml";
    expect(existsSync(path.join(ROOT_DIR, codeqlPath))).toBe(true);

    const codeqlYaml = readRepoFile(codeqlPath);
    expect(codeqlYaml).toContain("github/codeql-action/init");
    expect(codeqlYaml).toContain("github/codeql-action/analyze");
    expect(codeqlYaml).toContain("javascript-typescript");
  });

  it("configures automated production deployment to Vercel on merge to main", () => {
    const deployPath = ".github/workflows/deploy-production.yml";
    expect(existsSync(path.join(ROOT_DIR, deployPath))).toBe(true);

    const deployYaml = readRepoFile(deployPath);
    expect(deployYaml).toContain("workflow_run:");
    expect(deployYaml).toContain('workflows: ["CI"]');
    expect(deployYaml).toContain("branches:\n      - main");
    expect(deployYaml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(deployYaml).not.toMatch(/if:.*secrets\./);
    expect(deployYaml).toContain("vercel pull");
    expect(deployYaml).toContain("--environment=production");
    expect(deployYaml).toContain("vercel build --prod");
    expect(deployYaml).toContain("vercel deploy --prebuilt --prod");
    expect(deployYaml).toContain("VERCEL_TOKEN");
    expect(deployYaml).toContain("VERCEL_ORG_ID");
    expect(deployYaml).toContain("VERCEL_PROJECT_ID");
    expect(deployYaml).not.toMatch(/ANTHROPIC_API_KEY|OPENAI_API_KEY|VOYAGE_API_KEY/);
  });

  it("documents environment-specific configuration and secret isolation in docs/environments.md", () => {
    const docPath = "docs/environments.md";
    expect(existsSync(path.join(ROOT_DIR, docPath))).toBe(true);

    const doc = readRepoFile(docPath);
    expect(doc).toMatch(/# (?:Environment Configuration|Environments)/i);
    expect(doc).toContain("Local");
    expect(doc).toContain("Preview");
    expect(doc).toContain("Production");
    expect(doc).toContain("DATABASE_URL");
    expect(doc).toContain("JWT_SECRET");
    expect(doc).toContain("NEXT_PUBLIC_");
  });
});
