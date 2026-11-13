import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.fn();
const checkDailyRoundtableLimitMock = vi.fn();
const enforceDailyRoundtableLimitMock = vi.fn();

vi.mock("@/server/auth/session", () => ({
  requireUser: (...args: unknown[]) => requireUserMock(...args),
}));

vi.mock("@/server/services/usageLimitService", () => {
  class MockUsageLimitError extends Error {
    readonly status = 429;
    readonly code = "USAGE_LIMIT_EXCEEDED";
    readonly resetAt: string;
    constructor(resetAt: string) {
      super(`Daily roundtable limit reached. Limit resets at ${resetAt}`);
      this.name = "UsageLimitError";
      this.resetAt = resetAt;
    }
  }
  return {
    UsageLimitError: MockUsageLimitError,
    checkDailyRoundtableLimit: (...args: unknown[]) => checkDailyRoundtableLimitMock(...args),
    enforceDailyRoundtableLimit: (...args: unknown[]) => enforceDailyRoundtableLimitMock(...args),
  };
});

import { AuthError } from "@/server/auth/session";
import { UsageLimitError } from "@/server/services/usageLimitService";
import { GET } from "./route";

describe("GET /api/admin/check-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthenticated", async () => {
    requireUserMock.mockRejectedValueOnce(
      new AuthError(401, "UNAUTHORIZED", "Authentication required"),
    );

    const request = new Request("http://localhost:3000/api/admin/check-limit");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 200 with usage status when under limit", async () => {
    requireUserMock.mockResolvedValueOnce({
      id: "u-1",
      email: "user@example.com",
      role: "user",
    });

    checkDailyRoundtableLimitMock.mockResolvedValueOnce({
      allowed: true,
      usage: 2,
      limit: 5,
      remaining: 3,
      resetAt: "2026-11-14T00:00:00.000Z",
    });

    const request = new Request("http://localhost:3000/api/admin/check-limit");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.allowed).toBe(true);
    expect(body.data.remaining).toBe(3);
  });

  it("returns 429 when limit is exceeded with reset time", async () => {
    requireUserMock.mockResolvedValueOnce({
      id: "u-1",
      email: "user@example.com",
      role: "user",
    });

    checkDailyRoundtableLimitMock.mockResolvedValueOnce({
      allowed: false,
      usage: 5,
      limit: 5,
      remaining: 0,
      resetAt: "2026-11-14T00:00:00.000Z",
    });

    const request = new Request("http://localhost:3000/api/admin/check-limit?enforce=true");
    enforceDailyRoundtableLimitMock.mockRejectedValueOnce(
      new UsageLimitError("2026-11-14T00:00:00.000Z"),
    );

    const response = await GET(request);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("USAGE_LIMIT_EXCEEDED");
    expect(body.error.message).toContain("2026-11-14T00:00:00.000Z");
  });
});
