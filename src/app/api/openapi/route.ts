import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const specPath = path.resolve(process.cwd(), "docs/api/openapi.yaml");
  const yamlContent = fs.readFileSync(specPath, "utf-8");

  return new Response(yamlContent, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
    },
  });
}
