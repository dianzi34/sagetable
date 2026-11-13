import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.fn();
const uploadWorkWithPassagesMock = vi.fn();

vi.mock("@/server/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session")>();
  return {
    ...actual,
    requireRole: (...args: unknown[]) => requireRoleMock(...args),
  };
});

vi.mock("@/server/services/curatorService", () => {
  class MockCuratorError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.name = "CuratorError";
      this.status = status;
      this.code = code;
    }
  }
  return {
    CuratorError: MockCuratorError,
    uploadWorkWithPassages: (...args: unknown[]) => uploadWorkWithPassagesMock(...args),
  };
});

import { POST } from "./route";

describe("POST /api/curator/works/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when public domain confirmation is false", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });

    const request = new Request("http://localhost:3000/api/curator/works/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        figureId: "fig-1",
        title: "Life on the Mississippi",
        year: 1883,
        sourceUrl: "https://gutenberg.org/ebooks/245",
        publicDomainConfirmed: false,
        textContent: "Paragraph 1\n\nParagraph 2",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 201 on successful upload and chunking", async () => {
    requireRoleMock.mockResolvedValueOnce({ id: "curator-1", role: "curator" });
    uploadWorkWithPassagesMock.mockResolvedValueOnce({
      work: { id: "w-1", title: "Life on the Mississippi" },
      passageCount: 15,
    });

    const request = new Request("http://localhost:3000/api/curator/works/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        figureId: "fig-1",
        title: "Life on the Mississippi",
        year: 1883,
        sourceUrl: "https://gutenberg.org/ebooks/245",
        publicDomainConfirmed: true,
        textContent: "Paragraph 1\n\nParagraph 2",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.passageCount).toBe(15);
  });
});
