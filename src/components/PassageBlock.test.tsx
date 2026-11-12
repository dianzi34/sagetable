import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PassageBlock } from "./PassageBlock";

describe("PassageBlock", () => {
  it("renders the verbatim text in a blockquote with source title, year, and location", () => {
    const passageText =
      "Courage is resistance to fear, mastery of fear—not absence of fear.";

    render(
      <PassageBlock
        text={passageText}
        workTitle="Pudd'nhead Wilson"
        workYear={1894}
        location="Chapter 12"
      />,
    );

    const quote = screen.getByRole("blockquote");
    expect(quote).toHaveTextContent(passageText);
    expect(screen.getByText(passageText)).toBeInTheDocument();
    expect(
      screen.getByText("Pudd'nhead Wilson, 1894, Chapter 12"),
    ).toBeInTheDocument();
  });
});
