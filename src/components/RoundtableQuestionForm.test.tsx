import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogFigure } from "@/types/catalog";
import { RoundtableQuestionForm } from "./RoundtableQuestionForm";

const MOCK_FIGURES: CatalogFigure[] = [
  {
    id: "fig-1",
    slug: "mark-twain",
    name: "Mark Twain",
    field: "Writer",
    era: "1835–1910",
    bio: "American author and humorist.",
    avatarKey: "mark-twain",
  },
  {
    id: "fig-2",
    slug: "marie-curie",
    name: "Marie Curie",
    field: "Physicist & Chemist",
    era: "1867–1934",
    bio: "Pioneering researcher on radioactivity.",
    avatarKey: "marie-curie",
  },
  {
    id: "fig-3",
    slug: "helen-keller",
    name: "Helen Keller",
    field: "Writer & Advocate",
    era: "1880–1968",
    bio: "Author and lecturer.",
    avatarKey: "helen-keller",
  },
  {
    id: "fig-4",
    slug: "vincent-van-gogh",
    name: "Vincent van Gogh",
    field: "Painter",
    era: "1853–1890",
    bio: "Dutch painter.",
    avatarKey: "vincent-van-gogh",
  },
];

const MOCK_SUGGESTED_QUESTIONS = [
  "I'm not sure I picked the right major. How do I find work I love?",
  "Should I chase a practical job or follow a calling?",
];

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("RoundtableQuestionForm", () => {
  it("renders suggested question chips and clicking one fills the textarea", () => {
    render(
      <RoundtableQuestionForm
        themeSlug="choosing-a-career"
        suggestedQuestions={MOCK_SUGGESTED_QUESTIONS}
        availableFigures={MOCK_FIGURES}
        initialSelectedFigureIds={["fig-1", "fig-2", "fig-3"]}
      />,
    );

    const textarea = screen.getByRole("textbox", {
      name: /your question/i,
    });
    expect(textarea).toHaveValue("");

    const chip = screen.getByRole("button", {
      name: MOCK_SUGGESTED_QUESTIONS[0],
    });
    fireEvent.click(chip);

    expect(textarea).toHaveValue(MOCK_SUGGESTED_QUESTIONS[0]);
  });

  it("updates character counter as user types", () => {
    render(
      <RoundtableQuestionForm
        themeSlug="choosing-a-career"
        suggestedQuestions={MOCK_SUGGESTED_QUESTIONS}
        availableFigures={MOCK_FIGURES}
        initialSelectedFigureIds={["fig-1", "fig-2", "fig-3"]}
      />,
    );

    const textarea = screen.getByRole("textbox", {
      name: /your question/i,
    });
    fireEvent.change(textarea, { target: { value: "Hello world?" } });

    expect(screen.getByText(/12 \/ 1000/i)).toBeInTheDocument();
  });

  it("disables submit button when question is under 10 characters or figure count is invalid", () => {
    render(
      <RoundtableQuestionForm
        themeSlug="choosing-a-career"
        suggestedQuestions={MOCK_SUGGESTED_QUESTIONS}
        availableFigures={MOCK_FIGURES}
        initialSelectedFigureIds={["fig-1", "fig-2", "fig-3"]}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /start roundtable/i,
    });
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByRole("textbox", {
      name: /your question/i,
    });
    fireEvent.change(textarea, { target: { value: "Short" } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(textarea, {
      target: { value: "Short question for the table" },
    });
    expect(submitBtn).toBeEnabled();

    // Deselect two figures leaving only 1
    const twainBtn = screen.getByRole("button", { name: /Mark Twain/i });
    const curieBtn = screen.getByRole("button", { name: /Marie Curie/i });
    fireEvent.click(twainBtn);
    fireEvent.click(curieBtn);

    // Only 1 figure selected now, submit should be disabled
    expect(submitBtn).toBeDisabled();
  });

  it("navigates to /roundtable with theme, figures, and q params on submit", () => {
    mockPush.mockClear();

    render(
      <RoundtableQuestionForm
        themeSlug="choosing-a-career"
        suggestedQuestions={MOCK_SUGGESTED_QUESTIONS}
        availableFigures={MOCK_FIGURES}
        initialSelectedFigureIds={["fig-1", "fig-2"]}
      />,
    );

    const chip = screen.getByRole("button", {
      name: MOCK_SUGGESTED_QUESTIONS[0],
    });
    fireEvent.click(chip);

    const submitBtn = screen.getByRole("button", {
      name: /start roundtable/i,
    });
    fireEvent.click(submitBtn);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const destination = mockPush.mock.calls[0]![0] as string;
    expect(destination).toContain("/roundtable?");
    expect(destination).toContain("theme=choosing-a-career");
    expect(destination).toContain("figures=fig-1%2Cfig-2");
    expect(destination).toContain("q=");
  });
});
