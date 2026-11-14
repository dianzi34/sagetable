import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  DEFAULT_SEED_CONTENT_DIR,
  loadSeedContent,
  type SeedFigure,
  type SeedFigureContent,
  type SeedTheme,
} from "../src/lib/seedContent";

export interface SeedResult {
  figures: number;
  themes: number;
  figureThemes: number;
  works: number;
  passages: number;
  answers: number;
  answerPassages: number;
}

async function upsertFigures(
  tx: Prisma.TransactionClient,
  figures: readonly SeedFigure[],
): Promise<Map<string, string>> {
  const figureIdsBySlug = new Map<string, string>();

  for (const figure of figures) {
    const record = await tx.figure.upsert({
      where: { slug: figure.slug },
      update: {
        name: figure.name,
        field: figure.field,
        era: figure.era,
        bio: figure.bio,
        avatarKey: figure.slug,
      },
      create: {
        slug: figure.slug,
        name: figure.name,
        field: figure.field,
        era: figure.era,
        bio: figure.bio,
        avatarKey: figure.slug,
      },
    });
    figureIdsBySlug.set(figure.slug, record.id);
  }

  return figureIdsBySlug;
}

async function upsertThemesAndLinks(
  tx: Prisma.TransactionClient,
  themes: readonly SeedTheme[],
  figureIdsBySlug: ReadonlyMap<string, string>,
): Promise<{ themeIdsBySlug: Map<string, string>; figureThemeCount: number }> {
  const themeIdsBySlug = new Map<string, string>();
  let figureThemeCount = 0;

  for (const theme of themes) {
    const themeRecord = await tx.theme.upsert({
      where: { slug: theme.slug },
      update: {
        name: theme.name,
        description: theme.description,
        suggestedQuestions: theme.suggestedQuestions,
      },
      create: {
        slug: theme.slug,
        name: theme.name,
        description: theme.description,
        suggestedQuestions: theme.suggestedQuestions,
      },
    });
    themeIdsBySlug.set(theme.slug, themeRecord.id);

    const linkedFigureIds: string[] = [];
    for (const [order, figureSlug] of theme.suggestedFigures.entries()) {
      const figureId = figureIdsBySlug.get(figureSlug);
      if (!figureId) {
        throw new Error(
          `Theme "${theme.slug}" references missing figure "${figureSlug}"`,
        );
      }
      linkedFigureIds.push(figureId);

      await tx.figureTheme.upsert({
        where: {
          figureId_themeId: {
            figureId,
            themeId: themeRecord.id,
          },
        },
        update: { order },
        create: {
          figureId,
          themeId: themeRecord.id,
          order,
        },
      });
      figureThemeCount += 1;
    }

    await tx.figureTheme.deleteMany({
      where: {
        themeId: themeRecord.id,
        figureId: { notIn: linkedFigureIds },
      },
    });
  }

  return { themeIdsBySlug, figureThemeCount };
}

async function upsertWorksAndPassages(
  tx: Prisma.TransactionClient,
  figureId: string,
  content: SeedFigureContent,
): Promise<{ workCount: number; passageIdsByKey: Map<string, string> }> {
  const workIdsByKey = new Map<string, string>();

  for (const work of content.works) {
    const workRecord = await tx.work.upsert({
      where: {
        figureId_title: {
          figureId,
          title: work.title,
        },
      },
      update: {
        year: work.year,
        sourceUrl: work.sourceUrl,
        publicDomainConfirmed: true,
      },
      create: {
        figureId,
        title: work.title,
        year: work.year,
        sourceUrl: work.sourceUrl,
        publicDomainConfirmed: true,
      },
    });
    workIdsByKey.set(work.key, workRecord.id);
  }

  const passageIdsByKey = new Map<string, string>();
  for (const passage of content.passages) {
    const workId = workIdsByKey.get(passage.work);
    if (!workId) {
      throw new Error(
        `Passage "${passage.key}" references missing work "${passage.work}"`,
      );
    }

    const passageRecord = await tx.passage.upsert({
      where: { key: passage.key },
      update: {
        workId,
        location: passage.location,
        text: passage.text,
      },
      create: {
        key: passage.key,
        workId,
        location: passage.location,
        text: passage.text,
      },
    });
    passageIdsByKey.set(passage.key, passageRecord.id);
  }

  return { workCount: content.works.length, passageIdsByKey };
}

