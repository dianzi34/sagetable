import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogFigure } from "@/types/catalog";
import { FigurePicker } from "./FigurePicker";

const MOCK_FIGURES: CatalogFigure[] = [
  {
    id: "fig-1",
    slug: "mark-twain",
    name: "Mark Twain",
    field: "Writer",
    era: "1835–1910",
    bio: "American author and humorist.",
    avatarKey: "mark-twain",
  },
  {
    id: "fig-2",
    slug: "marie-curie",
    name: "Marie Curie",
    field: "Physicist & Chemist",
    era: "1867–1934",
    bio: "Pioneering researcher on radioactivity.",
    avatarKey: "marie-curie",
  },
  {
    id: "fig-3",
    slug: "helen-keller",
    name: "Helen Keller",
    field: "Writer & Advocate",
    era: "1880–1968",
    bio: "Author, lecturer, and disability rights advocate.",
    avatarKey: "helen-keller",
  },
];

describe("FigurePicker", () => {
  it("renders all figures with name, field, era, and bio", () => {
    render(
      <FigurePicker
        figures={MOCK_FIGURES}
        selectedIds={["fig-1", "fig-2"]}
        onToggle={() => {}}
      />,
    );

    expect(screen.getByText("Mark Twain")).toBeInTheDocument();
    expect(screen.getByText("Writer · 1835–1910")).toBeInTheDocument();
    expect(screen.getByText("American author and humorist.")).toBeInTheDocument();

    expect(screen.getByText("Marie Curie")).toBeInTheDocument();
    expect(
      screen.getByText("Physicist & Chemist · 1867–1934"),
    ).toBeInTheDocument();

    expect(screen.getByText("Helen Keller")).toBeInTheDocument();
  });

  it("sets aria-pressed correctly on figure toggle buttons", () => {
    render(
      <FigurePicker
        figures={MOCK_FIGURES}
        selectedIds={["fig-1", "fig-2"]}
        onToggle={() => {}}
      />,
    );

    const twainBtn = screen.getByRole("button", { name: /Mark Twain/i });
    const curieBtn = screen.getByRole("button", { name: /Marie Curie/i });
    const kellerBtn = screen.getByRole("button", { name: /Helen Keller/i });

    expect(twainBtn).toHaveAttribute("aria-pressed", "true");
    expect(curieBtn).toHaveAttribute("aria-pressed", "true");
    expect(kellerBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onToggle with the figure ID when a figure is clicked", () => {
    const handleToggle = vi.fn();

    render(
      <FigurePicker
        figures={MOCK_FIGURES}
        selectedIds={["fig-1", "fig-2"]}
        onToggle={handleToggle}
      />,
    );

    const kellerBtn = screen.getByRole("button", { name: /Helen Keller/i });
    fireEvent.click(kellerBtn);

    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith("fig-3");
  });
});
