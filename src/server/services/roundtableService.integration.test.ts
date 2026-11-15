import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { seedDatabase } from "../../../prisma/seed";
import { MATCH_THRESHOLD } from "@/server/matching";
import { createTestPrismaClient } from "../testDb";
import {
  createRoundtable,
  getRoundtableForUser,
  matchRoundtableAnswers,
} from "./roundtableService";

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST?.trim());

describe.skipIf(!hasTestDb)("roundtableService integration on sagetable_test", () => {
  let prisma: PrismaClient;
  let testUserId: string;
  let twainId: string;
  let curieId: string;
  let vanGoghId: string;
  let careerThemeSlug: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
    await seedDatabase(prisma);

    // Verify or find seeded figures
    const twain = await prisma.figure.findUniqueOrThrow({
      where: { slug: "mark-twain" },
    });
    const curie = await prisma.figure.findUniqueOrThrow({
      where: { slug: "marie-curie" },
    });
    const vanGogh = await prisma.figure.findUniqueOrThrow({
      where: { slug: "vincent-van-gogh" },
    });
    const careerTheme = await prisma.theme.findUniqueOrThrow({
      where: { slug: "choosing-a-career" },
    });

    twainId = twain.id;
    curieId = curie.id;
    vanGoghId = vanGogh.id;
    careerThemeSlug = careerTheme.slug;

    // Create a dedicated test user
    const user = await prisma.user.upsert({
      where: { email: "integration-roundtable@sagetable.test" },
      update: {},
      create: {
        email: "integration-roundtable@sagetable.test",
        passwordHash: "$2a$10$fakehashfortestingonly9999999999999999999999999999",
        role: "USER",
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    if (prisma) {
      // Clean up test roundtables created by test user
      await prisma.roundtable.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.user.deleteMany({
        where: { id: testUserId },
      });
      await prisma.$disconnect();
    }
  });

  it("matches curated answers and passages for career demo question with Twain, Curie, and Van Gogh", async () => {
    const question =
      "I'm not sure I picked the right major. How do I find work I actually love?";

    const roundtable = await createRoundtable(
      {
        userId: testUserId,
        themeSlug: careerThemeSlug,
        figureIds: [twainId, curieId, vanGoghId],
        question,
      },
      prisma,
    );

    expect(roundtable.id).toBeDefined();
    expect(roundtable.answers).toHaveLength(3);

    const matches = await matchRoundtableAnswers(roundtable.id, testUserId, prisma);
    expect(matches).toHaveLength(3);

    for (const match of matches) {
      expect(match.answer).not.toBeNull();
      expect(match.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
      expect(match.answer!.body.length).toBeGreaterThan(20);
      expect(match.answer!.passages.length).toBeGreaterThanOrEqual(1);

      const firstPassage = match.answer!.passages[0];
      expect(firstPassage.text.length).toBeGreaterThan(10);
      expect(firstPassage.workTitle.length).toBeGreaterThan(0);
      expect(firstPassage.workYear).toBeGreaterThan(0);
      expect(firstPassage.location.length).toBeGreaterThan(0);
      expect(firstPassage.explanation.length).toBeGreaterThan(0);
    }
  });

  it("returns no-match for all figures when question is 'What\\'s your favorite pizza topping?'", async () => {
    const pizzaQuestion = "What's your favorite pizza topping?";

    const roundtable = await createRoundtable(
      {
        userId: testUserId,
        themeSlug: careerThemeSlug,
        figureIds: [twainId, curieId, vanGoghId],
        question: pizzaQuestion,
      },
      prisma,
    );

    const matches = await matchRoundtableAnswers(roundtable.id, testUserId, prisma);
    expect(matches).toHaveLength(3);

    for (const match of matches) {
      expect(match.answer).toBeNull();
      expect(match.score).toBeLessThan(MATCH_THRESHOLD);
    }
  });

  it("retrieves a saved roundtable by user and prevents unauthorized access", async () => {
    const question = "How do I start a career when I still feel pulled toward too many interests?";

    const roundtable = await createRoundtable(
      {
        userId: testUserId,
        themeSlug: careerThemeSlug,
        figureIds: [twainId, curieId],
        question,
      },
      prisma,
    );

    const found = await getRoundtableForUser(roundtable.id, testUserId, prisma);
    expect(found).not.toBeNull();
    expect(found?.question).toBe(question);

    await expect(
      getRoundtableForUser(roundtable.id, "different-user-id", prisma),
    ).rejects.toThrow();
  });
});
