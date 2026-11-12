import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  MATCH_THRESHOLD as INDEX_MATCH_THRESHOLD,
  matchAnswers as indexMatchAnswers,
} from "./index";
import { MATCH_THRESHOLD, matchAnswers } from "./matchAnswers";

interface FakeRankedRow {
  id: string;
  figureId: string;
  themeId: string;
  body: string;
  score: number;
}

interface FakePassageRow {
  answerId: string;
  passageId: string;
  explanation: string;
  order: number;
  passage: {
    text: string;
    location: string;
    work: {
      title: string;
      year: number;
    };
  };
}

function createFakeDb(
  rankedRows: FakeRankedRow[],
  passageRows: FakePassageRow[] = [],
): {
  db: PrismaClient;
  queryRawMock: ReturnType<typeof vi.fn>;
  findManyMock: ReturnType<typeof vi.fn>;
} {
  const queryRawMock = vi.fn(async () => rankedRows);
  const findManyMock = vi.fn(async () => passageRows);

  const db = {
    $queryRaw: queryRawMock,
    answerPassage: {
      findMany: findManyMock,
    },
  } as unknown as PrismaClient;

  return { db, queryRawMock, findManyMock };
}

describe("matchAnswers (unit)", () => {
  it("exports a positive numeric MATCH_THRESHOLD", () => {
    expect(typeof MATCH_THRESHOLD).toBe("number");
    expect(MATCH_THRESHOLD).toBeGreaterThan(0);
  });

  it("returns an empty array without querying when figureIds is empty", async () => {
    const { db, queryRawMock, findManyMock } = createFakeDb([]);

    const results = await matchAnswers(
      {
        question: "How do I choose a career path?",
        figureIds: [],
      },
      db,
    );

    expect(results).toEqual([]);
    expect(queryRawMock).not.toHaveBeenCalled();
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("re-exports MATCH_THRESHOLD and matchAnswers from index", () => {
    expect(INDEX_MATCH_THRESHOLD).toBe(MATCH_THRESHOLD);
    expect(indexMatchAnswers).toBe(matchAnswers);
  });

  it("returns a no-match result per figure when the question has no searchable terms", async () => {
    const { db, queryRawMock } = createFakeDb([]);

    const results = await matchAnswers(
      {
        question: "  ... ???   the and or I can't won't  ",
        figureIds: ["fig-twain", "fig-curie"],
        themeId: "theme-career",
      },
      db,
    );

    expect(results).toEqual([
      { figureId: "fig-twain", answer: null, score: 0 },
      { figureId: "fig-curie", answer: null, score: 0 },
    ]);
    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("returns matched first-person answer with ordered 1-2 verbatim passages and source metadata", async () => {
    const { db, findManyMock } = createFakeDb(
      [
        {
          id: "ans-twain-1",
          figureId: "fig-twain",
          themeId: "theme-career",
          body: "Honestly, I didn't get my career right on the first try.",
          score: MATCH_THRESHOLD + 0.35,
        },
      ],
      [
        {
          answerId: "ans-twain-1",
          passageId: "p-1",
          explanation: "Start before overthinking stalls you.",
          order: 0,
          passage: {
            text: "He agreed to teach me the Mississippi River.",
            location: "Chapter 6",
            work: {
              title: "Life on the Mississippi",
              year: 1883,
            },
          },
        },
        {
          answerId: "ans-twain-1",
          passageId: "p-2",
          explanation: "Testing work crosses off poor fits.",
          order: 1,
          passage: {
            text: "I have been through the California mill.",
            location: "Vol. II, Ch. IX",
            work: {
              title: "Mark Twain's Letters",
              year: 1917,
            },
          },
        },
        {
          answerId: "ans-twain-1",
          passageId: "p-3",
          explanation: "Should be capped to at most 2 passages.",
          order: 2,
          passage: {
            text: "Extra passage beyond two.",
            location: "Chapter 10",
            work: {
              title: "Roughing It",
              year: 1872,
            },
          },
        },
      ],
    );

    const results = await matchAnswers(
      {
        question: "How do I find work I love?",
        figureIds: ["fig-twain", "fig-twain", "fig-curie"],
        themeId: "theme-career",
      },
      db,
    );

    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      figureId: "fig-twain",
      score: MATCH_THRESHOLD + 0.35,
      answer: {
        id: "ans-twain-1",
        themeId: "theme-career",
        body: "Honestly, I didn't get my career right on the first try.",
        passages: [
          {
            text: "He agreed to teach me the Mississippi River.",
            workTitle: "Life on the Mississippi",
            workYear: 1883,
            location: "Chapter 6",
            explanation: "Start before overthinking stalls you.",
          },
          {
            text: "I have been through the California mill.",
            workTitle: "Mark Twain's Letters",
            workYear: 1917,
            location: "Vol. II, Ch. IX",
            explanation: "Testing work crosses off poor fits.",
          },
        ],
      },
    });
    expect(results[1]).toEqual({
      figureId: "fig-curie",
      score: 0,
      answer: null,
    });
  });

  it("returns answer: null when the top score falls below MATCH_THRESHOLD", async () => {
    const lowScore = MATCH_THRESHOLD / 2;
    const { db, findManyMock } = createFakeDb([
      {
        id: "ans-curie-low",
        figureId: "fig-curie",
        themeId: "theme-failure",
        body: "Low relevance candidate.",
        score: lowScore,
      },
    ]);

    const results = await matchAnswers(
      {
        question: "How do I bake sourdough bread at home?",
        figureIds: ["fig-curie"],
      },
      db,
    );

    expect(results).toEqual([
      {
        figureId: "fig-curie",
        answer: null,
        score: lowScore,
      },
    ]);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns answer: null when a matched answer has zero linked passages", async () => {
    const { db } = createFakeDb(
      [
        {
          id: "ans-no-passages",
          figureId: "fig-keller",
          themeId: "theme-resilience",
          body: "Answer missing linked passages.",
          score: MATCH_THRESHOLD + 0.5,
        },
      ],
      [],
    );

    const results = await matchAnswers(
      {
        question: "How do I keep moving forward during hardship?",
        figureIds: ["fig-keller"],
      },
      db,
    );

    expect(results).toEqual([
      {
        figureId: "fig-keller",
        answer: null,
        score: MATCH_THRESHOLD + 0.5,
      },
    ]);
  });

  it("guards all server matching files with import 'server-only' and never uses rawUnsafe", () => {
    const matchingDir = path.resolve(process.cwd(), "src/server/matching");
    const sourceFiles = ["matchAnswers.ts", "index.ts"];

    for (const fileName of sourceFiles) {
      const content = fs.readFileSync(path.join(matchingDir, fileName), "utf8");
      expect(content.trimStart().startsWith('import "server-only";')).toBe(true);
      expect(content).not.toContain("$queryRawUnsafe");
      expect(content).not.toContain("$executeRawUnsafe");
    }
  });
});
