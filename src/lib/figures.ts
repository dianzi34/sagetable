const FIGURE_ACCENTS: Record<string, string> = {
  "mark-twain": "var(--accent-twain)",
  "helen-keller": "var(--accent-keller)",
  "marie-curie": "var(--accent-curie)",
  "vincent-van-gogh": "var(--accent-van-gogh)",
  "leonardo-da-vinci": "var(--accent-da-vinci)",
};

/**
 * Returns the CSS custom property for a figure's accent color, falling back to action blue.
 */
export function getFigureAccent(slug: string): string {
  return FIGURE_ACCENTS[slug] ?? "var(--blue)";
}
