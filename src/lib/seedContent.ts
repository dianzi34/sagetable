import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const EXPECTED_FIGURE_COUNT = 5;
export const EXPECTED_THEME_COUNT = 5;
export const EXPECTED_ANSWER_COUNT = EXPECTED_FIGURE_COUNT * EXPECTED_THEME_COUNT;

export const DEFAULT_SEED_CONTENT_DIR = path.resolve(
  process.cwd(),
  "prisma/seed/content",
);

const LOWERCASE_WORD_REGEX = /^[a-z]+$/;
const SENTENCE_SPLIT_REGEX = /(?<=[.!?]["”')\]\u2019]*)\s+/;

/**
 * Count whitespace-delimited words in a string.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Count sentences terminated by punctuation followed by whitespace.
 */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(SENTENCE_SPLIT_REGEX).filter(Boolean).length;
}

function addDuplicateKeyIssues(
  keys: readonly string[],
  label: string,
  basePath: (string | number)[],
  ctx: z.RefinementCtx,
): Set<string> {
  const seen = new Set<string>();
  keys.forEach((key, index) => {
    if (seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        path: [...basePath, index],
        message: `Duplicate ${label}: ${key}`,
      });
    }
    seen.add(key);
  });
  return seen;
}

const nonEmptyString = z.string().trim().min(1);

export const seedFigureSchema = z.object({
  slug: nonEmptyString,
  name: nonEmptyString,
  field: nonEmptyString,
  era: nonEmptyString,
  bio: nonEmptyString,
  suggestedThemes: z.array(nonEmptyString).optional(),
});

export const seedThemeSchema = z.object({
  slug: nonEmptyString,
  name: nonEmptyString,
  description: nonEmptyString,
  suggestedFigures: z
    .array(nonEmptyString)
    .min(2, "Theme must have 2-3 suggestedFigures")
    .max(3, "Theme must have 2-3 suggestedFigures"),
  suggestedQuestions: z
    .array(nonEmptyString)
    .min(2, "Theme must have 2-3 suggestedQuestions")
    .max(3, "Theme must have 2-3 suggestedQuestions"),
});

export const seedWorkSchema = z.object({
  key: nonEmptyString,
  title: nonEmptyString,
  year: z.number().int().positive(),
  sourceUrl: z.url(),
});

export const seedPassageSchema = z.object({
  key: nonEmptyString,
  work: nonEmptyString,
  location: nonEmptyString,
  text: nonEmptyString.refine(
    (value) => {
      const words = countWords(value);
      return words >= 30 && words <= 90;
    },
    { message: "Passage text must be 30-90 words" },
  ),
});

export const seedAnswerPassageSchema = z.object({
  passage: nonEmptyString,
  explanation: nonEmptyString
    .refine((value) => countWords(value) <= 35, {
      message: "Explanation must be at most 35 words",
    })
    .refine((value) => countSentences(value) <= 2, {
      message: "Explanation must be at most 2 sentences",
    }),
});

export const seedAnswerSchema = z.object({
  theme: nonEmptyString,
  topicKeywords: z
    .array(
      z
        .string()
        .regex(
          LOWERCASE_WORD_REGEX,
          "Topic keyword must be a non-empty lowercase word",
        ),
    )
    .min(1, "Answer must include at least one topicKeyword"),
  body: nonEmptyString.refine(
    (value) => {
      const words = countWords(value);
      return words >= 60 && words <= 100;
    },
    { message: "Answer body must be 60-100 words" },
  ),
  passages: z
    .array(seedAnswerPassageSchema)
    .min(1, "Answer must reference at least one passage"),
});

