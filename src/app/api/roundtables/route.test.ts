import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { signSessionToken } from "@/server/auth/jwt";

const mockRoundtableCreate = vi.fn();
const mockRoundtableFindMany = vi.fn();
const mockThemeFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockFigureFindMany = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    theme: {
      findUnique: (...args: unknown[]) => mockThemeFindUnique(...args),
    },
    figure: {
      findMany: (...args: unknown[]) => mockFigureFindMany(...args),
    },
    roundtable: {
      create: (...args: unknown[]) => mockRoundtableCreate(...args),
      findMany: (...args: unknown[]) => mockRoundtableFindMany(...args),
    },
  },
}));

import { GET, POST } from "./route";

const VALID_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/sagetable";
const VALID_JWT_SECRET = "sagetable-roundtables-test-secret-32-chars!";

describe("/api/roundtables route handler", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: VALID_DATABASE_URL,
      JWT_SECRET: VALID_JWT_SECRET,
    };
    mockRoundtableCreate.mockReset();
    mockRoundtableFindMany.mockReset();
    mockThemeFindUnique.mockReset();
    mockUserFindUnique.mockReset();
    mockFigureFindMany.mockReset();

    mockFigureFindMany.mockResolvedValue([
      { id: "mark-twain", slug: "mark-twain" },
      { id: "marie-curie", slug: "marie-curie" },
    ]);

    mockUserFindUnique.mockResolvedValue({
      id: "user-1",
      email: "reader@sagetable.org",
      role: "USER",
    });

    mockThemeFindUnique.mockResolvedValue({
      id: "theme-career-id",
      slug: "choosing-a-career",
      name: "Choosing a Career",
    });

    mockRoundtableCreate.mockResolvedValue({
      id: "roundtable-xyz",
      userId: "user-1",
      question: "How do I choose between two careers I love?",
      themeId: "theme-career-id",
      createdAt: new Date(),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function createAuthCookie(): Promise<string> {
    const token = await signSessionToken({
      id: "user-1",
      email: "reader@sagetable.org",
      role: "user",
    });
    return `${SESSION_COOKIE_NAME}=${token}`;
  }

  describe("POST /api/roundtables", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const request = new Request("http://localhost:3000/api/roundtables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeSlug: "choosing-a-career",
          figureIds: ["mark-twain", "marie-curie"],
          question: "How do I choose between two careers I love?",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error?.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 for invalid JSON body", async () => {
      const cookie = await createAuthCookie();
      const request = new Request("http://localhost:3000/api/roundtables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
        },
        body: "invalid-json-content{",
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBeDefined();
    });

    it("returns 400 when question is too short (< 10 chars)", async () => {
      const cookie = await createAuthCookie();
      const request = new Request("http://localhost:3000/api/roundtables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          themeSlug: "choosing-a-career",
          figureIds: ["mark-twain", "marie-curie"],
          question: "Short?",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBeDefined();
    });

    it("returns 400 when figures array has fewer than 2 figures", async () => {
      const cookie = await createAuthCookie();
      const request = new Request("http://localhost:3000/api/roundtables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          themeSlug: "choosing-a-career",
          figureIds: ["mark-twain"],
          question: "How do I choose between two careers I love?",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 400 when figures array has duplicate figures", async () => {
      const cookie = await createAuthCookie();
      const request = new Request("http://localhost:3000/api/roundtables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          themeSlug: "choosing-a-career",
          figureIds: ["mark-twain", "mark-twain"],
          question: "How do I choose between two careers I love?",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 201 with roundtable id for valid authenticated input", async () => {
      const cookie = await createAuthCookie();
      const request = new Request("http://localhost:3000/api/roundtables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          themeSlug: "choosing-a-career",
          figureIds: ["mark-twain", "marie-curie"],
          question: "How do I choose between two careers I love?",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      const id = json.data?.id ?? json.id;
      expect(id).toBe("roundtable-xyz");
      expect(mockRoundtableCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/roundtables (user history)", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const request = new Request("http://localhost:3000/api/roundtables");
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it("returns 200 with list of user's past roundtables", async () => {
      const cookie = await createAuthCookie();
      mockRoundtableFindMany.mockResolvedValue([
        {
          id: "roundtable-xyz",
          question: "How do I choose between two careers I love?",
          createdAt: new Date("2026-11-14T10:00:00Z"),
          theme: { name: "Choosing a Career", slug: "choosing-a-career" },
          answers: [
            {
              figure: { name: "Mark Twain", slug: "mark-twain" },
              status: "completed",
            },
          ],
        },
      ]);

      const request = new Request("http://localhost:3000/api/roundtables", {
        headers: { cookie },
      });
      const response = await GET(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      const roundtables = json.data?.roundtables ?? json.roundtables;
      expect(roundtables).toHaveLength(1);
      expect(roundtables[0].id).toBe("roundtable-xyz");
    });
  });
});
