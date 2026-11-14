import "server-only";
import { prisma } from "@/server/db";
import type {
  CatalogFigure,
  CatalogThemeDetail,
  CatalogThemeSummary,
} from "@/types/catalog";

/**
 * List all themes available for roundtable selection.
 */
export async function listThemes(): Promise<CatalogThemeSummary[]> {
  const themes = await prisma.theme.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      suggestedQuestions: true,
    },
  });

  return themes;
}

/**
 * Get full theme details by slug, including suggested questions, suggested figures, and all available figures.
 */
export async function getThemeBySlug(
  slug: string,
): Promise<CatalogThemeDetail | null> {
  const theme = await prisma.theme.findUnique({
    where: { slug },
    include: {
      figures: {
        orderBy: { order: "asc" },
        include: {
          figure: true,
        },
      },
    },
  });

  if (!theme) {
    return null;
  }

  const allFigures = await prisma.figure.findMany({
    orderBy: { name: "asc" },
  });

  const suggestedFigures: CatalogFigure[] = theme.figures.map((tf) => ({
    id: tf.figure.id,
    slug: tf.figure.slug,
    name: tf.figure.name,
    field: tf.figure.field,
    era: tf.figure.era,
    bio: tf.figure.bio,
    avatarKey: tf.figure.avatarKey,
  }));

  const availableFigures: CatalogFigure[] = allFigures.map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    field: f.field,
    era: f.era,
    bio: f.bio,
    avatarKey: f.avatarKey,
  }));

  const themeSummary: CatalogThemeSummary = {
    id: theme.id,
    slug: theme.slug,
    name: theme.name,
    description: theme.description,
    suggestedQuestions: theme.suggestedQuestions,
  };

  return {
    ...themeSummary,
    suggestedFigures,
    availableFigures,
    figures: availableFigures,
    theme: themeSummary,
  };
}

/**
 * List all historical figures in the catalog.
 */
export async function listFigures(): Promise<CatalogFigure[]> {
  const figures = await prisma.figure.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      field: true,
      era: true,
      bio: true,
      avatarKey: true,
    },
  });

  return figures;
}
