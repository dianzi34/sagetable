import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const listThemesMock = vi.fn();
const createThemeMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/curatorService", () => ({
  listThemes: (...args: unknown[]) => listThemesMock(...args),
  createTheme: (...args: unknown[]) => createThemeMock(...args),
}));

import { GET, POST } from "./route";

describe("/api/curator/themes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns themes list", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    listThemesMock.mockResolvedValueOnce([{ id: "t-1", name: "Courage" }]);

    const response = await GET(new Request("http://localhost:3000/api/curator/themes"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.themes).toHaveLength(1);
  });

  it("POST creates a theme with assigned figures", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    createThemeMock.mockResolvedValueOnce({ id: "t-2", name: "Resilience" });

    const response = await POST(
      new Request("http://localhost:3000/api/curator/themes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "resilience",
          name: "Resilience",
          description: "Overcoming hardship",
          suggestedQuestions: ["How to persevere?"],
          figureIds: ["fig-1"],
        }),
      }),
    );

    expect(response.status).toBe(201);
  });
});
