import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const updateThemeMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/curatorService", () => ({
  updateTheme: (...args: unknown[]) => updateThemeMock(...args),
}));

import { PATCH } from "./route";

describe("PATCH /api/curator/themes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates theme attributes and synced figures", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    updateThemeMock.mockResolvedValueOnce({ id: "t-1", name: "Courage & Fear" });

    const response = await PATCH(
      new Request("http://localhost:3000/api/curator/themes/t-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Courage & Fear", figureIds: ["fig-1", "fig-2"] }),
      }),
      { params: Promise.resolve({ id: "t-1" }) },
    );

    expect(response.status).toBe(200);
  });
});
