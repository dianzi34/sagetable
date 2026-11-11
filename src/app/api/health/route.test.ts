import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 200 with ok status without requiring env vars or a database", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { status: "ok" },
    });
  });
});
