import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { loadSeedContent } from "@/lib/seedContent";
import { createTestPrismaClient, resetTestDatabase } from "../testDb";
import { MATCH_THRESHOLD, matchAnswers } from "./matchAnswers";

interface SeededFixtureIds {
  twainId: string;
  curieId: string;
  kellerId: string;
  careerThemeId: string;
  failureThemeId: string;
  twainCareerAnswerId: string;
  curieCareerAnswerId: string;
  curieFailureAnswerId: string;
}

async function seedMatchingFixtures(
  prisma: PrismaClient,
): Promise<SeededFixtureIds> {
  const twain = await prisma.figure.create({
    data: {
      slug: "mark-twain",
      name: "Mark Twain",
      field: "Writer",
      era: "1835–1910",
      bio: "American author and humorist.",
      avatarKey: "mark-twain",
    },
  });

  const curie = await prisma.figure.create({
    data: {
      slug: "marie-curie",
      name: "Marie Curie",
      field: "Physicist & Chemist",
      era: "1867–1934",
      bio: "Pioneer in radioactivity research.",
      avatarKey: "marie-curie",
    },
  });

  const keller = await prisma.figure.create({
    data: {
      slug: "helen-keller",
      name: "Helen Keller",
      field: "Writer & Advocate",
      era: "1880–1968",
      bio: "Author, lecturer, and advocate.",
      avatarKey: "helen-keller",
    },
  });

  const careerTheme = await prisma.theme.create({
    data: {
      slug: "choosing-a-career",
      name: "Choosing a Career",
      description: "Finding meaningful work and testing directions.",
    },
  });

  const failureTheme = await prisma.theme.create({
    data: {
      slug: "dealing-with-failure",
      name: "Dealing with Failure",
      description: "Handling mistakes, setbacks, and failed trials.",
    },
  });

  const twainWork = await prisma.work.create({
    data: {
      figureId: twain.id,
      title: "Life on the Mississippi",
      year: 1883,
      sourceUrl: "https://www.gutenberg.org/ebooks/245",
      publicDomainConfirmed: true,
    },
  });

  const twainLetters = await prisma.work.create({
    data: {
      figureId: twain.id,
      title: "Mark Twain's Letters",
      year: 1917,
      sourceUrl: "https://www.gutenberg.org/ebooks/3199",
      publicDomainConfirmed: true,
    },
  });

  const curieWork = await prisma.work.create({
    data: {
      figureId: curie.id,
      title: "Pierre Curie",
      year: 1923,
      sourceUrl: "https://www.gutenberg.org/ebooks/69617",
      publicDomainConfirmed: true,
    },
  });

  const twainPassage1 = await prisma.passage.create({
    data: {
      workId: twainWork.id,
      location: "Chapter 6",
      text: "He agreed to teach me the Mississippi River from New Orleans to St. Louis for five hundred dollars.",
    },
  });

  const twainPassage2 = await prisma.passage.create({
    data: {
      workId: twainLetters.id,
      location: "Vol. II, Ch. IX",
      text: "I have worked there at all the different trades and professions known to the catalogues.",
    },
  });

  const curieCareerPassage = await prisma.passage.create({
    data: {
      workId: curieWork.id,
      location: "Autobiographical Notes, Chapter I",
      text: "I had not yet decided what path I would choose. I finally turned towards mathematics and physics.",
    },
  });

  const curieFailurePassage = await prisma.passage.create({
    data: {
      workId: curieWork.id,
      location: "Autobiographical Notes, Chapter II",
      text: "I tried out various experiments described in treatises on physics and chemistry, at times in despair because of accidents and failures.",
    },
  });

  const twainCareerAnswer = await prisma.answer.create({
    data: {
      figureId: twain.id,
      themeId: careerTheme.id,
      topicKeywords: "major career work love job calling interests pays pilot",
      body: "Honestly, I didn't get my career right on the first try. Pick something, notice what you love about it, and steer from there.",
    },
  });

  await prisma.answerPassage.createMany({
    data: [
      {
        answerId: twainCareerAnswer.id,
        passageId: twainPassage1.id,
        explanation: "A little nerve gets you started before overthinking stalls you.",
        order: 0,
      },
      {
        answerId: twainCareerAnswer.id,
        passageId: twainPassage2.id,
        explanation: "Testing real jobs helps rule out poor fits.",
        order: 1,
      },
    ],
  });

  const curieCareerAnswer = await prisma.answer.create({
    data: {
      figureId: curie.id,
      themeId: careerTheme.id,
      topicKeywords: "major career work love job calling physics math",
      body: "You don't have to pick the right major right away. Notice what holds your focus when nobody makes you.",
    },
  });

  await prisma.answerPassage.create({
    data: {
      answerId: curieCareerAnswer.id,
      passageId: curieCareerPassage.id,
      explanation: "Explore your interests until one holds your steady attention.",
      order: 0,
    },
  });

  const curieFailureAnswer = await prisma.answer.create({
    data: {
      figureId: curie.id,
      themeId: failureTheme.id,
      topicKeywords: "failed exam failure mistake rejection trying wrong experiments",
      body: "Beginner mistakes don't mean you picked the wrong path. Fix one error in your experiment and test again.",
    },
  });

  await prisma.answerPassage.create({
    data: {
      answerId: curieFailureAnswer.id,
      passageId: curieFailurePassage.id,
      explanation: "Early accidents happen while learning; keep refining your trials.",
      order: 0,
    },
  });

  return {
    twainId: twain.id,
    curieId: curie.id,
    kellerId: keller.id,
    careerThemeId: careerTheme.id,
    failureThemeId: failureTheme.id,
    twainCareerAnswerId: twainCareerAnswer.id,
    curieCareerAnswerId: curieCareerAnswer.id,
    curieFailureAnswerId: curieFailureAnswer.id,
  };
}

