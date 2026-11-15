import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const updateAnswerBankEntryMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/curatorService", () => ({
  updateAnswerBankEntry: (...args: unknown[]) => updateAnswerBankEntryMock(...args),
}));

import { PATCH } from "./route";

describe("PATCH /api/curator/answers/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates answer-bank entry", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    updateAnswerBankEntryMock.mockResolvedValueOnce({
      id: "ans-1",
      body: "Updated body",
    });

    const response = await PATCH(
      new Request("http://localhost:3000/api/curator/answers/ans-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: "Updated body" }),
      }),
      { params: Promise.resolve({ id: "ans-1" }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.answer.body).toBe("Updated body");
  });
});
