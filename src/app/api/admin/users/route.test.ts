import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const listUsersMock = vi.fn();

vi.mock("@/server/auth/session", () => ({
  requireRole: (...args: unknown[]) => requireRoleMock(...args),
}));

vi.mock("@/server/services/adminService", () => ({
  listUsers: (...args: unknown[]) => listUsersMock(...args),
}));

import { AuthError } from "@/server/auth/session";
import { GET } from "./route";

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthenticated", async () => {
    requireRoleMock.mockRejectedValueOnce(
      new AuthError(401, "UNAUTHORIZED", "Authentication required"),
    );

    const request = new Request("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 if user is not admin", async () => {
    requireRoleMock.mockRejectedValueOnce(
      new AuthError(403, "FORBIDDEN", "Insufficient permissions"),
    );

    const request = new Request("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 and users list for admin", async () => {
    requireRoleMock.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin@sagetable.org",
      role: "admin",
    });

    listUsersMock.mockResolvedValueOnce([
      {
        id: "u-1",
        email: "user1@example.com",
        role: "USER",
        createdAt: new Date("2026-11-01T00:00:00Z"),
      },
    ]);

    const request = new Request("http://localhost:3000/api/admin/users");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.users).toHaveLength(1);
    expect(body.data.users[0].email).toBe("user1@example.com");
  });
});
