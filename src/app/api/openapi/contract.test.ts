import fs from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

function findRouteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (entry.name === "route.ts") {
      files.push(fullPath);
    }
  }
  return files;
}

function routeFileToApiPath(apiRoot: string, filePath: string): string {
  const rel = path.relative(apiRoot, filePath);
  const dir = path.dirname(rel);
  const route = dir === "." ? "/api" : `/api/${dir}`;
  return route.replace(/\[([^\]]+)\]/g, "{$1}");
}

function extractRouteMethods(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const methodRegex =
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/g;
  const methods: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1].toLowerCase());
  }
  return methods;
}

describe("OpenAPI Spec Contract Test", () => {
  const openApiPath = path.resolve(process.cwd(), "docs/api/openapi.yaml");
  const apiDir = path.resolve(process.cwd(), "src/app/api");

  it("ensures docs/api/openapi.yaml exists and is valid OpenAPI 3.1", () => {
    expect(
      fs.existsSync(openApiPath),
      "docs/api/openapi.yaml does not exist"
    ).toBe(true);

    const raw = fs.readFileSync(openApiPath, "utf-8");
    const spec = load(raw) as Record<string, unknown>;

    expect(spec).toBeDefined();
    expect(typeof spec).toBe("object");
    expect(spec.openapi).toMatch(/^3\.1\./);
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
  });

  it("fails if any route.ts under src/app/api is missing from openapi.yaml (method + path)", () => {
    expect(
      fs.existsSync(openApiPath),
      "docs/api/openapi.yaml does not exist"
    ).toBe(true);

    const raw = fs.readFileSync(openApiPath, "utf-8");
    const spec = load(raw) as {
      paths?: Record<string, Record<string, unknown>>;
    };
    expect(spec?.paths).toBeDefined();

    const routeFiles = findRouteFiles(apiDir);
    expect(routeFiles.length).toBeGreaterThan(0);

    const missingEndpoints: string[] = [];

    for (const file of routeFiles) {
      const apiPath = routeFileToApiPath(apiDir, file);
      const methods = extractRouteMethods(file);

      for (const method of methods) {
        const documented = spec.paths?.[apiPath]?.[method];
        if (!documented) {
          missingEndpoints.push(
            `${method.toUpperCase()} ${apiPath} (from ${path.relative(process.cwd(), file)})`
          );
        }
      }
    }

    expect(
      missingEndpoints,
      `The following endpoints are missing from docs/api/openapi.yaml:\n${missingEndpoints.join("\n")}`
    ).toEqual([]);
  });

  it("fails if openapi.yaml documents a method + path that has no corresponding route handler", () => {
    expect(
      fs.existsSync(openApiPath),
      "docs/api/openapi.yaml does not exist"
    ).toBe(true);

    const raw = fs.readFileSync(openApiPath, "utf-8");
    const spec = load(raw) as {
      paths?: Record<string, Record<string, unknown>>;
    };
    expect(spec?.paths).toBeDefined();

    const routeFiles = findRouteFiles(apiDir);
    const existingEndpoints = new Set<string>();

    for (const file of routeFiles) {
      const apiPath = routeFileToApiPath(apiDir, file);
      const methods = extractRouteMethods(file);
      for (const method of methods) {
        existingEndpoints.add(`${method.toLowerCase()} ${apiPath}`);
      }
    }

    const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "options", "head"];
    const staleEndpoints: string[] = [];

    for (const [docPath, pathItem] of Object.entries(spec.paths || {})) {
      if (!pathItem || typeof pathItem !== "object") continue;
      for (const key of Object.keys(pathItem)) {
        const method = key.toLowerCase();
        if (HTTP_METHODS.includes(method)) {
          const endpointKey = `${method} ${docPath}`;
          if (!existingEndpoints.has(endpointKey)) {
            staleEndpoints.push(`${method.toUpperCase()} ${docPath}`);
          }
        }
      }
    }

    expect(
      staleEndpoints,
      `The following endpoints in docs/api/openapi.yaml have no route handler under src/app/api:\n${staleEndpoints.join("\n")}`
    ).toEqual([]);
  });
});
