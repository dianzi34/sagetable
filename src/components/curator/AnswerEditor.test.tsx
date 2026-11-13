import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnswerEditor } from "./AnswerEditor";

describe("AnswerEditor", () => {
  const mockFigures = [{ id: "fig-1", name: "Mark Twain" }];
  const mockThemes = [{ id: "theme-1", name: "Courage" }];
  const mockAnswers = [
    {
      id: "ans-1",
      figureId: "fig-1",
      themeId: "theme-1",
      topicKeywords: "courage river fear",
      body: "Courage is resistance to fear.",
      passages: [],
    },
  ];

  it("renders answers list and create answer form", () => {
    render(
      <AnswerEditor
        answers={mockAnswers}
        figures={mockFigures}
        themes={mockThemes}
        onSaveAnswer={vi.fn()}
      />,
    );

    expect(screen.getByText("Courage is resistance to fear.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create answer/i })).toBeInTheDocument();
  });

  it("calls onSaveAnswer when creating new answer entry", () => {
    const onSave = vi.fn();
    render(
      <AnswerEditor
        answers={mockAnswers}
        figures={mockFigures}
        themes={mockThemes}
        onSaveAnswer={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText(/select figure/i), { target: { value: "fig-1" } });
    fireEvent.change(screen.getByLabelText(/select theme/i), { target: { value: "theme-1" } });
    fireEvent.change(screen.getByLabelText(/topic keywords/i), { target: { value: "perseverance courage" } });
    fireEvent.change(screen.getByLabelText(/answer body/i), { target: { value: "Keep pushing forward." } });

    fireEvent.click(screen.getByRole("button", { name: /create answer/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        topicKeywords: "perseverance courage",
        body: "Keep pushing forward.",
      }),
    );
  });
});
