import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/openapi", () => {
  it("serves the OpenAPI 3.1 specification", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    const contentType = response.headers.get("content-type") || "";
    expect(contentType).toMatch(/(yaml|openapi\+yaml|text\/yaml)/);

    const body = await response.text();
    expect(body).toContain("openapi: 3.1");
    expect(body).toContain("/api/health");
  });
});
