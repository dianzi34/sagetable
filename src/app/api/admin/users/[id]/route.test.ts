import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const updateUserRoleMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/adminService", () => ({
  updateUserRole: (...args: unknown[]) => updateUserRoleMock(...args),
}));

import { AuthError } from "@/server/auth/session";
import { PATCH } from "./route";

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 if user is not admin", async () => {
    requireRoleMock.mockRejectedValueOnce(
      new AuthError(403, "FORBIDDEN", "Insufficient permissions"),
    );

    const request = new Request("http://localhost:3000/api/admin/users/user-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "CURATOR" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "user-1" }) });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 if role is invalid", async () => {
    requireRoleMock.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin@sagetable.org",
      role: "admin",
    });

    const request = new Request("http://localhost:3000/api/admin/users/user-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "SUPERMAN" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "user-1" }) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 if user not found", async () => {
    requireRoleMock.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin@sagetable.org",
      role: "admin",
    });

    updateUserRoleMock.mockRejectedValueOnce(new Error("User not found"));

    const request = new Request("http://localhost:3000/api/admin/users/missing-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "CURATOR" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "missing-1" }) });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 200 and updated user on success", async () => {
    requireRoleMock.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin@sagetable.org",
      role: "admin",
    });

    updateUserRoleMock.mockResolvedValueOnce({
      id: "user-1",
      email: "user1@example.com",
      role: "CURATOR",
    });

    const request = new Request("http://localhost:3000/api/admin/users/user-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: "CURATOR" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "user-1" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.user.role).toBe("CURATOR");
    expect(updateUserRoleMock).toHaveBeenCalledWith({
      actorId: "admin-1",
      targetUserId: "user-1",
      newRole: "CURATOR",
    });
  });
});
