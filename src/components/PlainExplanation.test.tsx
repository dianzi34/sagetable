import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlainExplanation } from "./PlainExplanation";

describe("PlainExplanation", () => {
  it("renders the explanation under the In plain English heading", () => {
    const explanation =
      "Being brave does not mean you stop feeling scared. It means you act while you are still scared.";

    render(<PlainExplanation explanation={explanation} />);

    expect(
      screen.getByRole("heading", { name: "In plain English" }),
    ).toBeInTheDocument();
    const explanationEl = screen.getByText(explanation);
    expect(explanationEl).toBeInTheDocument();
    expect(explanationEl).toHaveClass("text-ink");
    expect(explanationEl).not.toHaveClass("text-muted");
  });
});
