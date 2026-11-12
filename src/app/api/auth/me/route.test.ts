import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { signSessionToken } from "@/server/auth/jwt";
import { GET } from "./route";

const VALID_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/sagetable";
const VALID_JWT_SECRET = "sagetable-me-route-test-secret-32-chars!";

describe("GET /api/auth/me", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: VALID_DATABASE_URL,
      JWT_SECRET: VALID_JWT_SECRET,
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 200 with the authenticated user from the session cookie", async () => {
    const token = await signSessionToken({
      id: "admin-1",
      email: "admin@sagetable.org",
      role: "admin",
    });

    const response = await GET(
      new Request("http://localhost:3000/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        user: {
          id: "admin-1",
          email: "admin@sagetable.org",
          role: "admin",
        },
      },
    });
  });

  it("returns 401 when unauthenticated or given an invalid session cookie", async () => {
    const unauthRes = await GET(new Request("http://localhost:3000/api/auth/me"));
    expect(unauthRes.status).toBe(401);
    await expect(unauthRes.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });

    const invalidRes = await GET(
      new Request("http://localhost:3000/api/auth/me", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=bad-jwt` },
      }),
    );
    expect(invalidRes.status).toBe(401);
  });
});
