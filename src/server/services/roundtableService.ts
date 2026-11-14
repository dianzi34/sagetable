import "server-only";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { matchAnswers, type FigureAnswerMatch } from "@/server/matching";
import { AuthError } from "@/server/auth/session";

export interface CreateRoundtableInput {
  userId: string;
  themeSlug?: string | null;
  figureIds: string[];
  question: string;
}

export interface RoundtableWithDetails {
  id: string;
  userId: string;
  question: string;
  themeId: string | null;
  createdAt: Date;
  theme: {
    id: string;
    slug: string;
    name: string;
  } | null;
  answers: Array<{
    id: string;
    figureId: string;
    status: string;
    figure: {
      id: string;
      slug: string;
      name: string;
      field: string;
      era: string;
      bio: string;
    };
    answer: {
      id: string;
      body: string;
    } | null;
  }>;
}

/**
 * Create a new roundtable for the user with pending figure answers.
 */
export async function createRoundtable(
  input: CreateRoundtableInput,
  db: PrismaClient = prisma,
): Promise<RoundtableWithDetails> {
  const normalizedQuestion = input.question.trim();

  // Resolve theme if slug provided
  let themeId: string | null = null;
  if (input.themeSlug) {
    const theme = await db.theme.findUnique({
      where: { slug: input.themeSlug },
      select: { id: true },
    });
    if (theme) {
      themeId = theme.id;
    }
  }

  // Resolve figure IDs whether provided as slugs or IDs
  const figures = await db.figure.findMany({
    where: {
      OR: [
        { id: { in: input.figureIds } },
        { slug: { in: input.figureIds } },
      ],
    },
    select: { id: true, slug: true },
  });

  const resolvedFigureIds = input.figureIds.map((identifier) => {
    const found = figures.find(
      (f) => f.id === identifier || f.slug === identifier,
    );
    return found ? found.id : identifier;
  });

  const created = await db.roundtable.create({
    data: {
      userId: input.userId,
      question: normalizedQuestion,
      themeId,
      answers: {
        create: resolvedFigureIds.map((figureId) => ({
          figureId,
          status: "pending",
        })),
      },
    },
    include: {
      theme: {
        select: { id: true, slug: true, name: true },
      },
      answers: {
        include: {
          figure: true,
          answer: {
            select: { id: true, body: true },
          },
        },
      },
    },
  });

  return created;
}

/**
 * Fetch a user's roundtable asserting resource ownership (throws 404 on missing or mismatch).
 */
export async function getRoundtableForUser(
  roundtableId: string,
  userId: string,
  db: PrismaClient = prisma,
): Promise<RoundtableWithDetails> {
  const roundtable = await db.roundtable.findUnique({
    where: { id: roundtableId },
    include: {
      theme: {
        select: { id: true, slug: true, name: true },
      },
      answers: {
        include: {
          figure: true,
          answer: {
            select: { id: true, body: true },
          },
        },
      },
    },
  });

  if (!roundtable || roundtable.userId !== userId) {
    throw new AuthError(404, "NOT_FOUND", "Roundtable not found");
  }

  return roundtable;
}

/**
 * List all roundtables belonging to the signed-in user ordered by most recent first.
 */
export async function listUserRoundtables(
  userId: string,
  db: PrismaClient = prisma,
): Promise<RoundtableWithDetails[]> {
  return db.roundtable.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      theme: {
        select: { id: true, slug: true, name: true },
      },
      answers: {
        include: {
          figure: true,
          answer: {
            select: { id: true, body: true },
          },
        },
      },
    },
  });
}

/**
 * Match answers for each figure in a roundtable using PostgreSQL full-text search.
 */
export async function matchRoundtableAnswers(
  roundtableId: string,
  userId: string,
  db: PrismaClient = prisma,
): Promise<FigureAnswerMatch[]> {
  const roundtable = await getRoundtableForUser(roundtableId, userId, db);
  const figureIds = roundtable.answers.map((a) => a.figureId);

  return matchAnswers(
    {
      question: roundtable.question,
      figureIds,
      themeId: roundtable.themeId,
    },
    db,
  );
}
