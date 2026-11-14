import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedDatabase } from "../../../prisma/seed";
import { createTestPrismaClient, resetTestDatabase } from "../testDb";
import {
  getThemeBySlug,
  listFigures,
  listThemes,
} from "./catalogService";

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST?.trim());

describe.skipIf(!hasTestDb)("catalogService integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
    await seedDatabase(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("listThemes returns 5 seeded themes with their details", async () => {
    const themes = await listThemes();
    expect(themes).toHaveLength(5);

    const slugs = themes.map((t) => t.slug);
    expect(slugs).toContain("choosing-a-career");
    expect(slugs).toContain("dealing-with-failure");
    expect(slugs).toContain("self-doubt");
    expect(slugs).toContain("learning-and-curiosity");
    expect(slugs).toContain("hardship-and-resilience");

    const career = themes.find((t) => t.slug === "choosing-a-career");
    expect(career?.name).toBe("Choosing a Career");
    expect(career?.description.length).toBeGreaterThan(0);
    expect(career?.suggestedQuestions.length).toBeGreaterThanOrEqual(2);
  });

  it("getThemeBySlug returns theme details, suggested questions, and available figures", async () => {
    const detail = await getThemeBySlug("choosing-a-career");
    expect(detail).not.toBeNull();
    expect(detail?.slug).toBe("choosing-a-career");
    expect(detail?.name).toBe("Choosing a Career");
    expect(detail?.suggestedQuestions).toHaveLength(3);
    expect(detail?.availableFigures).toHaveLength(5);
    expect(detail?.suggestedFigures).toHaveLength(3);
    const suggestedSlugs = detail!.suggestedFigures.map((f) => f.slug);
    expect(suggestedSlugs).toContain("mark-twain");
  });

  it("getThemeBySlug returns null for non-existent theme slug", async () => {
    const result = await getThemeBySlug("non-existent-theme-slug");
    expect(result).toBeNull();
  });

  it("listFigures returns all 5 seeded figures with fields, era, and bio", async () => {
    const figures = await listFigures();
    expect(figures).toHaveLength(5);

    const slugs = figures.map((f) => f.slug);
    expect(slugs).toContain("mark-twain");
    expect(slugs).toContain("helen-keller");
    expect(slugs).toContain("marie-curie");
    expect(slugs).toContain("vincent-van-gogh");
    expect(slugs).toContain("leonardo-da-vinci");

    const twain = figures.find((f) => f.slug === "mark-twain");
    expect(twain?.name).toBe("Mark Twain");
    expect(twain?.field).toBe("Writer");
    expect(twain?.era).toBe("1835–1910");
    expect(twain?.bio.length).toBeGreaterThan(0);
  });
});
