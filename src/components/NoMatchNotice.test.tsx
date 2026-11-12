import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoMatchNotice } from "./NoMatchNotice";

describe("NoMatchNotice", () => {
  it("renders the figure no-match notice without a blockquote", () => {
    render(<NoMatchNotice figureName="Helen Keller" />);

    expect(
      screen.getByText("Helen Keller hasn't written about this yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("blockquote")).not.toBeInTheDocument();
  });
});
