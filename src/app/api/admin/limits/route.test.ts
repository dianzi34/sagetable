import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const listUsageLimitsMock = vi.fn();
const setUsageLimitMock = vi.fn();

vi.mock("@/server/auth/session", () => ({
  requireRole: (...args: unknown[]) => requireRoleMock(...args),
}));

vi.mock("@/server/services/adminService", () => ({
  listUsageLimits: (...args: unknown[]) => listUsageLimitsMock(...args),
  setUsageLimit: (...args: unknown[]) => setUsageLimitMock(...args),
}));

import { AuthError } from "@/server/auth/session";
import { GET, PUT } from "./route";

describe("/api/admin/limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/limits", () => {
    it("returns 403 if not admin", async () => {
      requireRoleMock.mockRejectedValueOnce(
        new AuthError(403, "FORBIDDEN", "Insufficient permissions"),
      );

      const request = new Request("http://localhost:3000/api/admin/limits");
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("returns 200 and limits list for admin", async () => {
      requireRoleMock.mockResolvedValueOnce({
        id: "admin-1",
        role: "admin",
      });

      listUsageLimitsMock.mockResolvedValueOnce([
        { role: "USER", dailyRoundtables: 5 },
        { role: "CURATOR", dailyRoundtables: 20 },
        { role: "ADMIN", dailyRoundtables: 100 },
      ]);

      const request = new Request("http://localhost:3000/api/admin/limits");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.limits).toHaveLength(3);
    });
  });

  describe("PUT /api/admin/limits", () => {
    it("returns 403 if not admin", async () => {
      requireRoleMock.mockRejectedValueOnce(
        new AuthError(403, "FORBIDDEN", "Insufficient permissions"),
      );

      const request = new Request("http://localhost:3000/api/admin/limits", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "USER", dailyRoundtables: 10 }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(403);
    });

    it("returns 400 for negative limit", async () => {
      requireRoleMock.mockResolvedValueOnce({
        id: "admin-1",
        role: "admin",
      });

      const request = new Request("http://localhost:3000/api/admin/limits", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "USER", dailyRoundtables: -5 }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 and updated limit on success", async () => {
      requireRoleMock.mockResolvedValueOnce({
        id: "admin-1",
        role: "admin",
      });

      setUsageLimitMock.mockResolvedValueOnce({
        role: "USER",
        dailyRoundtables: 15,
      });

      const request = new Request("http://localhost:3000/api/admin/limits", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "USER", dailyRoundtables: 15 }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.limit.dailyRoundtables).toBe(15);
      expect(setUsageLimitMock).toHaveBeenCalledWith({
        actorId: "admin-1",
        role: "USER",
        dailyRoundtables: 15,
      });
    });
  });
});
