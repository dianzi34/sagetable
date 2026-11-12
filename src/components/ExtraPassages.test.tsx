import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnswerPassageItem } from "@/types/roundtable";
import { ExtraPassages } from "./ExtraPassages";

const SAMPLE_PASSAGES: AnswerPassageItem[] = [
  {
    text: "Find out what you like doing best, and get someone to pay you for doing it.",
    workTitle: "A Connecticut Yankee in King Arthur's Court",
    workYear: 1889,
    location: "Chapter 10",
    explanation:
      "Notice the work you lose track of time doing, and build around that.",
  },
  {
    text: "Keep away from people who try to belittle your ambitions.",
    workTitle: "Collected Maxims",
    workYear: 1900,
    location: "Note 3",
    explanation: "Surround yourself with people who encourage real growth.",
  },
];

describe("ExtraPassages", () => {
  it("renders nothing when there are no extra passages", () => {
    const { container } = render(<ExtraPassages passages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reveals one hidden passage when 'Show 1 more passage' is clicked", () => {
    render(<ExtraPassages passages={[SAMPLE_PASSAGES[0]]} />);

    expect(screen.queryByRole("blockquote")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show 1 more passage" }),
    );

    expect(screen.getByRole("blockquote")).toHaveTextContent(
      SAMPLE_PASSAGES[0].text,
    );
    expect(screen.getByText(SAMPLE_PASSAGES[0].explanation)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show 1 more passage" }),
    ).not.toBeInTheDocument();
  });

  it("reveals multiple hidden passages when 'Show N more passages' is clicked", () => {
    render(<ExtraPassages passages={SAMPLE_PASSAGES} />);

    expect(screen.queryByRole("blockquote")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Show 2 more passages" }),
    );

    expect(screen.getAllByRole("blockquote")).toHaveLength(2);
    expect(screen.getByText(SAMPLE_PASSAGES[1].text)).toBeInTheDocument();
  });
});
