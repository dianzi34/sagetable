import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEMO_ANSWER_CARDS,
  DEMO_NO_MATCH_CARD,
  DEMO_THEME_SLUG,
} from "@/server/fixtures/answerCards";
import {
  countSentences,
  countWords,
  loadSeedContent,
  seedContentSchema,
  type SeedContent,
  type SeedFigure,
  type SeedFigureContent,
  type SeedTheme,
} from "./seedContent";

const SEED_CONTENT_DIR = path.resolve(process.cwd(), "prisma/seed/content");

function makeWords(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index + 1}`).join(" ");
}

function createValidSeedContent(): SeedContent {
  const figures: SeedFigure[] = [
    "figure-one",
    "figure-two",
    "figure-three",
    "figure-four",
    "figure-five",
  ].map((slug, index) => ({
    slug,
    name: `Figure ${index + 1}`,
    field: "Literature",
    era: "19th Century",
    bio: "Short biography for testing seed content validation.",
    suggestedThemes: ["theme-one", "theme-two"],
  }));

  const themes: SeedTheme[] = [
    "theme-one",
    "theme-two",
    "theme-three",
    "theme-four",
    "theme-five",
  ].map((slug, index) => ({
    slug,
    name: `Theme ${index + 1}`,
    description: "Theme description for testing seed content validation.",
    suggestedFigures: ["figure-one", "figure-two", "figure-three"],
    suggestedQuestions: [
      "How do I start when everything feels uncertain?",
      "What keeps you steady during a difficult setback?",
    ],
  }));

  const figureContents: SeedFigureContent[] = figures.map((figure) => ({
    figure: figure.slug,
    works: [
      {
        key: `${figure.slug}-work`,
        title: `Collected Writings of ${figure.name}`,
        year: 1900,
        sourceUrl: "https://www.gutenberg.org/ebooks/1",
      },
    ],
    passages: [
      {
        key: `${figure.slug}-passage`,
        work: `${figure.slug}-work`,
        location: "Chapter I",
        text: `${makeWords(40)}.`,
      },
    ],
    answers: themes.map((theme) => ({
      theme: theme.slug,
      topicKeywords: ["courage", "work", "steady", "practice"],
      body: `${makeWords(75)}.`,
      passages: [
        {
          passage: `${figure.slug}-passage`,
          explanation: "First plain sentence. Second plain sentence.",
        },
      ],
    })),
  }));

  return { figures, themes, figureContents };
}

describe("curated seed content files", () => {
  it("loads and validates all prisma/seed/content/*.json files", () => {
    const jsonFiles = fs
      .readdirSync(SEED_CONTENT_DIR)
      .filter((file) => file.endsWith(".json"))
      .sort();

    expect(jsonFiles.length).toBe(7);

    const figures = JSON.parse(
      fs.readFileSync(path.join(SEED_CONTENT_DIR, "figures.json"), "utf8"),
    ) as unknown;
    const themes = JSON.parse(
      fs.readFileSync(path.join(SEED_CONTENT_DIR, "themes.json"), "utf8"),
    ) as unknown;

    const figureFiles = jsonFiles.filter(
      (file) => file !== "figures.json" && file !== "themes.json",
    );
    expect(figureFiles.length).toBe(5);

    const figureContents = figureFiles.map(
      (file) =>
        JSON.parse(
          fs.readFileSync(path.join(SEED_CONTENT_DIR, file), "utf8"),
        ) as unknown,
    );

    const parsed = seedContentSchema.safeParse({
      figures,
      themes,
      figureContents,
    });
    expect(parsed.success).toBe(true);

    const loaded = loadSeedContent();
    expect(loaded.figures).toHaveLength(5);
    expect(loaded.themes).toHaveLength(5);
    expect(loaded.figureContents).toHaveLength(5);
  });

  it("has 5 figures, 5 themes with 2-3 suggestedQuestions and 2-3 existing suggestedFigures, and 25 figure x theme answers", () => {
    const content = loadSeedContent();
    const figureSlugs = new Set(content.figures.map((figure) => figure.slug));
    const themeSlugs = new Set(content.themes.map((theme) => theme.slug));

    expect(figureSlugs.size).toBe(5);
    expect(themeSlugs.size).toBe(5);

    for (const theme of content.themes) {
      expect(theme.suggestedQuestions.length).toBeGreaterThanOrEqual(2);
      expect(theme.suggestedQuestions.length).toBeLessThanOrEqual(3);
      expect(theme.suggestedFigures.length).toBeGreaterThanOrEqual(2);
      expect(theme.suggestedFigures.length).toBeLessThanOrEqual(3);
      for (const suggestedSlug of theme.suggestedFigures) {
        expect(figureSlugs.has(suggestedSlug)).toBe(true);
      }
    }

    const coveredPairs = new Set<string>();
    let totalAnswers = 0;

    for (const figureContent of content.figureContents) {
      expect(figureSlugs.has(figureContent.figure)).toBe(true);
      for (const answer of figureContent.answers) {
        totalAnswers += 1;
        expect(themeSlugs.has(answer.theme)).toBe(true);
        coveredPairs.add(`${figureContent.figure}:${answer.theme}`);
      }
    }

    expect(totalAnswers).toBe(25);
    expect(coveredPairs.size).toBe(25);
  });

  it("ensures every answer references existing passages and every passage references an existing work with title, year, and sourceUrl", () => {
    const content = loadSeedContent();

    for (const figureContent of content.figureContents) {
      const workByKey = new Map(
        figureContent.works.map((work) => [work.key, work]),
      );
      const passageByKey = new Map(
        figureContent.passages.map((passage) => [passage.key, passage]),
      );

      for (const passage of figureContent.passages) {
        const work = workByKey.get(passage.work);
        expect(work).toBeDefined();
        expect(work?.title.trim().length).toBeGreaterThan(0);
        expect(Number.isInteger(work?.year)).toBe(true);
        expect(() => new URL(work?.sourceUrl ?? "")).not.toThrow();
      }

      for (const answer of figureContent.answers) {
        expect(answer.passages.length).toBeGreaterThanOrEqual(1);
        for (const answerPassage of answer.passages) {
          expect(passageByKey.has(answerPassage.passage)).toBe(true);
        }
      }
    }
  });

  it("uses short field labels (at most 3 words) and year-only era ranges for all figures", () => {
    const content = loadSeedContent();

    for (const figure of content.figures) {
      expect(figure.era).toMatch(/^\d{4}–\d{4}$/);
      expect(countWords(figure.field)).toBeLessThanOrEqual(3);
    }
  });

  it("writes every passage explanation in the third person", () => {
    const content = loadSeedContent();

    for (const figureContent of content.figureContents) {
      for (const answer of figureContent.answers) {
        for (const answerPassage of answer.passages) {
          expect(answerPassage.explanation.startsWith("I ")).toBe(false);
          expect(answerPassage.explanation).not.toContain(" I ");
          expect(answerPassage.explanation).not.toContain(" my ");
          expect(answerPassage.explanation).not.toMatch(
            /\b(me|my|mine|myself)\b/i,
          );
        }
      }
    }
  });

  it("enforces word and sentence limits and lowercase topicKeywords across all curated entries", () => {
    const content = loadSeedContent();

    for (const figureContent of content.figureContents) {
      for (const passage of figureContent.passages) {
        const passageWords = countWords(passage.text);
        expect(passageWords).toBeGreaterThanOrEqual(30);
        expect(passageWords).toBeLessThanOrEqual(90);
      }

      for (const answer of figureContent.answers) {
        const bodyWords = countWords(answer.body);
        expect(bodyWords).toBeGreaterThanOrEqual(60);
        expect(bodyWords).toBeLessThanOrEqual(100);

        expect(answer.topicKeywords.length).toBeGreaterThan(0);
        for (const keyword of answer.topicKeywords) {
          expect(keyword).toMatch(/^[a-z]+$/);
        }

        for (const answerPassage of answer.passages) {
          expect(countWords(answerPassage.explanation)).toBeLessThanOrEqual(35);
          expect(countSentences(answerPassage.explanation)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("keeps /roundtable answer card fixtures in sync with curated seed content", () => {
    const content = loadSeedContent();
    const figureBySlug = new Map(
      content.figures.map((figure) => [figure.slug, figure]),
    );
    const contentByFigure = new Map(
      content.figureContents.map((entry) => [entry.figure, entry]),
    );

    for (const card of [...DEMO_ANSWER_CARDS, DEMO_NO_MATCH_CARD]) {
      const figure = figureBySlug.get(card.figure.slug);
      expect(figure).toBeDefined();
      expect(card.figure.field).toBe(figure?.field);
      expect(card.figure.era).toBe(figure?.era);

      if (card.answer !== null) {
        const figureContent = contentByFigure.get(card.figure.slug);
        const seedAnswer = figureContent?.answers.find(
          (answer) => answer.theme === DEMO_THEME_SLUG,
        );
        expect(seedAnswer).toBeDefined();
        expect(card.answer.body).toBe(seedAnswer?.body);
        expect(card.answer.passages.map((p) => p.explanation)).toEqual(
          seedAnswer?.passages.map((p) => p.explanation),
        );
      }
    }
  });
});

describe("seedContentSchema validation", () => {
  it("accepts a valid 5x5 seed content bundle", () => {
    const result = seedContentSchema.safeParse(createValidSeedContent());
    expect(result.success).toBe(true);
  });

  it("rejects when figure or theme counts are not 5", () => {
    const missingFigure = createValidSeedContent();
    missingFigure.figures = missingFigure.figures.slice(0, 4);
    expect(seedContentSchema.safeParse(missingFigure).success).toBe(false);

    const missingTheme = createValidSeedContent();
    missingTheme.themes = missingTheme.themes.slice(0, 4);
    expect(seedContentSchema.safeParse(missingTheme).success).toBe(false);
  });

  it("rejects themes with invalid suggestedQuestions or suggestedFigures", () => {
    const tooFewQuestions = createValidSeedContent();
    tooFewQuestions.themes[0].suggestedQuestions = ["Only one question?"];
    expect(seedContentSchema.safeParse(tooFewQuestions).success).toBe(false);

    const tooManyQuestions = createValidSeedContent();
    tooManyQuestions.themes[0].suggestedQuestions = ["Q1?", "Q2?", "Q3?", "Q4?"];
    expect(seedContentSchema.safeParse(tooManyQuestions).success).toBe(false);

    const tooFewFigures = createValidSeedContent();
    tooFewFigures.themes[0].suggestedFigures = ["figure-one"];
    expect(seedContentSchema.safeParse(tooFewFigures).success).toBe(false);

    const unknownFigure = createValidSeedContent();
    unknownFigure.themes[0].suggestedFigures = ["figure-one", "nonexistent"];
    expect(seedContentSchema.safeParse(unknownFigure).success).toBe(false);
  });

  it("rejects missing or duplicate figure x theme answers", () => {
    const missingPair = createValidSeedContent();
    missingPair.figureContents[0].answers = missingPair.figureContents[0].answers.slice(0, 4);
    expect(seedContentSchema.safeParse(missingPair).success).toBe(false);

    const duplicateTheme = createValidSeedContent();
    duplicateTheme.figureContents[0].answers[4] = {
      ...duplicateTheme.figureContents[0].answers[0],
    };
    expect(seedContentSchema.safeParse(duplicateTheme).success).toBe(false);
  });

  it("rejects broken passage or work references and invalid work metadata", () => {
    const missingPassage = createValidSeedContent();
    missingPassage.figureContents[0].answers[0].passages[0].passage = "missing-passage";
    expect(seedContentSchema.safeParse(missingPassage).success).toBe(false);

    const missingWork = createValidSeedContent();
    missingWork.figureContents[0].passages[0].work = "missing-work";
    expect(seedContentSchema.safeParse(missingWork).success).toBe(false);

    const invalidWorkUrl = createValidSeedContent();
    invalidWorkUrl.figureContents[0].works[0].sourceUrl = "not-a-url";
    expect(seedContentSchema.safeParse(invalidWorkUrl).success).toBe(false);

    const emptyWorkTitle = createValidSeedContent();
    emptyWorkTitle.figureContents[0].works[0].title = "   ";
    expect(seedContentSchema.safeParse(emptyWorkTitle).success).toBe(false);

    const nonIntegerYear = createValidSeedContent();
    nonIntegerYear.figureContents[0].works[0].year = 1900.5;
    expect(seedContentSchema.safeParse(nonIntegerYear).success).toBe(false);
  });

  it("rejects out-of-range word and sentence counts for answers, passages, and explanations", () => {
    const shortBody = createValidSeedContent();
    shortBody.figureContents[0].answers[0].body = makeWords(59);
    expect(seedContentSchema.safeParse(shortBody).success).toBe(false);

    const longBody = createValidSeedContent();
    longBody.figureContents[0].answers[0].body = makeWords(101);
    expect(seedContentSchema.safeParse(longBody).success).toBe(false);

    const shortPassage = createValidSeedContent();
    shortPassage.figureContents[0].passages[0].text = makeWords(29);
    expect(seedContentSchema.safeParse(shortPassage).success).toBe(false);

    const longPassage = createValidSeedContent();
    longPassage.figureContents[0].passages[0].text = makeWords(91);
    expect(seedContentSchema.safeParse(longPassage).success).toBe(false);

    const longExplanation = createValidSeedContent();
    longExplanation.figureContents[0].answers[0].passages[0].explanation = `${makeWords(36)}.`;
    expect(seedContentSchema.safeParse(longExplanation).success).toBe(false);

    const threeSentences = createValidSeedContent();
    threeSentences.figureContents[0].answers[0].passages[0].explanation =
      "First sentence. Second sentence. Third sentence.";
    expect(seedContentSchema.safeParse(threeSentences).success).toBe(false);
  });

  it("rejects empty or non-lowercase topicKeywords", () => {
    const emptyKeywords = createValidSeedContent();
    emptyKeywords.figureContents[0].answers[0].topicKeywords = [];
    expect(seedContentSchema.safeParse(emptyKeywords).success).toBe(false);

    const uppercaseKeyword = createValidSeedContent();
    uppercaseKeyword.figureContents[0].answers[0].topicKeywords = ["Career"];
    expect(seedContentSchema.safeParse(uppercaseKeyword).success).toBe(false);

    const multiWordKeyword = createValidSeedContent();
    multiWordKeyword.figureContents[0].answers[0].topicKeywords = ["hard work"];
    expect(seedContentSchema.safeParse(multiWordKeyword).success).toBe(false);
  });
});
