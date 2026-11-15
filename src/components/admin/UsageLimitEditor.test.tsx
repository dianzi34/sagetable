import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UsageLimitEditor } from "./UsageLimitEditor";

describe("UsageLimitEditor", () => {
  const mockLimits = [
    { role: "USER" as const, dailyRoundtables: 5 },
    { role: "CURATOR" as const, dailyRoundtables: 20 },
    { role: "ADMIN" as const, dailyRoundtables: 100 },
  ];

  it("renders daily limits for each role", () => {
    render(<UsageLimitEditor limits={mockLimits} onSaveLimit={vi.fn()} />);

    expect(screen.getByText("USER")).toBeInTheDocument();
    expect(screen.getByText("CURATOR")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });

  it("calls onSaveLimit when submitting an updated limit", () => {
    const onSaveLimit = vi.fn();
    render(<UsageLimitEditor limits={mockLimits} onSaveLimit={onSaveLimit} />);

    const userLimitInput = screen.getByDisplayValue("5");
    fireEvent.change(userLimitInput, { target: { value: "10" } });

    const saveButtons = screen.getAllByRole("button", { name: /save/i });
    fireEvent.click(saveButtons[0]!);

    expect(onSaveLimit).toHaveBeenCalledWith("USER", 10);
  });
});
