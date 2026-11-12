import { fireEvent, render, screen } from "@testing-library/react";
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

const THREE_PASSAGES_CARD: AnswerCardData = {
  figure: MATCHED_CARD.figure,
  answer: {
    body: MATCHED_CARD.answer!.body,
    passages: [
      ...MATCHED_CARD.answer!.passages,
      {
        text: "Keep away from people who try to belittle your ambitions.",
        workTitle: "Collected Maxims",
        workYear: 1900,
        location: "Note 3",
        explanation: "Surround yourself with people who encourage real growth.",
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
  it("shows only the first passage by default and reveals the second when 'Show 1 more passage' is clicked", () => {
    render(<AnswerCard data={MATCHED_CARD} />);

    expect(
      screen.getByRole("heading", { name: "Mark Twain" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Mark Twain/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(MATCHED_CARD.answer!.body)).toBeInTheDocument();

    const [firstPassage, secondPassage] = MATCHED_CARD.answer!.passages;

    expect(screen.getAllByRole("blockquote")).toHaveLength(1);
    expect(screen.getByText(firstPassage.text)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${firstPassage.workTitle}, ${firstPassage.workYear}, ${firstPassage.location}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(firstPassage.explanation)).toBeInTheDocument();

    expect(screen.queryByText(secondPassage.text)).not.toBeInTheDocument();
    expect(
      screen.queryByText(secondPassage.explanation),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("Curated interpretation in Mark Twain's voice"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /flag/i })).toBeInTheDocument();

    const showMoreButton = screen.getByRole("button", {
      name: "Show 1 more passage",
    });
    fireEvent.click(showMoreButton);

    expect(screen.getAllByRole("blockquote")).toHaveLength(2);
    expect(screen.getByText(secondPassage.text)).toBeInTheDocument();
    expect(
      screen.getByText(
        `${secondPassage.workTitle}, ${secondPassage.workYear}, ${secondPassage.location}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(secondPassage.explanation)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show 1 more passage" }),
    ).not.toBeInTheDocument();
  });

  it("labels multiple collapsed passages as 'Show N more passages'", () => {
    render(<AnswerCard data={THREE_PASSAGES_CARD} />);

    expect(screen.getAllByRole("blockquote")).toHaveLength(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Show 2 more passages" }),
    );

    expect(screen.getAllByRole("blockquote")).toHaveLength(3);
  });

  it("renders only the no-match notice when answer is null, with no curated-interpretation label and no Flag button", () => {
    render(<AnswerCard data={NO_MATCH_CARD} />);

    expect(
      screen.getByRole("heading", { name: "Helen Keller" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Helen Keller hasn't written about this yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("blockquote")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Curated interpretation/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /flag/i }),
    ).not.toBeInTheDocument();
  });
});
