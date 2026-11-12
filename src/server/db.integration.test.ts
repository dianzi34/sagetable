import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createTestPrismaClient,
  resetTestDatabase,
} from "./testDb";

describe("Prisma schema and full-text search integration", () => {
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

  it("defaults a new User role to USER", async () => {
    const user = await prisma.user.create({
      data: {
        email: "learner@example.com",
        passwordHash: "hashed-password-placeholder",
      },
    });

    expect(user.role).toBe("USER");
  });

  it("creates Figure -> Work -> Passage and finds passages via Passage.searchVector", async () => {
    const figure = await prisma.figure.create({
      data: {
        slug: "mark-twain",
        name: "Mark Twain",
        field: "Literature",
        era: "1835–1910",
        bio: "American author and humorist.",
        avatarKey: "mark-twain",
      },
    });

    const work = await prisma.work.create({
      data: {
        figureId: figure.id,
        title: "Life on the Mississippi",
        year: 1883,
        sourceUrl: "https://www.gutenberg.org/ebooks/245",
        publicDomainConfirmed: true,
      },
    });

    const passage = await prisma.passage.create({
      data: {
        workId: work.id,
        location: "Chapter 9",
        text: "Steamboat pilots navigated treacherous river currents with patient observation.",
      },
    });

    const matchingPassages = await prisma.$queryRaw<
      Array<{ id: string; text: string }>
    >`
      SELECT id, text
      FROM "Passage"
      WHERE "searchVector" @@ plainto_tsquery('english', ${"navigated river currents"})
    `;

    expect(matchingPassages).toHaveLength(1);
    expect(matchingPassages[0]?.id).toBe(passage.id);

    const nonMatchingPassages = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "Passage"
      WHERE "searchVector" @@ plainto_tsquery('english', ${"quantum entanglement"})
    `;

    expect(nonMatchingPassages).toHaveLength(0);
  });

  it("weights Answer.topicKeywords above Answer.body in Answer.searchVector", async () => {
    const figure = await prisma.figure.create({
      data: {
        slug: "marie-curie",
        name: "Marie Curie",
        field: "Physics & Chemistry",
        era: "1867–1934",
        bio: "Pioneer in radioactivity research.",
        avatarKey: "marie-curie",
      },
    });

    const theme = await prisma.theme.create({
      data: {
        slug: "dealing-with-failure",
        name: "Dealing with failure",
        description: "How to persist after setbacks.",
      },
    });

    const keywordMatch = await prisma.answer.create({
      data: {
        figureId: figure.id,
        themeId: theme.id,
        topicKeywords: "resilience perseverance courage",
        body: "Do not give up when laboratory experiments prove difficult at first.",
      },
    });

    const bodyOnlyMatch = await prisma.answer.create({
      data: {
        figureId: figure.id,
        themeId: theme.id,
        topicKeywords: "curiosity discovery method",
        body: "True resilience appears when measurements fail, because resilience keeps inquiry alive.",
      },
    });

    const rankedAnswers = await prisma.$queryRaw<
      Array<{ id: string; rank: number }>
    >`
      SELECT id, ts_rank("searchVector", plainto_tsquery('english', ${"resilience"}))::float8 AS rank
      FROM "Answer"
      WHERE "searchVector" @@ plainto_tsquery('english', ${"resilience"})
      ORDER BY rank DESC
    `;

    expect(rankedAnswers).toHaveLength(2);
    expect(rankedAnswers[0]?.id).toBe(keywordMatch.id);
    expect(rankedAnswers[1]?.id).toBe(bodyOnlyMatch.id);
    expect(rankedAnswers[0]!.rank).toBeGreaterThan(rankedAnswers[1]!.rank);
  });

  it("cascades Figure deletion to Works, Passages, and Answers", async () => {
    const figure = await prisma.figure.create({
      data: {
        slug: "helen-keller",
        name: "Helen Keller",
        field: "Literature & Advocacy",
        era: "1880–1968",
        bio: "Author, lecturer, and disability rights advocate.",
        avatarKey: "helen-keller",
      },
    });

    const theme = await prisma.theme.create({
      data: {
        slug: "learning-and-curiosity",
        name: "Learning and curiosity",
        description: "Building understanding step by step.",
      },
    });

    const work = await prisma.work.create({
      data: {
        figureId: figure.id,
        title: "The Story of My Life",
        year: 1903,
        sourceUrl: "https://www.gutenberg.org/ebooks/2397",
        publicDomainConfirmed: true,
      },
    });

    const passage = await prisma.passage.create({
      data: {
        workId: work.id,
        location: "Chapter 4",
        text: "Knowledge is love and light and vision.",
      },
    });

    const answer = await prisma.answer.create({
      data: {
        figureId: figure.id,
        themeId: theme.id,
        topicKeywords: "learning curiosity language",
        body: "Every word opened a wider world when patience met curiosity.",
      },
    });

    await prisma.answerPassage.create({
      data: {
        answerId: answer.id,
        passageId: passage.id,
        explanation: "Keller describes how discovering language transformed her curiosity.",
        order: 1,
      },
    });

    await prisma.figure.delete({
      where: { id: figure.id },
    });

    await expect(
      prisma.work.findMany({ where: { figureId: figure.id } }),
    ).resolves.toHaveLength(0);
    await expect(
      prisma.passage.findMany({ where: { workId: work.id } }),
    ).resolves.toHaveLength(0);
    await expect(
      prisma.answer.findMany({ where: { figureId: figure.id } }),
    ).resolves.toHaveLength(0);
    await expect(
      prisma.answerPassage.findMany({ where: { answerId: answer.id } }),
    ).resolves.toHaveLength(0);
    await expect(
      prisma.theme.findUnique({ where: { id: theme.id } }),
    ).resolves.not.toBeNull();
  });

  it("stores and returns Theme.suggestedQuestions as a list of strings", async () => {
    const questions = [
      "How do I choose a career when every path feels uncertain?",
      "What should I do when my passion and practical needs conflict?",
    ];

    const created = await prisma.theme.create({
      data: {
        slug: "choosing-a-career",
        name: "Choosing a career",
        description: "Navigating life work and calling.",
        suggestedQuestions: questions,
      },
    });

    const fetched = await prisma.theme.findUnique({
      where: { id: created.id },
    });

    expect(fetched?.suggestedQuestions).toEqual(questions);
  });
});
