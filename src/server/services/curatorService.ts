import "server-only";
import type { Answer, Figure, Passage, Prisma, PrismaClient, Theme, Work } from "@prisma/client";
import { prisma as defaultPrisma } from "@/server/db";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export class CuratorError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "CuratorError";
    this.status = status;
    this.code = code;
  }
}

export interface PassageChunk {
  location: string;
  text: string;
}

export interface UploadWorkResult {
  work: Work;
  passageCount: number;
}

export interface AnswerPassageItemInput {
  passageId: string;
  explanation: string;
  order: number;
}

export interface AnswerWithRelations extends Answer {
  figure?: Figure;
  theme?: Theme;
  passages: {
    answerId: string;
    passageId: string;
    explanation: string;
    order: number;
    passage?: Passage;
  }[];
}

/**
 * List all figures ordered alphabetically by name.
 */
export async function listFigures(db: PrismaLike = defaultPrisma): Promise<Figure[]> {
  return db.figure.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Create a new historical figure.
 */
export async function createFigure(
  input: {
    slug: string;
    name: string;
    field: string;
    era: string;
    bio: string;
    avatarKey: string;
  },
  db: PrismaLike = defaultPrisma,
): Promise<Figure> {
  return db.figure.create({
    data: {
      slug: input.slug,
      name: input.name,
      field: input.field,
      era: input.era,
      bio: input.bio,
      avatarKey: input.avatarKey,
    },
  });
}

/**
 * Update an existing figure.
 */
export async function updateFigure(
  id: string,
  input: {
    name?: string;
    field?: string;
    era?: string;
    bio?: string;
    avatarKey?: string;
  },
  db: PrismaLike = defaultPrisma,
): Promise<Figure> {
  return db.figure.update({
    where: { id },
    data: input,
  });
}

/**
 * List themes with their figure mappings.
 */
export async function listThemes(db: PrismaLike = defaultPrisma): Promise<
  (Theme & {
    figures: {
      figureId: string;
      order: number;
      figure?: Figure;
    }[];
  })[]
> {
  return db.theme.findMany({
    orderBy: { name: "asc" },
    include: {
      figures: {
        orderBy: { order: "asc" },
        include: {
          figure: true,
        },
      },
    },
  });
}

/**
 * Create a theme and link its suggested figures.
 */
export async function createTheme(
  input: {
    slug: string;
    name: string;
    description: string;
    suggestedQuestions?: string[];
    figureIds?: string[];
  },
  db: PrismaLike = defaultPrisma,
): Promise<Theme> {
  const execute = async (tx: PrismaLike): Promise<Theme> => {
    const created = await tx.theme.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        suggestedQuestions: input.suggestedQuestions ?? [],
      },
    });

    if (input.figureIds && input.figureIds.length > 0) {
      await tx.figureTheme.createMany({
        data: input.figureIds.map((figureId, index) => ({
          themeId: created.id,
          figureId,
          order: index,
        })),
      });
    }

    return created;
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(execute);
  }

  return execute(db);
}

/**
 * Update a theme and sync its linked figures.
 */
export async function updateTheme(
  id: string,
  input: {
    name?: string;
    description?: string;
    suggestedQuestions?: string[];
    figureIds?: string[];
  },
  db: PrismaLike = defaultPrisma,
): Promise<Theme> {
  const execute = async (tx: PrismaLike): Promise<Theme> => {
    const updated = await tx.theme.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.suggestedQuestions !== undefined
          ? { suggestedQuestions: input.suggestedQuestions }
          : {}),
      },
    });

    if (input.figureIds !== undefined) {
      await tx.figureTheme.deleteMany({
        where: { themeId: id },
      });

      if (input.figureIds.length > 0) {
        await tx.figureTheme.createMany({
          data: input.figureIds.map((figureId, index) => ({
            themeId: id,
            figureId,
            order: index,
          })),
        });
      }
    }

    return updated;
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(execute);
  }

  return execute(db);
}

/**
 * Split text into semantic passages by Markdown headers or paragraph breaks.
 */
export function chunkTextIntoPassages(textContent: string): PassageChunk[] {
  const trimmed = textContent.trim();
  if (!trimmed) {
    return [];
  }

  const lines = trimmed.split("\n");
  const chunks: PassageChunk[] = [];

  let currentLocation: string | null = null;
  let currentParagraphs: string[] = [];
  let fallbackParagraphIndex = 1;

  const flushCurrent = (): void => {
    if (currentParagraphs.length === 0) {
      return;
    }
    const combinedText = currentParagraphs.join("\n\n").trim();
    if (combinedText.length > 0) {
      chunks.push({
        location: currentLocation ?? `Paragraph ${fallbackParagraphIndex++}`,
        text: combinedText,
      });
    }
    currentParagraphs = [];
  };

  const headerRegex = /^#{1,6}\s+(.+)$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headerMatch = headerRegex.exec(line);

    if (headerMatch) {
      flushCurrent();
      currentLocation = headerMatch[1]?.trim() ?? null;
      continue;
    }

    if (line.length === 0) {
      // Empty line marks paragraph break
      if (currentLocation === null) {
        flushCurrent();
      }
      continue;
    }

    currentParagraphs.push(line);
  }

  flushCurrent();

  // If no passages generated (e.g. single block of text), create one
  if (chunks.length === 0 && trimmed.length > 0) {
    chunks.push({
      location: "Paragraph 1",
      text: trimmed,
    });
  }

  return chunks;
}

