import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const listAnswerBankEntriesMock = vi.fn();
const createAnswerBankEntryMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/curatorService", () => ({
  listAnswerBankEntries: (...args: unknown[]) => listAnswerBankEntriesMock(...args),
  createAnswerBankEntry: (...args: unknown[]) => createAnswerBankEntryMock(...args),
}));

import { GET, POST } from "./route";

describe("/api/curator/answers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns answers list", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    listAnswerBankEntriesMock.mockResolvedValueOnce([
      { id: "ans-1", topicKeywords: "courage" },
    ]);

    const response = await GET(new Request("http://localhost:3000/api/curator/answers"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.answers).toHaveLength(1);
  });

  it("POST creates answer-bank entry", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    createAnswerBankEntryMock.mockResolvedValueOnce({ id: "ans-2", body: "Answer text" });

    const response = await POST(
      new Request("http://localhost:3000/api/curator/answers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          figureId: "fig-1",
          themeId: "theme-1",
          topicKeywords: "courage fear",
          body: "Answer text",
          passages: [{ passageId: "p-1", explanation: "Expl", order: 0 }],
        }),
      }),
    );

    expect(response.status).toBe(201);
  });
});
