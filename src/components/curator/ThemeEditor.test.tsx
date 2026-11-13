import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeEditor } from "./ThemeEditor";

describe("ThemeEditor", () => {
  const mockThemes = [
    {
      id: "theme-1",
      slug: "courage",
      name: "Courage & Fear",
      description: "Facing hardship.",
      suggestedQuestions: ["How to overcome fear?"],
      figures: [],
    },
  ];

  const mockFigures = [
    { id: "fig-1", name: "Mark Twain" },
    { id: "fig-2", name: "Marie Curie" },
  ];

  it("renders themes and theme creation form", () => {
    render(
      <ThemeEditor
        themes={mockThemes}
        figures={mockFigures}
        onSaveTheme={vi.fn()}
      />,
    );

    expect(screen.getByText("Courage & Fear")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create theme/i })).toBeInTheDocument();
  });

  it("calls onSaveTheme with assigned figures", () => {
    const onSave = vi.fn();
    render(
      <ThemeEditor
        themes={mockThemes}
        figures={mockFigures}
        onSaveTheme={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText(/theme slug/i), { target: { value: "resilience" } });
    fireEvent.change(screen.getByLabelText(/theme name/i), { target: { value: "Resilience" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Steadfast determination" } });

    fireEvent.click(screen.getByRole("button", { name: /create theme/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "resilience",
        name: "Resilience",
      }),
    );
  });
});