describe("matchAnswers PostgreSQL integration", () => {
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

  it("matches curated answers and ordered verbatim passages across selected figures", async () => {
    const ids = await seedMatchingFixtures(prisma);

    const results = await matchAnswers(
      {
        question:
          "I'm not sure I picked the right major. How do I find work I actually love?",
        figureIds: [ids.twainId, ids.curieId, ids.kellerId],
        themeId: ids.careerThemeId,
      },
      prisma,
    );

    expect(results).toHaveLength(3);

    const [twainResult, curieResult, kellerResult] = results;

    expect(twainResult?.figureId).toBe(ids.twainId);
    expect(twainResult?.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(twainResult?.answer?.id).toBe(ids.twainCareerAnswerId);
    expect(twainResult?.answer?.passages).toEqual([
      {
        text: "He agreed to teach me the Mississippi River from New Orleans to St. Louis for five hundred dollars.",
        workTitle: "Life on the Mississippi",
        workYear: 1883,
        location: "Chapter 6",
        explanation:
          "A little nerve gets you started before overthinking stalls you.",
      },
      {
        text: "I have worked there at all the different trades and professions known to the catalogues.",
        workTitle: "Mark Twain's Letters",
        workYear: 1917,
        location: "Vol. II, Ch. IX",
        explanation: "Testing real jobs helps rule out poor fits.",
      },
    ]);

    expect(curieResult?.figureId).toBe(ids.curieId);
    expect(curieResult?.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(curieResult?.answer?.id).toBe(ids.curieCareerAnswerId);
    expect(curieResult?.answer?.passages).toHaveLength(1);

    expect(kellerResult).toEqual({
      figureId: ids.kellerId,
      answer: null,
      score: 0,
    });
  });

  it("matches relevant answers even when themeId is omitted for manual figure selection", async () => {
    const ids = await seedMatchingFixtures(prisma);

    const results = await matchAnswers(
      {
        question: "I failed an important physics exam and ruined my experiment.",
        figureIds: [ids.curieId],
      },
      prisma,
    );

    expect(results[0]?.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(results[0]?.answer?.id).toBe(ids.curieFailureAnswerId);
  });

  it("uses theme tags to break ties when keywords overlap across themes", async () => {
    const ids = await seedMatchingFixtures(prisma);

    const physicsWork = await prisma.work.findFirstOrThrow({
      where: { figureId: ids.curieId },
    });
    const extraPassage = await prisma.passage.create({
      data: {
        workId: physicsWork.id,
        location: "Chapter III",
        text: "Patience sustained every tedious preparation day after day.",
      },
    });

    const identicalBody = "Stay steady when patience is tested in daily work.";
    const careerOverlap = await prisma.answer.create({
      data: {
        figureId: ids.curieId,
        themeId: ids.careerThemeId,
        topicKeywords: "patience persistence discipline",
        body: identicalBody,
      },
    });
    const failureOverlap = await prisma.answer.create({
      data: {
        figureId: ids.curieId,
        themeId: ids.failureThemeId,
        topicKeywords: "patience persistence discipline",
        body: identicalBody,
      },
    });

    await prisma.answerPassage.createMany({
      data: [
        {
          answerId: careerOverlap.id,
          passageId: extraPassage.id,
          explanation: "Career patience note.",
          order: 0,
        },
        {
          answerId: failureOverlap.id,
          passageId: extraPassage.id,
          explanation: "Failure patience note.",
          order: 0,
        },
      ],
    });

    const failureResults = await matchAnswers(
      {
        question: "How do I keep patience and persistence?",
        figureIds: [ids.curieId],
        themeId: ids.failureThemeId,
      },
      prisma,
    );

    expect(failureResults[0]?.answer?.id).toBe(failureOverlap.id);

    const careerResults = await matchAnswers(
      {
        question: "How do I keep patience and persistence?",
        figureIds: [ids.curieId],
        themeId: ids.careerThemeId,
      },
      prisma,
    );

    expect(careerResults[0]?.answer?.id).toBe(careerOverlap.id);
  });

  it("returns answer: null on off-topic questions even when a themeId is supplied", async () => {
    const ids = await seedMatchingFixtures(prisma);

    const results = await matchAnswers(
      {
        question: "How do I tune a carburetor on a 1998 Honda Civic?",
        figureIds: [ids.twainId, ids.curieId],
        themeId: ids.careerThemeId,
      },
      prisma,
    );

    expect(results).toEqual([
      { figureId: ids.twainId, answer: null, score: 0 },
      { figureId: ids.curieId, answer: null, score: 0 },
    ]);
  });

  it("rejects an unrelated question sharing only one stray body word below MATCH_THRESHOLD", async () => {
    const ids = await seedMatchingFixtures(prisma);

    const results = await matchAnswers(
      {
        question:
          "How should I pick ripe tomatoes and bake sourdough pizza dough tonight?",
        figureIds: [ids.twainId, ids.curieId],
        themeId: ids.careerThemeId,
      },
      prisma,
    );

    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result.score).toBeLessThan(MATCH_THRESHOLD);
      expect(result.answer).toBeNull();
    }
  });

  it("prioritizes topicKeywords (weight A) above incidental body wording (weight B)", async () => {
    const ids = await seedMatchingFixtures(prisma);

    const curieWork = await prisma.work.findFirstOrThrow({
      where: { figureId: ids.curieId },
    });
    const resiliencePassage = await prisma.passage.create({
      data: {
        workId: curieWork.id,
        location: "Chapter IV",
        text: "Endurance matters when laboratory instruments fail.",
      },
    });

    const keywordAnswer = await prisma.answer.create({
      data: {
        figureId: ids.curieId,
        themeId: ids.failureThemeId,
        topicKeywords: "resilience grit fortitude",
        body: "Keep careful notes when tests are difficult.",
      },
    });

    const bodyAnswer = await prisma.answer.create({
      data: {
        figureId: ids.curieId,
        themeId: ids.failureThemeId,
        topicKeywords: "astronomy telescope stars",
        body: "True resilience appears when measurements falter, and resilience keeps study alive.",
      },
    });

    await prisma.answerPassage.createMany({
      data: [
        {
          answerId: keywordAnswer.id,
          passageId: resiliencePassage.id,
          explanation: "Keyword-ranked passage.",
          order: 0,
        },
        {
          answerId: bodyAnswer.id,
          passageId: resiliencePassage.id,
          explanation: "Body-ranked passage.",
          order: 0,
        },
      ],
    });

    const results = await matchAnswers(
      {
        question: "How do I build resilience?",
        figureIds: [ids.curieId],
        themeId: ids.failureThemeId,
      },
      prisma,
    );

    expect(results[0]?.answer?.id).toBe(keywordAnswer.id);
    expect(results[0]?.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  it("matches answers via linked Passage.searchVector phrasing", async () => {
    const ids = await seedMatchingFixtures(prisma);

    const results = await matchAnswers(
      {
        question: "Mississippi River from New Orleans to St. Louis",
        figureIds: [ids.twainId],
      },
      prisma,
    );

    expect(results[0]?.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    expect(results[0]?.answer?.id).toBe(ids.twainCareerAnswerId);
  });

  it("matches every suggested question in the curated seed dataset to its theme across all figures", async () => {
    const content = loadSeedContent();
    const figureIdsBySlug = new Map<string, string>();
    const themeIdsBySlug = new Map<string, string>();

    for (const fig of content.figures) {
      const created = await prisma.figure.create({
        data: {
          slug: fig.slug,
          name: fig.name,
          field: fig.field,
          era: fig.era,
          bio: fig.bio,
          avatarKey: fig.slug,
        },
      });
      figureIdsBySlug.set(fig.slug, created.id);
    }

    for (const theme of content.themes) {
      const created = await prisma.theme.create({
        data: {
          slug: theme.slug,
          name: theme.name,
          description: theme.description,
          suggestedQuestions: theme.suggestedQuestions,
        },
      });
      themeIdsBySlug.set(theme.slug, created.id);
    }

    for (const figContent of content.figureContents) {
      const figureId = figureIdsBySlug.get(figContent.figure)!;
      const workIdsByKey = new Map<string, string>();
      const passageIdsByKey = new Map<string, string>();

      for (const work of figContent.works) {
        const createdWork = await prisma.work.create({
          data: {
            figureId,
            title: work.title,
            year: work.year,
            sourceUrl: work.sourceUrl,
            publicDomainConfirmed: true,
          },
        });
        workIdsByKey.set(work.key, createdWork.id);
      }

      for (const passage of figContent.passages) {
        const createdPassage = await prisma.passage.create({
          data: {
            workId: workIdsByKey.get(passage.work)!,
            location: passage.location,
            text: passage.text,
          },
        });
        passageIdsByKey.set(passage.key, createdPassage.id);
      }

      for (const answer of figContent.answers) {
        const createdAnswer = await prisma.answer.create({
          data: {
            figureId,
            themeId: themeIdsBySlug.get(answer.theme)!,
            topicKeywords: answer.topicKeywords.join(" "),
            body: answer.body,
          },
        });
        await prisma.answerPassage.createMany({
          data: answer.passages.map((p, index) => ({
            answerId: createdAnswer.id,
            passageId: passageIdsByKey.get(p.passage)!,
            explanation: p.explanation,
            order: index,
          })),
        });
      }
    }

    const allFigureIds = Array.from(figureIdsBySlug.values());

    for (const theme of content.themes) {
      const themeId = themeIdsBySlug.get(theme.slug)!;
      for (const question of theme.suggestedQuestions) {
        const matches = await matchAnswers(
          { question, figureIds: allFigureIds, themeId },
          prisma,
        );
        expect(matches).toHaveLength(allFigureIds.length);
        for (const match of matches) {
          expect(match.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
          expect(match.answer?.themeId).toBe(themeId);
          expect(match.answer?.passages.length).toBeGreaterThanOrEqual(1);
          expect(match.answer?.passages.length).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});
