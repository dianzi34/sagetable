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
    expect(screen.queryByText("In plain English")).not.toBeInTheDocument();
  });

  it("renders the explanation inside the same box under the source line with the 'In plain English' label and ink text", () => {
    const passageText =
      "Courage is resistance to fear, mastery of fear—not absence of fear.";
    const explanation =
      "Being brave does not mean you stop feeling scared. It means you act while you are still scared.";

    const { container } = render(
      <PassageBlock
        text={passageText}
        workTitle="Pudd'nhead Wilson"
        workYear={1894}
        location="Chapter 12"
        explanation={explanation}
      />,
    );

    const box = container.firstElementChild as HTMLElement;
    const quote = screen.getByRole("blockquote");
    const source = screen.getByText("Pudd'nhead Wilson, 1894, Chapter 12");
    const label = screen.getByText("In plain English");
    const explanationEl = screen.getByText(explanation);

    expect(box).toContainElement(quote);
    expect(box).toContainElement(source);
    expect(box).toContainElement(label);
    expect(box).toContainElement(explanationEl);
    expect(
      source.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      label.compareDocumentPosition(explanationEl) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(explanationEl).toHaveClass("text-ink");
    expect(explanationEl).not.toHaveClass("text-muted");
  });
});
