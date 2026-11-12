import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AnswerCardData } from "@/types/roundtable";
import { AnswerCard } from "./AnswerCard";

const MATCHED_CARD: AnswerCardData = {
  figure: {
    slug: "mark-twain",
    name: "Mark Twain",
    field: "Writer and humorist",
    era: "1835–1910",
  },
  answer: {
    body: "Before I ever wrote a book, I set type, piloted riverboats, and chased silver mines. You learn what fits you by trying real work with your hands.",
    passages: [
      {
        text: "The two most important days in your life are the day you are born and the day you find out why.",
        workTitle: "Mark Twain's Notebook",
        workYear: 1898,
        location: "Journal Entry",
        explanation:
          "Finding purpose is a turning point you discover through action, not worry.",
      },
      {
        text: "Find out what you like doing best, and get someone to pay you for doing it.",
        workTitle: "A Connecticut Yankee in King Arthur's Court",
        workYear: 1889,
        location: "Chapter 10",
        explanation:
          "Notice the work you lose track of time doing, and build around that.",
      },
    ],
  },
};

const NO_MATCH_CARD: AnswerCardData = {
  figure: {
    slug: "helen-keller",
    name: "Helen Keller",
    field: "Author and activist",
    era: "1880–1968",
  },
  answer: null,
};

describe("AnswerCard", () => {
  it("renders figure name, answer body, every passage and explanation, and the curated-interpretation label", () => {
    render(<AnswerCard data={MATCHED_CARD} />);

    expect(
      screen.getByRole("heading", { name: "Mark Twain" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Mark Twain/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(MATCHED_CARD.answer!.body)).toBeInTheDocument();

    const blockquotes = screen.getAllByRole("blockquote");
    expect(blockquotes).toHaveLength(2);

    for (const passage of MATCHED_CARD.answer!.passages) {
      expect(screen.getByText(passage.text)).toBeInTheDocument();
      expect(
        screen.getByText(
          `${passage.workTitle}, ${passage.workYear}, ${passage.location}`,
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(passage.explanation)).toBeInTheDocument();
    }

    expect(
      screen.getByText("Curated interpretation in Mark Twain's voice"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /flag/i })).toBeInTheDocument();
  });

  it("renders '<Name> hasn't written about this yet.' and no blockquote when answer is null", () => {
    render(<AnswerCard data={NO_MATCH_CARD} />);

    expect(
      screen.getByRole("heading", { name: "Helen Keller" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Helen Keller hasn't written about this yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("blockquote")).not.toBeInTheDocument();
  });
});