/**
 * Upload a public-domain work and chunk its content into passages.
 */
export async function uploadWorkWithPassages(
  input: {
    figureId: string;
    title: string;
    year: number;
    sourceUrl: string;
    publicDomainConfirmed: boolean;
    textContent: string;
  },
  db: PrismaLike = defaultPrisma,
): Promise<UploadWorkResult> {
  if (input.publicDomainConfirmed !== true) {
    throw new CuratorError(
      400,
      "VALIDATION_ERROR",
      "Public domain confirmation is required to upload a work.",
    );
  }

  const chunks = chunkTextIntoPassages(input.textContent);
  if (chunks.length === 0) {
    throw new CuratorError(
      400,
      "VALIDATION_ERROR",
      "Text content contains no readable passages.",
    );
  }

  const execute = async (tx: PrismaLike): Promise<UploadWorkResult> => {
    const work = await tx.work.create({
      data: {
        figureId: input.figureId,
        title: input.title,
        year: input.year,
        sourceUrl: input.sourceUrl,
        publicDomainConfirmed: true,
      },
    });

    await tx.passage.createMany({
      data: chunks.map((chunk) => ({
        workId: work.id,
        location: chunk.location,
        text: chunk.text,
      })),
    });

    return {
      work,
      passageCount: chunks.length,
    };
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(execute);
  }

  return execute(db);
}

/**
 * List answer bank entries with optional filtering by figure or theme.
 */
export async function listAnswerBankEntries(
  filter: { figureId?: string; themeId?: string } = {},
  db: PrismaLike = defaultPrisma,
): Promise<AnswerWithRelations[]> {
  const where: Prisma.AnswerWhereInput = {};
  if (filter.figureId) {
    where.figureId = filter.figureId;
  }
  if (filter.themeId) {
    where.themeId = filter.themeId;
  }

  return db.answer.findMany({
    where,
    include: {
      figure: true,
      theme: true,
      passages: {
        orderBy: { order: "asc" },
        include: {
          passage: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
}

/**
 * Create an answer bank entry linked to figure, theme, and verbatim passages.
 */
export async function createAnswerBankEntry(
  input: {
    figureId: string;
    themeId: string;
    topicKeywords: string;
    body: string;
    passages: AnswerPassageItemInput[];
  },
  db: PrismaLike = defaultPrisma,
): Promise<Answer> {
  const execute = async (tx: PrismaLike): Promise<Answer> => {
    const created = await tx.answer.create({
      data: {
        figureId: input.figureId,
        themeId: input.themeId,
        topicKeywords: input.topicKeywords,
        body: input.body,
      },
    });

    if (input.passages && input.passages.length > 0) {
      await tx.answerPassage.createMany({
        data: input.passages.map((p) => ({
          answerId: created.id,
          passageId: p.passageId,
          explanation: p.explanation,
          order: p.order,
        })),
      });
    }

    return created;
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(execute);
  }

  return execute(db);
}

/**
 * Update an answer bank entry and sync its linked passages.
 */
export async function updateAnswerBankEntry(
  id: string,
  input: {
    figureId?: string;
    themeId?: string;
    topicKeywords?: string;
    body?: string;
    passages?: AnswerPassageItemInput[];
  },
  db: PrismaLike = defaultPrisma,
): Promise<Answer> {
  const execute = async (tx: PrismaLike): Promise<Answer> => {
    const updated = await tx.answer.update({
      where: { id },
      data: {
        ...(input.figureId ? { figureId: input.figureId } : {}),
        ...(input.themeId ? { themeId: input.themeId } : {}),
        ...(input.topicKeywords ? { topicKeywords: input.topicKeywords } : {}),
        ...(input.body ? { body: input.body } : {}),
      },
    });

    if (input.passages !== undefined) {
      await tx.answerPassage.deleteMany({
        where: { answerId: id },
      });

      if (input.passages.length > 0) {
        await tx.answerPassage.createMany({
          data: input.passages.map((p) => ({
            answerId: id,
            passageId: p.passageId,
            explanation: p.explanation,
            order: p.order,
          })),
        });
      }
    }

    return updated;
  };

  if ("$transaction" in db && typeof db.$transaction === "function") {
    return db.$transaction(execute);
  }

  return execute(db);
}
