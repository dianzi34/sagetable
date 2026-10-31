import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PassageBlock } from "./PassageBlock";
import { MOCK_PASSAGES } from "@/data/mockRoundtable";

describe("PassageBlock", () => {
  const passage = MOCK_PASSAGES.twain;

  it("renders blockquote with verbatim passage text", () => {
    render(<PassageBlock passage={passage} accentColor="#2f6f5e" />);

    const quote = screen.getByText(`“${passage.text}”`);
    expect(quote).toBeInTheDocument();
    expect(quote.tagName.toLowerCase()).toBe("blockquote");
  });

  it("renders figcaption with source metadata", () => {
    render(<PassageBlock passage={passage} accentColor="#2f6f5e" />);

    const caption = screen.getByText(passage.source);
    expect(caption).toBeInTheDocument();
    expect(caption.tagName.toLowerCase()).toBe("figcaption");
  });

  it("sets left border color using accentColor", () => {
    const { container } = render(
      <PassageBlock passage={passage} accentColor="#2f6f5e" />
    );

    const figure = container.querySelector("figure");
    expect(figure).toHaveStyle({ borderLeftColor: "#2f6f5e" });
  });
});
