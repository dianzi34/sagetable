import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FigureEditor } from "./FigureEditor";

describe("FigureEditor", () => {
  const mockFigures = [
    {
      id: "fig-1",
      slug: "mark-twain",
      name: "Mark Twain",
      field: "Literature",
      era: "1835-1910",
      bio: "American writer.",
      avatarKey: "mark-twain",
    },
  ];

  it("renders existing figures list and create form", () => {
    render(<FigureEditor figures={mockFigures} onSaveFigure={vi.fn()} />);

    expect(screen.getByText("Mark Twain")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create figure/i })).toBeInTheDocument();
  });

  it("calls onSaveFigure when submitting new figure form", () => {
    const onSave = vi.fn();
    render(<FigureEditor figures={mockFigures} onSaveFigure={onSave} />);

    fireEvent.change(screen.getByLabelText(/slug/i), { target: { value: "hypatia" } });
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Hypatia" } });
    fireEvent.change(screen.getByLabelText(/field/i), { target: { value: "Mathematics" } });
    fireEvent.change(screen.getByLabelText(/era/i), { target: { value: "360-415" } });
    fireEvent.change(screen.getByLabelText(/biography/i), { target: { value: "Alexandrian mathematician." } });
    fireEvent.change(screen.getByLabelText(/avatar key/i), { target: { value: "hypatia" } });

    fireEvent.click(screen.getByRole("button", { name: /create figure/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "hypatia",
        name: "Hypatia",
      }),
    );
  });
});
