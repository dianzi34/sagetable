import { describe, expect, it } from "vitest";
import { roundtableInputSchema } from "./roundtableInput";

describe("roundtableInputSchema", () => {
  const validInput = {
    themeSlug: "choosing-a-career",
    figureIds: ["fig-twain", "fig-curie"],
    question: "I am deciding whether to change my career path.",
  };

  it("accepts valid input with 2 figures", () => {
    const result = roundtableInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.themeSlug).toBe("choosing-a-career");
      expect(result.data.figureIds).toEqual(["fig-twain", "fig-curie"]);
      expect(result.data.question).toBe(
        "I am deciding whether to change my career path.",
      );
    }
  });

  it("accepts valid input with 3 figures", () => {
    const result = roundtableInputSchema.safeParse({
      ...validInput,
      figureIds: ["fig-twain", "fig-curie", "fig-gogh"],
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from question and themeSlug", () => {
    const result = roundtableInputSchema.safeParse({
      themeSlug: "  choosing-a-career  ",
      figureIds: ["fig-twain", "fig-curie"],
      question: "   How do I stay resilient when facing challenges?   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.themeSlug).toBe("choosing-a-career");
      expect(result.data.question).toBe(
        "How do I stay resilient when facing challenges?",
      );
    }
  });

  it("rejects fewer than 2 figures", () => {
    const result = roundtableInputSchema.safeParse({
      ...validInput,
      figureIds: ["fig-twain"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 figures", () => {
    const result = roundtableInputSchema.safeParse({
      ...validInput,
      figureIds: ["fig-1", "fig-2", "fig-3", "fig-4"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate figure IDs", () => {
    const result = roundtableInputSchema.safeParse({
      ...validInput,
      figureIds: ["fig-twain", "fig-twain"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty or whitespace themeSlug", () => {
    const result = roundtableInputSchema.safeParse({
      ...validInput,
      themeSlug: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects questions shorter than 10 characters after trimming", () => {
    const result = roundtableInputSchema.safeParse({
      ...validInput,
      question: "   Too short   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects questions longer than 1000 characters", () => {
    const result = roundtableInputSchema.safeParse({
      ...validInput,
      question: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
