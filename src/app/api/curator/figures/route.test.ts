import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const listFiguresMock = vi.fn();
const createFigureMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/curatorService", () => ({
  listFigures: (...args: unknown[]) => listFiguresMock(...args),
  createFigure: (...args: unknown[]) => createFigureMock(...args),
}));

import { AuthError } from "@/server/auth/session";
import { GET, POST } from "./route";

describe("/api/curator/figures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/curator/figures", () => {
    it("returns 403 for non-curators", async () => {
      requireRoleMock.mockRejectedValueOnce(
        new AuthError(403, "FORBIDDEN", "Insufficient permissions"),
      );

      const request = new Request("http://localhost:3000/api/curator/figures");
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("returns 200 and figures list for curator", async () => {
      requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
      listFiguresMock.mockResolvedValueOnce([
        { id: "fig-1", slug: "twain", name: "Mark Twain" },
      ]);

      const request = new Request("http://localhost:3000/api/curator/figures");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.figures).toHaveLength(1);
    });
  });

  describe("POST /api/curator/figures", () => {
    it("returns 400 for invalid body", async () => {
      requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });

      const request = new Request("http://localhost:3000/api/curator/figures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: "invalid slug with spaces" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 201 on valid figure creation", async () => {
      requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
      createFigureMock.mockResolvedValueOnce({
        id: "fig-2",
        slug: "newton",
        name: "Isaac Newton",
      });

      const request = new Request("http://localhost:3000/api/curator/figures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "isaac-newton",
          name: "Isaac Newton",
          field: "Mathematics & Physics",
          era: "1642-1727",
          bio: "English polymath.",
          avatarKey: "newton",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.figure.name).toBe("Isaac Newton");
    });
  });
});
