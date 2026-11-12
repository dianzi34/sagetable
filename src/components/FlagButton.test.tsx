import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FlagButton } from "./FlagButton";

describe("FlagButton", () => {
  it("calls onFlag once, then shows 'Flagged, thanks' and is disabled", () => {
    const onFlag = vi.fn();
    render(<FlagButton figureName="Mark Twain" onFlag={onFlag} />);

    const button = screen.getByRole("button", { name: /flag/i });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(onFlag).toHaveBeenCalledTimes(1);
    const flaggedButton = screen.getByRole("button", {
      name: /Flagged, thanks/i,
    });
    expect(flaggedButton).toHaveTextContent("Flagged, thanks");
    expect(flaggedButton).toBeDisabled();

    fireEvent.click(flaggedButton);
    expect(onFlag).toHaveBeenCalledTimes(1);
  });
});