async function upsertAnswers(
  tx: Prisma.TransactionClient,
  figureId: string,
  content: SeedFigureContent,
  themeIdsBySlug: ReadonlyMap<string, string>,
  passageIdsByKey: ReadonlyMap<string, string>,
): Promise<{ answerCount: number; answerPassageCount: number }> {
  let answerCount = 0;
  let answerPassageCount = 0;

  for (const answer of content.answers) {
    const themeId = themeIdsBySlug.get(answer.theme);
    if (!themeId) {
      throw new Error(
        `Answer for "${content.figure}" references missing theme "${answer.theme}"`,
      );
    }

    const answerRecord = await tx.answer.upsert({
      where: {
        figureId_themeId: {
          figureId,
          themeId,
        },
      },
      update: {
        topicKeywords: answer.topicKeywords.join(" "),
        body: answer.body,
      },
      create: {
        figureId,
        themeId,
        topicKeywords: answer.topicKeywords.join(" "),
        body: answer.body,
      },
    });
    answerCount += 1;

    const linkedPassageIds: string[] = [];
    for (const [order, link] of answer.passages.entries()) {
      const passageId = passageIdsByKey.get(link.passage);
      if (!passageId) {
        throw new Error(
          `Answer "${content.figure}:${answer.theme}" references missing passage "${link.passage}"`,
        );
      }
      linkedPassageIds.push(passageId);

      await tx.answerPassage.upsert({
        where: {
          answerId_passageId: {
            answerId: answerRecord.id,
            passageId,
          },
        },
        update: {
          explanation: link.explanation,
          order,
        },
        create: {
          answerId: answerRecord.id,
          passageId,
          explanation: link.explanation,
          order,
        },
      });
      answerPassageCount += 1;
    }

    await tx.answerPassage.deleteMany({
      where: {
        answerId: answerRecord.id,
        passageId: { notIn: linkedPassageIds },
      },
    });
  }

  return { answerCount, answerPassageCount };
}

/**
 * Idempotently validate and load curated figures, themes, works, passages, and answers into PostgreSQL.
 */
export async function seedDatabase(
  prisma: PrismaClient,
  contentDir: string = DEFAULT_SEED_CONTENT_DIR,
): Promise<SeedResult> {
  const content = loadSeedContent(contentDir);

  return prisma.$transaction(
    async (tx) => {
      const figureIdsBySlug = await upsertFigures(tx, content.figures);
      const { themeIdsBySlug, figureThemeCount } = await upsertThemesAndLinks(
        tx,
        content.themes,
        figureIdsBySlug,
      );

      let workCount = 0;
      let passageCount = 0;
      let answerCount = 0;
      let answerPassageCount = 0;

      for (const figureContent of content.figureContents) {
        const figureId = figureIdsBySlug.get(figureContent.figure);
        if (!figureId) {
          throw new Error(
            `Seed figure content references missing figure "${figureContent.figure}"`,
          );
        }

        const workResult = await upsertWorksAndPassages(
          tx,
          figureId,
          figureContent,
        );
        workCount += workResult.workCount;
        passageCount += workResult.passageIdsByKey.size;

        const answerResult = await upsertAnswers(
          tx,
          figureId,
          figureContent,
          themeIdsBySlug,
          workResult.passageIdsByKey,
        );
        answerCount += answerResult.answerCount;
        answerPassageCount += answerResult.answerPassageCount;
      }

      return {
        figures: figureIdsBySlug.size,
        themes: themeIdsBySlug.size,
        figureThemes: figureThemeCount,
        works: workCount,
        passages: passageCount,
        answers: answerCount,
        answerPassages: answerPassageCount,
      };
    },
    { maxWait: 10000, timeout: 60000 },
  );
}

function isDirectExecution(): boolean {
  if (typeof process === "undefined" || !process.argv[1]) {
    return false;
  }
  try {
    return (
      fs.realpathSync(path.resolve(process.argv[1])) ===
      fs.realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  const prisma = new PrismaClient();
  seedDatabase(prisma)
    .then((result) => {
      process.stdout.write(
        `Seeded ${result.figures} figures, ${result.themes} themes, ${result.figureThemes} figure-theme links, ${result.works} works, ${result.passages} passages, and ${result.answers} answers.\n`,
      );
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Failed to seed database: ${message}\n`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