export const seedFigureContentSchema = z
  .object({
    figure: nonEmptyString,
    works: z.array(seedWorkSchema).min(1),
    passages: z.array(seedPassageSchema).min(1),
    answers: z.array(seedAnswerSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const workKeys = addDuplicateKeyIssues(
      data.works.map((work) => work.key),
      "work key",
      ["works"],
      ctx,
    );
    const passageKeys = addDuplicateKeyIssues(
      data.passages.map((passage) => passage.key),
      "passage key",
      ["passages"],
      ctx,
    );
    addDuplicateKeyIssues(
      data.answers.map((answer) => answer.theme),
      "answer theme",
      ["answers"],
      ctx,
    );

    data.passages.forEach((passage, index) => {
      if (!workKeys.has(passage.work)) {
        ctx.addIssue({
          code: "custom",
          path: ["passages", index, "work"],
          message: `Passage "${passage.key}" references unknown work "${passage.work}"`,
        });
      }
    });

    data.answers.forEach((answer, answerIndex) => {
      answer.passages.forEach((answerPassage, passageIndex) => {
        if (!passageKeys.has(answerPassage.passage)) {
          ctx.addIssue({
            code: "custom",
            path: ["answers", answerIndex, "passages", passageIndex, "passage"],
            message: `Answer for "${answer.theme}" references unknown passage "${answerPassage.passage}"`,
          });
        }
      });
    });
  });

export const seedContentSchema = z
  .object({
    figures: z
      .array(seedFigureSchema)
      .length(EXPECTED_FIGURE_COUNT, "Exactly 5 figures are required"),
    themes: z
      .array(seedThemeSchema)
      .length(EXPECTED_THEME_COUNT, "Exactly 5 themes are required"),
    figureContents: z
      .array(seedFigureContentSchema)
      .length(EXPECTED_FIGURE_COUNT, "Exactly 5 figure content files are required"),
  })
  .superRefine((data, ctx) => {
    const figureSlugs = addDuplicateKeyIssues(
      data.figures.map((figure) => figure.slug),
      "figure slug",
      ["figures"],
      ctx,
    );
    const themeSlugs = addDuplicateKeyIssues(
      data.themes.map((theme) => theme.slug),
      "theme slug",
      ["themes"],
      ctx,
    );
    const contentFigureSlugs = addDuplicateKeyIssues(
      data.figureContents.map((content) => content.figure),
      "figure content entry",
      ["figureContents"],
      ctx,
    );

    data.themes.forEach((theme, themeIndex) => {
      addDuplicateKeyIssues(
        theme.suggestedFigures,
        "suggestedFigure",
        ["themes", themeIndex, "suggestedFigures"],
        ctx,
      );
      theme.suggestedFigures.forEach((figureSlug, figureIndex) => {
        if (!figureSlugs.has(figureSlug)) {
          ctx.addIssue({
            code: "custom",
            path: ["themes", themeIndex, "suggestedFigures", figureIndex],
            message: `Theme "${theme.slug}" references unknown figure "${figureSlug}"`,
          });
        }
      });
    });

    data.figures.forEach((figure, figureIndex) => {
      if (!contentFigureSlugs.has(figure.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["figures", figureIndex, "slug"],
          message: `Missing figure content file for "${figure.slug}"`,
        });
      }
      figure.suggestedThemes?.forEach((themeSlug, themeIndex) => {
        if (!themeSlugs.has(themeSlug)) {
          ctx.addIssue({
            code: "custom",
            path: ["figures", figureIndex, "suggestedThemes", themeIndex],
            message: `Figure "${figure.slug}" references unknown theme "${themeSlug}"`,
          });
        }
      });
    });

    const coveredPairs = new Set<string>();
    let totalAnswers = 0;

    data.figureContents.forEach((content, contentIndex) => {
      if (!figureSlugs.has(content.figure)) {
        ctx.addIssue({
          code: "custom",
          path: ["figureContents", contentIndex, "figure"],
          message: `Figure content references unknown figure "${content.figure}"`,
        });
      }

      content.answers.forEach((answer, answerIndex) => {
        totalAnswers += 1;
        if (!themeSlugs.has(answer.theme)) {
          ctx.addIssue({
            code: "custom",
            path: ["figureContents", contentIndex, "answers", answerIndex, "theme"],
            message: `Answer references unknown theme "${answer.theme}"`,
          });
        }
        coveredPairs.add(`${content.figure}:${answer.theme}`);
      });
    });

    if (
      totalAnswers !== EXPECTED_ANSWER_COUNT ||
      coveredPairs.size !== EXPECTED_ANSWER_COUNT
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["figureContents"],
        message: `Expected ${EXPECTED_ANSWER_COUNT} unique figure x theme answers, found ${coveredPairs.size}`,
      });
    }
  });

export type SeedFigure = z.infer<typeof seedFigureSchema>;
export type SeedTheme = z.infer<typeof seedThemeSchema>;
export type SeedWork = z.infer<typeof seedWorkSchema>;
export type SeedPassage = z.infer<typeof seedPassageSchema>;
export type SeedAnswerPassage = z.infer<typeof seedAnswerPassageSchema>;
export type SeedAnswer = z.infer<typeof seedAnswerSchema>;
export type SeedFigureContent = z.infer<typeof seedFigureContentSchema>;
export type SeedContent = z.infer<typeof seedContentSchema>;

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

/**
 * Load and validate curated seed JSON files from disk.
 */
export function loadSeedContent(
  contentDir: string = DEFAULT_SEED_CONTENT_DIR,
): SeedContent {
  const jsonFiles = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const figures = readJsonFile(path.join(contentDir, "figures.json"));
  const themes = readJsonFile(path.join(contentDir, "themes.json"));

  const figureFiles = jsonFiles.filter(
    (file) => file !== "figures.json" && file !== "themes.json",
  );
  const figureContents = figureFiles.map((file) => {
    const parsed = readJsonFile(path.join(contentDir, file));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "figure" in parsed &&
      typeof parsed.figure === "string" &&
      `${parsed.figure}.json` !== file
    ) {
      throw new Error(
        `Seed file "${file}" does not match declared figure "${parsed.figure}"`,
      );
    }
    return parsed;
  });

  return seedContentSchema.parse({
    figures,
    themes,
    figureContents,
  });
}
