import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PlainExplanation } from "./PlainExplanation";
import { MOCK_EXPLANATIONS } from "@/data/mockRoundtable";

describe("PlainExplanation", () => {
  it("renders the 'In plain English' heading and text", () => {
    render(<PlainExplanation explanation={MOCK_EXPLANATIONS.twain} />);

    expect(
      screen.getByRole("heading", { level: 4, name: "In plain English" })
    ).toBeInTheDocument();
    expect(screen.getByText(MOCK_EXPLANATIONS.twain)).toBeInTheDocument();
  });
});
