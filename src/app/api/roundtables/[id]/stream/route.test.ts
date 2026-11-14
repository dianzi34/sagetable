import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { signSessionToken } from "@/server/auth/jwt";

const mockRoundtableFindUnique = vi.fn();
const mockRoundtableAnswerUpdate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockMatchAnswers = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    roundtable: {
      findUnique: (...args: unknown[]) => mockRoundtableFindUnique(...args),
    },
    roundtableAnswer: {
      update: (...args: unknown[]) => mockRoundtableAnswerUpdate(...args),
    },
  },
}));

vi.mock("@/server/matching", () => ({
  MATCH_THRESHOLD: 0.15,
  matchAnswers: (...args: unknown[]) => mockMatchAnswers(...args),
}));

import { GET } from "./route";

const VALID_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/sagetable";
const VALID_JWT_SECRET = "sagetable-stream-test-secret-32-chars!";

async function readStream(
  stream: ReadableStream<Uint8Array>,
): Promise<Array<{ event: string; data: Record<string, unknown> }>> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: Array<{ event: string; data: Record<string, unknown> }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      if (!block.trim()) continue;
      const lines = block.split("\n");
      let eventType = "message";
      let dataStr = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataStr = line.slice(5).trim();
        }
      }

      if (dataStr) {
        try {
          events.push({ event: eventType, data: JSON.parse(dataStr) });
        } catch {
          // ignore malformed
        }
      } else {
        events.push({ event: eventType, data: {} });
      }
    }
  }

  return events;
}

describe("GET /api/roundtables/[id]/stream route handler", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: VALID_DATABASE_URL,
      JWT_SECRET: VALID_JWT_SECRET,
    };
    mockRoundtableFindUnique.mockReset();
    mockRoundtableAnswerUpdate.mockReset();
    mockRoundtableAnswerUpdate.mockResolvedValue({});
    mockUserFindUnique.mockReset();
    mockMatchAnswers.mockReset();

    mockUserFindUnique.mockResolvedValue({
      id: "user-1",
      email: "reader@sagetable.org",
      role: "USER",
    });

    mockRoundtableFindUnique.mockResolvedValue({
      id: "roundtable-1",
      userId: "user-1",
      question: "How do I choose the right career path?",
      themeId: "theme-1",
      answers: [
        {
          id: "rta-1",
          figureId: "fig-twain",
          figure: { id: "fig-twain", slug: "mark-twain", name: "Mark Twain" },
        },
        {
          id: "rta-2",
          figureId: "fig-curie",
          figure: { id: "fig-curie", slug: "marie-curie", name: "Marie Curie" },
        },
      ],
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function createAuthCookie(userId = "user-1"): Promise<string> {
    const token = await signSessionToken({
      id: userId,
      email: "reader@sagetable.org",
      role: "user",
    });
    return `${SESSION_COOKIE_NAME}=${token}`;
  }

  it("rejects unauthenticated requests with 401", async () => {
    const request = new Request("http://localhost:3000/api/roundtables/roundtable-1/stream");
    const response = await GET(request, {
      params: Promise.resolve({ id: "roundtable-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when roundtable belongs to another user or does not exist", async () => {
    mockRoundtableFindUnique.mockResolvedValue(null);
    const cookie = await createAuthCookie();
    const request = new Request(
      "http://localhost:3000/api/roundtables/roundtable-999/stream",
      { headers: { cookie } },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "roundtable-999" }),
    });

    expect(response.status).toBe(404);
  });

  it("streams SSE events in order with interleaved chunks, figure-done, and done", async () => {
    const cookie = await createAuthCookie();

    mockMatchAnswers.mockResolvedValue([
      {
        figureId: "fig-twain",
        score: 0.85,
        answer: {
          id: "ans-twain",
          themeId: "theme-1",
          body: "Training is everything. The peach was once a bitter almond.",
          passages: [
            {
              text: "Training is everything.",
              workTitle: "Pudd'nhead Wilson",
              workYear: 1894,
              location: "Chapter 5",
              explanation: "Practice changes who you are.",
            },
          ],
        },
      },
      {
        figureId: "fig-curie",
        score: 0.9,
        answer: {
          id: "ans-curie",
          themeId: "theme-1",
          body: "One never notices what has been done; one can only see what remains to be done.",
          passages: [
            {
              text: "One never notices what has been done.",
              workTitle: "Pierre Curie",
              workYear: 1923,
              location: "Chapter 4",
              explanation: "Keep your eyes on the work ahead.",
            },
          ],
        },
      },
    ]);

    const request = new Request(
      "http://localhost:3000/api/roundtables/roundtable-1/stream",
      { headers: { cookie } },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "roundtable-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");

    const events = await readStream(response.body!);
    const eventTypes = events.map((e) => e.event);

    expect(eventTypes).toContain("figure-start");
    expect(eventTypes).toContain("chunk");
    expect(eventTypes).toContain("figure-done");
    expect(eventTypes[eventTypes.length - 1]).toBe("done");

    // Verify chunk events for both figures exist
    const chunks = events.filter((e) => e.event === "chunk");
    const twainChunks = chunks.filter((c) => c.data.figureId === "fig-twain");
    const curieChunks = chunks.filter((c) => c.data.figureId === "fig-curie");
    expect(twainChunks.length).toBeGreaterThan(0);
    expect(curieChunks.length).toBeGreaterThan(0);

    // Verify figure-done payloads contain passages
    const doneEvents = events.filter((e) => e.event === "figure-done");
    expect(doneEvents.length).toBe(2);
    const twainDone = doneEvents.find((d) => d.data.figureId === "fig-twain");
    expect(twainDone?.data.passages).toBeDefined();
  });

  it("emits no-match event when a figure has no matching curated passage", async () => {
    const cookie = await createAuthCookie();

    mockMatchAnswers.mockResolvedValue([
      {
        figureId: "fig-twain",
        score: 0.05,
        answer: null,
      },
      {
        figureId: "fig-curie",
        score: 0.8,
        answer: {
          id: "ans-curie",
          themeId: "theme-1",
          body: "Science is hard work.",
          passages: [],
        },
      },
    ]);

    const request = new Request(
      "http://localhost:3000/api/roundtables/roundtable-1/stream",
      { headers: { cookie } },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "roundtable-1" }),
    });

    const events = await readStream(response.body!);
    const noMatchEvent = events.find((e) => e.event === "no-match");
    expect(noMatchEvent).toBeDefined();
    expect(noMatchEvent?.data.figureId).toBe("fig-twain");
    expect(noMatchEvent?.data.message).toBe("Mark Twain hasn't written about this yet.");
  });
});
