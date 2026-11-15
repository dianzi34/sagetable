import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const listAuditLogsMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/adminService", () => ({
  listAuditLogs: (...args: unknown[]) => listAuditLogsMock(...args),
}));

import { AuthError } from "@/server/auth/session";
import { GET } from "./route";

describe("GET /api/admin/audit-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 if user is not admin", async () => {
    requireRoleMock.mockRejectedValueOnce(
      new AuthError(403, "FORBIDDEN", "Insufficient permissions"),
    );

    const request = new Request("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it("returns 200 and audit logs for admin", async () => {
    requireRoleMock.mockResolvedValueOnce({
      id: "admin-1",
      role: "admin",
    });

    listAuditLogsMock.mockResolvedValueOnce([
      {
        id: "log-1",
        actorId: "admin-1",
        action: "ROLE_CHANGE",
        targetId: "user-2",
        before: { role: "USER" },
        after: { role: "CURATOR" },
        createdAt: new Date("2026-11-12T10:00:00Z"),
        actor: {
          email: "admin@sagetable.org",
          role: "ADMIN",
        },
      },
    ]);

    const request = new Request("http://localhost:3000/api/admin/audit-logs");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.logs).toHaveLength(1);
    expect(body.data.logs[0].actor.email).toBe("admin@sagetable.org");
  });
});
