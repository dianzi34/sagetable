import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedDatabase } from "../../prisma/seed";
import { createTestPrismaClient, resetTestDatabase } from "./testDb";

describe("Prisma seed script and full-text search integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("loads all 5 figures, 5 themes, 15 theme suggestions, 7 works, 31 passages, and 25 answers", async () => {
    const result = await seedDatabase(prisma);

    expect(result).toEqual({
      figures: 5,
      themes: 5,
      figureThemes: 15,
      works: 7,
      passages: 31,
      answers: 25,
      answerPassages: 31,
    });

    const figures = await prisma.figure.findMany();
    expect(figures).toHaveLength(5);
    for (const figure of figures) {
      expect(figure.avatarKey).toBe(figure.slug);
    }

    const themes = await prisma.theme.findMany({
      include: {
        figures: {
          orderBy: { order: "asc" },
          include: { figure: true },
        },
      },
    });
    expect(themes).toHaveLength(5);
    for (const theme of themes) {
      expect(theme.suggestedQuestions).toHaveLength(3);
      expect(theme.figures).toHaveLength(3);
      expect(theme.figures.map((link) => link.order)).toEqual([0, 1, 2]);
    }

    const careerTheme = themes.find(
      (theme) => theme.slug === "choosing-a-career",
    );
    expect(
      careerTheme?.figures.map((link) => link.figure.slug),
    ).toEqual(["mark-twain", "marie-curie", "vincent-van-gogh"]);

    const works = await prisma.work.findMany();
    expect(works).toHaveLength(7);
    expect(works.every((work) => work.publicDomainConfirmed)).toBe(true);

    const passages = await prisma.passage.findMany();
    expect(passages).toHaveLength(31);

    const answers = await prisma.answer.findMany();
    expect(answers).toHaveLength(25);
    expect(answers.every((answer) => answer.topicKeywords.includes(" "))).toBe(
      true,
    );

    const answerPassages = await prisma.answerPassage.findMany();
    expect(answerPassages).toHaveLength(31);
  });

  it("runs idempotently without duplicating rows and refreshes modified fields", async () => {
    await seedDatabase(prisma);

    const initialTwain = await prisma.figure.findUniqueOrThrow({
      where: { slug: "mark-twain" },
    });
    const initialCareerTheme = await prisma.theme.findUniqueOrThrow({
      where: { slug: "choosing-a-career" },
    });

    await prisma.figure.update({
      where: { id: initialTwain.id },
      data: { field: "Outdated Label" },
    });
    await prisma.theme.update({
      where: { id: initialCareerTheme.id },
      data: { description: "Outdated description" },
    });

    await seedDatabase(prisma);

    await expect(prisma.figure.count()).resolves.toBe(5);
    await expect(prisma.theme.count()).resolves.toBe(5);
    await expect(prisma.figureTheme.count()).resolves.toBe(15);
    await expect(prisma.work.count()).resolves.toBe(7);
    await expect(prisma.passage.count()).resolves.toBe(31);
    await expect(prisma.answer.count()).resolves.toBe(25);
    await expect(prisma.answerPassage.count()).resolves.toBe(31);

    const refreshedTwain = await prisma.figure.findUniqueOrThrow({
      where: { slug: "mark-twain" },
    });
    const refreshedCareerTheme = await prisma.theme.findUniqueOrThrow({
      where: { slug: "choosing-a-career" },
    });

    expect(refreshedTwain.id).toBe(initialTwain.id);
    expect(refreshedTwain.field).toBe("Writer");
    expect(refreshedCareerTheme.id).toBe(initialCareerTheme.id);
    expect(refreshedCareerTheme.description).toBe(initialCareerTheme.description);
  });

  it("supports PostgreSQL full-text search with GIN indexes across seeded passages and answers", async () => {
    await seedDatabase(prisma);

    const ginIndexes = await prisma.$queryRaw<
      Array<{ indexname: string; indexdef: string }>
    >`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN ('Passage_searchVector_idx', 'Answer_searchVector_idx')
      ORDER BY indexname ASC
    `;

    expect(ginIndexes).toHaveLength(2);
    expect(
      ginIndexes.every((idx) => idx.indexdef.includes("USING gin")),
    ).toBe(true);

    const nullPassageVectors = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "Passage"
      WHERE "searchVector" IS NULL
    `;
    const nullAnswerVectors = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "Answer"
      WHERE "searchVector" IS NULL
    `;
    expect(nullPassageVectors[0]?.count).toBe(0);
    expect(nullAnswerVectors[0]?.count).toBe(0);

    const matchedPassages = await prisma.$queryRaw<Array<{ key: string }>>`
      SELECT key
      FROM "Passage"
      WHERE "searchVector" @@ plainto_tsquery('english', ${"alcohol lamp bread chocolate"})
    `;
    expect(matchedPassages.map((row) => row.key)).toContain("curie-hardship-1");

    const matchedAnswers = await prisma.$queryRaw<
      Array<{ figureSlug: string; themeSlug: string; rank: number }>
    >`
      SELECT
        f.slug AS "figureSlug",
        t.slug AS "themeSlug",
        ts_rank(a."searchVector", plainto_tsquery('english', ${"riverboat pilot career"}))::float8 AS rank
      FROM "Answer" a
      JOIN "Figure" f ON f.id = a."figureId"
      JOIN "Theme" t ON t.id = a."themeId"
      WHERE a."searchVector" @@ plainto_tsquery('english', ${"riverboat pilot career"})
      ORDER BY rank DESC
    `;

    expect(matchedAnswers.length).toBeGreaterThan(0);
    expect(matchedAnswers[0]?.figureSlug).toBe("mark-twain");
    expect(matchedAnswers[0]?.themeSlug).toBe("choosing-a-career");
  });

  it("enforces unique Passage.key, unique Answer (figureId, themeId), and Restrict on AuditLog.actor", async () => {
    const user = await prisma.user.create({
      data: {
        email: "curator@example.com",
        passwordHash: "hashed-password",
        role: "CURATOR",
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "PROMOTE_ROLE",
        targetId: "target-user-1",
      },
    });

    await expect(
      prisma.user.delete({ where: { id: user.id } }),
    ).rejects.toThrow();

    const figure = await prisma.figure.create({
      data: {
        slug: "mark-twain",
        name: "Mark Twain",
        field: "Writer",
        era: "1835–1910",
        bio: "American writer and humorist.",
        avatarKey: "mark-twain",
      },
    });
    const theme = await prisma.theme.create({
      data: {
        slug: "choosing-a-career",
        name: "Choosing a Career",
        description: "Picking a path.",
      },
    });
    const work = await prisma.work.create({
      data: {
        figureId: figure.id,
        title: "Roughing It",
        year: 1872,
        sourceUrl: "https://www.gutenberg.org/ebooks/3177",
        publicDomainConfirmed: true,
      },
    });

    await prisma.passage.create({
      data: {
        workId: work.id,
        key: "twain-duplicate-key",
        location: "Chapter 1",
        text: "A sample passage with enough words to represent a verbatim quote from public domain writing.",
      },
    });

    await expect(
      prisma.passage.create({
        data: {
          workId: work.id,
          key: "twain-duplicate-key",
          location: "Chapter 2",
          text: "Another passage attempting to reuse the same key should fail the unique constraint.",
        },
      }),
    ).rejects.toThrow();

    await prisma.answer.create({
      data: {
        figureId: figure.id,
        themeId: theme.id,
        topicKeywords: "career pilot",
        body: "First curated answer for this figure and theme.",
      },
    });

    await expect(
      prisma.answer.create({
        data: {
          figureId: figure.id,
          themeId: theme.id,
          topicKeywords: "duplicate theme",
          body: "Second curated answer for the same figure and theme should reject.",
        },
      }),
    ).rejects.toThrow();
  });
});
