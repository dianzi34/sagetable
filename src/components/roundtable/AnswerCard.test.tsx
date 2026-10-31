import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnswerCard } from "./AnswerCard";
import { MOCK_FIGURES, MOCK_PASSAGES, MOCK_ANSWERS, MOCK_EXPLANATIONS } from "@/data/mockRoundtable";

describe("AnswerCard", () => {
  const figure = MOCK_FIGURES.twain;
  const passage = MOCK_PASSAGES.twain;
  const answer = MOCK_ANSWERS.twain;
  const explanation = MOCK_EXPLANATIONS.twain;

  it("renders the figure header with name and metadata", () => {
    render(
      <AnswerCard
        figure={figure}
        status="complete"
        answer={answer}
        passage={passage}
        explanation={explanation}
      />
    );

    expect(screen.getByRole("heading", { level: 3, name: figure.name })).toBeInTheDocument();
    expect(screen.getByText(figure.meta)).toBeInTheDocument();
  });

  it("renders the answer text", () => {
    render(
      <AnswerCard
        figure={figure}
        status="complete"
        answer={answer}
        passage={passage}
        explanation={explanation}
      />
    );

    expect(screen.getByText(answer)).toBeInTheDocument();
  });

  it("renders the original passage and source caption in a blockquote", () => {
    render(
      <AnswerCard
        figure={figure}
        status="complete"
        answer={answer}
        passage={passage}
        explanation={explanation}
      />
    );

    const quote = screen.getByText(`“${passage.text}”`);
    expect(quote).toBeInTheDocument();
    expect(screen.getByText(passage.source)).toBeInTheDocument();
  });

  it("renders the plain-English explanation heading and text", () => {
    render(
      <AnswerCard
        figure={figure}
        status="complete"
        answer={answer}
        passage={passage}
        explanation={explanation}
      />
    );

    expect(
      screen.getByRole("heading", { level: 4, name: "In plain English" })
    ).toBeInTheDocument();
    expect(screen.getByText(explanation)).toBeInTheDocument();
  });

  it("renders a notice when no passage matches without inventing quotes", () => {
    render(
      <AnswerCard
        figure={MOCK_FIGURES.curie}
        status="complete"
        answer={MOCK_ANSWERS.curie}
        passage={null}
      />
    );

    expect(
      screen.getByText(/No passage in (her|their|his) uploaded writings closely matches this question/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/SageTable never invents a quote/i)
    ).toBeInTheDocument();
  });

  it("renders streaming state with aria-live region, placeholder, and disabled flag button", () => {
    render(
      <AnswerCard
        figure={figure}
        status="streaming"
        answer="I am typing my response..."
      />
    );

    const liveRegion = screen.getByText(/I am typing my response/);
    expect(liveRegion).toHaveAttribute("aria-live", "polite");

    const flagButton = screen.getByRole("button", {
      name: `Flag ${figure.name}’s answer as inaccurate`,
    });
    expect(flagButton).toBeDisabled();
  });

  it("renders failed state with alert role and retry button", () => {
    const handleRetry = vi.fn();
    render(
      <AnswerCard
        figure={figure}
        status="failed"
        answer=""
        onRetry={handleRetry}
      />
    );

    const alertMessage = screen.getByRole("alert");
    expect(alertMessage).toHaveTextContent(
      `${figure.name}’s answer stopped before it finished. The other answers are not affected.`
    );

    const retryButton = screen.getByRole("button", { name: "Retry this answer" });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onFlag when flag button is clicked", () => {
    const handleFlag = vi.fn();
    render(
      <AnswerCard
        figure={figure}
        status="complete"
        answer={answer}
        passage={passage}
        explanation={explanation}
        onFlag={handleFlag}
      />
    );

    const flagButton = screen.getByRole("button", {
      name: `Flag ${figure.name}’s answer as inaccurate`,
    });
    fireEvent.click(flagButton);
    expect(handleFlag).toHaveBeenCalledTimes(1);
  });

  it("applies per-figure accent color as a CSS variable", () => {
    const { container } = render(
      <AnswerCard
        figure={figure}
        status="complete"
        answer={answer}
        passage={passage}
        explanation={explanation}
      />
    );

    const article = container.querySelector("article");
    expect(article).toHaveStyle({ "--c": figure.accentColor });
  });
});
