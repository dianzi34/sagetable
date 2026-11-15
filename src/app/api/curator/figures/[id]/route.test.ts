import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const updateFigureMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/curatorService", () => ({
  updateFigure: (...args: unknown[]) => updateFigureMock(...args),
}));

import { PATCH } from "./route";

describe("PATCH /api/curator/figures/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates figure attributes successfully", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    updateFigureMock.mockResolvedValueOnce({
      id: "fig-1",
      slug: "mark-twain",
      name: "Mark Twain Updated",
    });

    const request = new Request("http://localhost:3000/api/curator/figures/fig-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Mark Twain Updated" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "fig-1" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.figure.name).toBe("Mark Twain Updated");
  });
});
