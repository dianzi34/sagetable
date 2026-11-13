import { describe, expect, it, vi } from "vitest";
import {
  chunkTextIntoPassages,
  createAnswerBankEntry,
  createFigure,
  createTheme,
  CuratorError,
  listAnswerBankEntries,
  listFigures,
  listThemes,
  updateAnswerBankEntry,
  updateFigure,
  updateTheme,
  uploadWorkWithPassages,
} from "./curatorService";

describe("curatorService (unit)", () => {
  describe("figure management", () => {
    it("listFigures returns figures ordered by name", async () => {
      const mockPrisma = {
        figure: {
          findMany: vi.fn().mockResolvedValue([
            { id: "fig-1", slug: "mark-twain", name: "Mark Twain" },
          ]),
        },
      };

      const figures = await listFigures(mockPrisma as never);
      expect(figures).toHaveLength(1);
      expect(figures[0]?.name).toBe("Mark Twain");
    });

    it("createFigure validates and creates a new figure", async () => {
      const mockPrisma = {
        figure: {
          create: vi.fn().mockResolvedValue({
            id: "fig-2",
            slug: "hypatia",
            name: "Hypatia",
            field: "Philosophy & Mathematics",
            era: "c. 360 – 415 AD",
            bio: "Hellenistic mathematician and astronomer in Alexandria.",
            avatarKey: "hypatia",
          }),
        },
      };

      const created = await createFigure(
        {
          slug: "hypatia",
          name: "Hypatia",
          field: "Philosophy & Mathematics",
          era: "c. 360 – 415 AD",
          bio: "Hellenistic mathematician and astronomer in Alexandria.",
          avatarKey: "hypatia",
        },
        mockPrisma as never,
      );

      expect(created.slug).toBe("hypatia");
      expect(mockPrisma.figure.create).toHaveBeenCalledWith({
        data: {
          slug: "hypatia",
          name: "Hypatia",
          field: "Philosophy & Mathematics",
          era: "c. 360 – 415 AD",
          bio: "Hellenistic mathematician and astronomer in Alexandria.",
          avatarKey: "hypatia",
        },
      });
    });

    it("updateFigure updates figure attributes", async () => {
      const mockPrisma = {
        figure: {
          update: vi.fn().mockResolvedValue({
            id: "fig-1",
            slug: "mark-twain",
            name: "Mark Twain (Samuel Clemens)",
            field: "Literature & Satire",
            era: "1835-1910",
            bio: "Updated bio.",
            avatarKey: "mark-twain",
          }),
        },
      };

      const updated = await updateFigure(
        "fig-1",
        {
          name: "Mark Twain (Samuel Clemens)",
          field: "Literature & Satire",
          era: "1835-1910",
          bio: "Updated bio.",
          avatarKey: "mark-twain",
        },
        mockPrisma as never,
      );

      expect(updated.name).toBe("Mark Twain (Samuel Clemens)");
      expect(mockPrisma.figure.update).toHaveBeenCalledWith({
        where: { id: "fig-1" },
        data: {
          name: "Mark Twain (Samuel Clemens)",
          field: "Literature & Satire",
          era: "1835-1910",
          bio: "Updated bio.",
          avatarKey: "mark-twain",
        },
      });
    });
  });

  describe("theme management", () => {
    it("listThemes returns themes with figure counts or figures", async () => {
      const mockPrisma = {
        theme: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "theme-1",
              slug: "courage",
              name: "Courage & Fear",
              description: "Facing danger and moral doubt.",
              suggestedQuestions: ["How do I conquer self-doubt?"],
              figures: [{ figureId: "fig-1", order: 0 }],
            },
          ]),
        },
      };

      const themes = await listThemes(mockPrisma as never);
      expect(themes).toHaveLength(1);
      expect(themes[0]?.name).toBe("Courage & Fear");
    });

    it("createTheme creates theme and associated figure assignments", async () => {
      const mockPrisma = {
        theme: {
          create: vi.fn().mockResolvedValue({
            id: "theme-2",
            slug: "resilience",
            name: "Resilience",
            description: "Overcoming hardship.",
            suggestedQuestions: ["How to keep going?"],
          }),
        },
        figureTheme: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        $transaction: vi.fn().mockImplementation(async (cb) => cb(mockPrisma)),
      };

      const created = await createTheme(
        {
          slug: "resilience",
          name: "Resilience",
          description: "Overcoming hardship.",
          suggestedQuestions: ["How to keep going?"],
          figureIds: ["fig-1", "fig-2"],
        },
        mockPrisma as never,
      );

      expect(created.slug).toBe("resilience");
      expect(mockPrisma.theme.create).toHaveBeenCalled();
    });

    it("updateTheme updates theme details and syncs figure links", async () => {
      const mockPrisma = {
        theme: {
          update: vi.fn().mockResolvedValue({
            id: "theme-1",
            name: "Courage & Conviction",
            description: "Updated description.",
            suggestedQuestions: ["Question 1"],
          }),
        },
        figureTheme: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        $transaction: vi.fn().mockImplementation(async (cb) => cb(mockPrisma)),
      };

      const updated = await updateTheme(
        "theme-1",
        {
          name: "Courage & Conviction",
          description: "Updated description.",
          suggestedQuestions: ["Question 1"],
          figureIds: ["fig-1", "fig-2"],
        },
        mockPrisma as never,
      );

      expect(updated.name).toBe("Courage & Conviction");
      expect(mockPrisma.figureTheme.deleteMany).toHaveBeenCalledWith({
        where: { themeId: "theme-1" },
      });
    });
  });

  describe("chunkTextIntoPassages", () => {
    it("chunks text by markdown headers or paragraphs into passages with location", () => {
      const rawText = `## Chapter 1: The Beginning\n\nThis is the first paragraph describing the early days of scientific inquiry.\n\nThis is the second paragraph delving deeper into physics.\n\n## Chapter 2: The Breakthrough\n\nEureka! A new discovery was made in the laboratory under difficult conditions.`;

      const passages = chunkTextIntoPassages(rawText);

      expect(passages.length).toBeGreaterThanOrEqual(2);
      expect(passages[0]?.location).toContain("Chapter 1");
      expect(passages[0]?.text).toContain("early days");
      expect(passages.some((p) => p.location.includes("Chapter 2"))).toBe(true);
    });

    it("handles plain text without headers by numbering paragraphs", () => {
      const rawText = `First substantial passage about perseverance and learning from errors in experiments.\n\nSecond passage discussing collaboration with colleagues in Paris.`;

      const passages = chunkTextIntoPassages(rawText);

      expect(passages).toHaveLength(2);
      expect(passages[0]?.location).toBe("Paragraph 1");
      expect(passages[1]?.location).toBe("Paragraph 2");
    });
  });

  describe("uploadWorkWithPassages", () => {
    it("rejects when publicDomainConfirmed is false", async () => {
      const mockPrisma = {};

      await expect(
        uploadWorkWithPassages(
          {
            figureId: "fig-1",
            title: "Some Book",
            year: 1900,
            sourceUrl: "https://gutenberg.org/ebooks/1",
            publicDomainConfirmed: false,
            textContent: "Sample text content.",
          },
          mockPrisma as never,
        ),
      ).rejects.toThrow(CuratorError);
    });

    it("creates work and chunked passages in transaction when public domain confirmed", async () => {
      const mockPrisma = {
        work: {
          create: vi.fn().mockResolvedValue({
            id: "work-1",
            figureId: "fig-1",
            title: "Life on the Mississippi",
            year: 1883,
            sourceUrl: "https://gutenberg.org/ebooks/245",
            publicDomainConfirmed: true,
          }),
        },
        passage: {
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        $transaction: vi.fn().mockImplementation(async (cb) => cb(mockPrisma)),
      };

      const result = await uploadWorkWithPassages(
        {
          figureId: "fig-1",
          title: "Life on the Mississippi",
          year: 1883,
          sourceUrl: "https://gutenberg.org/ebooks/245",
          publicDomainConfirmed: true,
          textContent: "Paragraph 1 text content.\n\nParagraph 2 text content.",
        },
        mockPrisma as never,
      );

      expect(result.work.title).toBe("Life on the Mississippi");
      expect(result.passageCount).toBe(2);
      expect(mockPrisma.work.create).toHaveBeenCalled();
      expect(mockPrisma.passage.createMany).toHaveBeenCalled();
    });
  });

  describe("answer bank management", () => {
    it("listAnswerBankEntries returns answers with figure, theme, and passages", async () => {
      const mockPrisma = {
        answer: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "ans-1",
              figureId: "fig-1",
              themeId: "theme-1",
              topicKeywords: "courage river fear",
              body: "Courage is resistance to fear, mastery of fear.",
              passages: [
                {
                  explanation: "Facing river piloting difficulties.",
                  order: 0,
                  passage: { location: "Chapter 6", text: "..." },
                },
              ],
            },
          ]),
        },
      };

      const entries = await listAnswerBankEntries({}, mockPrisma as never);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.topicKeywords).toContain("courage");
    });

    it("createAnswerBankEntry creates answer and links passages", async () => {
      const mockPrisma = {
        answer: {
          create: vi.fn().mockResolvedValue({
            id: "ans-2",
            figureId: "fig-1",
            themeId: "theme-1",
            topicKeywords: "perseverance doubt",
            body: "Keep moving despite difficulties.",
          }),
        },
        answerPassage: {
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        $transaction: vi.fn().mockImplementation(async (cb) => cb(mockPrisma)),
      };

      const created = await createAnswerBankEntry(
        {
          figureId: "fig-1",
          themeId: "theme-1",
          topicKeywords: "perseverance doubt",
          body: "Keep moving despite difficulties.",
          passages: [
            {
              passageId: "pass-1",
              explanation: "Twain's reflections on stubborn persistence.",
              order: 0,
            },
          ],
        },
        mockPrisma as never,
      );

      expect(created.id).toBe("ans-2");
      expect(mockPrisma.answer.create).toHaveBeenCalled();
      expect(mockPrisma.answerPassage.createMany).toHaveBeenCalledWith({
        data: [
          {
            answerId: "ans-2",
            passageId: "pass-1",
            explanation: "Twain's reflections on stubborn persistence.",
            order: 0,
          },
        ],
      });
    });

    it("updateAnswerBankEntry updates body/keywords and syncs passage links", async () => {
      const mockPrisma = {
        answer: {
          update: vi.fn().mockResolvedValue({
            id: "ans-1",
            topicKeywords: "updated keywords",
            body: "Updated answer body.",
          }),
        },
        answerPassage: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          createMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        $transaction: vi.fn().mockImplementation(async (cb) => cb(mockPrisma)),
      };

      const updated = await updateAnswerBankEntry(
        "ans-1",
        {
          topicKeywords: "updated keywords",
          body: "Updated answer body.",
          passages: [
            {
              passageId: "pass-2",
              explanation: "New explanation.",
              order: 0,
            },
          ],
        },
        mockPrisma as never,
      );

      expect(updated.topicKeywords).toBe("updated keywords");
      expect(mockPrisma.answerPassage.deleteMany).toHaveBeenCalledWith({
        where: { answerId: "ans-1" },
      });
    });
  });
});
