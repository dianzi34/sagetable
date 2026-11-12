import { describe, expect, it } from "vitest";
import { getFigureAccent } from "./figures";

describe("getFigureAccent", () => {
  it("returns the figure-specific CSS variable for curated figures", () => {
    expect(getFigureAccent("mark-twain")).toBe("var(--accent-twain)");
    expect(getFigureAccent("helen-keller")).toBe("var(--accent-keller)");
    expect(getFigureAccent("marie-curie")).toBe("var(--accent-curie)");
    expect(getFigureAccent("vincent-van-gogh")).toBe("var(--accent-van-gogh)");
    expect(getFigureAccent("leonardo-da-vinci")).toBe("var(--accent-da-vinci)");
  });

  it("falls back to --blue for unknown figure slugs", () => {
    expect(getFigureAccent("unknown-figure")).toBe("var(--blue)");
  });
});
