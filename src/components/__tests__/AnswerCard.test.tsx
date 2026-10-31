import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnswerCard } from '../AnswerCard';
import { MOCK_ROUNDTABLE_ANSWERS } from '@/data/mockAnswers';
import { RoundtableAnswer } from '@/types/roundtable';

describe('AnswerCard Component', () => {
  const mockAnswer: RoundtableAnswer = MOCK_ROUNDTABLE_ANSWERS[0]; // Marcus Aurelius

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders historical figure details correctly', () => {
    render(<AnswerCard answer={mockAnswer} />);

    // Name
    expect(
      screen.getByRole('heading', { level: 3, name: 'Marcus Aurelius' })
    ).toBeInTheDocument();

    // Title and Era
    expect(screen.getByText('Roman Emperor & Stoic Philosopher')).toBeInTheDocument();
    expect(screen.getByText('121 – 180 CE')).toBeInTheDocument();

    // Tradition badge
    expect(screen.getByTestId('tradition-badge')).toHaveTextContent('Stoicism');

    // Initials fallback
    expect(screen.getByText('MA')).toBeInTheDocument();
  });

  it('renders avatar image if avatarUrl is provided', () => {
    const answerWithAvatar: RoundtableAnswer = {
      ...mockAnswer,
      figure: {
        ...mockAnswer.figure,
        avatarUrl: 'https://example.com/marcus.jpg',
      },
    };

    render(<AnswerCard answer={answerWithAvatar} />);
    const img = screen.getByRole('img', { name: 'Marcus Aurelius portrait' });
    expect(img).toHaveAttribute('src', 'https://example.com/marcus.jpg');
  });

  it("renders the figure's direct answer to the user's question", () => {
    render(<AnswerCard answer={mockAnswer} />);

    expect(screen.getByTestId('direct-answer-text')).toHaveTextContent(
      mockAnswer.directAnswer
    );
  });

  it('renders the question context being addressed', () => {
    render(
      <AnswerCard
        answer={mockAnswer}
        userQuestion="How do I overcome stress at work?"
      />
    );

    const questionContext = screen.getByTestId('question-context');
    expect(questionContext).toHaveTextContent('How do I overcome stress at work?');
  });

  it('renders the original historical passage verbatim with citation and source', () => {
    render(<AnswerCard answer={mockAnswer} />);

    // Passage text in blockquote
    const quoteEl = screen.getByTestId('original-passage-text');
    expect(quoteEl).toHaveTextContent(
      'Men seek retreats for themselves, houses in the country, sea-shores, and mountains'
    );

    // Source citation
    const sourceEl = screen.getByTestId('passage-source');
    expect(sourceEl).toHaveTextContent('Meditations');
    expect(sourceEl).toHaveTextContent('Book IV, Section 3');
    expect(sourceEl).toHaveTextContent('c. 170–180 CE');
    expect(sourceEl).toHaveTextContent('Translated by George Long (1862)');

    // Public domain badge
    expect(screen.getByTestId('public-domain-badge')).toHaveTextContent('Public Domain');

    // Historical context note
    expect(screen.getByTestId('passage-context')).toHaveTextContent(
      'Written in military campaign tents along the Danube River'
    );
  });

  it('renders the plain-English explanation, breakdown, and actionable takeaway', () => {
    render(<AnswerCard answer={mockAnswer} defaultExpanded={true} />);

    // Plain English summary
    expect(screen.getByTestId('explanation-summary')).toHaveTextContent(
      'You don’t need an escape, a luxury retreat, or a vacation to find peace.'
    );

    // Breakdown points
    const details = screen.getByTestId('explanation-details');
    expect(details).toHaveTextContent(
      'People often fantasize about moving to the mountains or the beach to escape anxiety'
    );
    expect(details).toHaveTextContent(
      'Your mind has a private "inner sanctuary" that is always open to you'
    );

    // Actionable takeaway
    expect(screen.getByTestId('actionable-takeaway')).toHaveTextContent(
      'Whenever future worries strike, pause and ask: "Is this situation hurting me'
    );
  });

  it('allows collapsing and expanding the plain-English breakdown details', () => {
    render(<AnswerCard answer={mockAnswer} defaultExpanded={true} />);

    const toggleButton = screen.getByTestId('toggle-explanation-details');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('explanation-details')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('explanation-details')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('explanation-details')).toBeInTheDocument();
  });

  it('copies passage and citation to clipboard when Copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<AnswerCard answer={mockAnswer} />);
    const copyButton = screen.getByTestId('copy-quote-button');

    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining(mockAnswer.passage.text)
    );
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining(mockAnswer.passage.source.work)
    );

    // Visual feedback
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('toggles bookmark state and notifies onBookmarkToggle callback', () => {
    const handleBookmark = vi.fn();
    render(
      <AnswerCard
        answer={mockAnswer}
        isBookmarked={false}
        onBookmarkToggle={handleBookmark}
      />
    );

    const bookmarkBtn = screen.getByTestId('bookmark-button');
    expect(bookmarkBtn).toHaveAttribute('aria-pressed', 'false');

    // Toggle on
    fireEvent.click(bookmarkBtn);
    expect(bookmarkBtn).toHaveAttribute('aria-pressed', 'true');
    expect(handleBookmark).toHaveBeenCalledWith(mockAnswer.id);

    // Toggle off
    fireEvent.click(bookmarkBtn);
    expect(bookmarkBtn).toHaveAttribute('aria-pressed', 'false');
    expect(handleBookmark).toHaveBeenCalledTimes(2);
  });

  it('increments and decrements insightful reaction count when clicked', () => {
    render(<AnswerCard answer={mockAnswer} />);

    const likeBtn = screen.getByTestId('helpful-button');
    expect(likeBtn).toHaveAttribute('aria-pressed', 'false');

    // Click to like
    fireEvent.click(likeBtn);
    expect(likeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(likeBtn).toHaveTextContent('1');

    // Click again to unlike
    fireEvent.click(likeBtn);
    expect(likeBtn).toHaveAttribute('aria-pressed', 'false');
    expect(likeBtn).not.toHaveTextContent('1');
  });

  it('renders topic tags', () => {
    render(<AnswerCard answer={mockAnswer} />);

    const tagsContainer = screen.getByTestId('answer-tags');
    expect(tagsContainer).toHaveTextContent('#Stoicism');
    expect(tagsContainer).toHaveTextContent('#Inner Peace');
  });

  it('handles cards with missing optional source fields gracefully', () => {
    const minimalAnswer: RoundtableAnswer = {
      ...mockAnswer,
      passage: {
        text: 'Know thyself.',
        source: {
          work: 'Delphic Maxims',
        },
      },
      explanation: {
        summary: 'Understand your own nature before evaluating everything else.',
        breakdown: [],
      },
    };

    render(<AnswerCard answer={minimalAnswer} />);

    expect(screen.getByText('“Know thyself.”')).toBeInTheDocument();
    expect(screen.getByText('Delphic Maxims')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Understand your own nature before evaluating everything else.'
      )
    ).toBeInTheDocument();
    // Breakdown button shouldn't exist if breakdown array is empty
    expect(
      screen.queryByTestId('toggle-explanation-details')
    ).not.toBeInTheDocument();
  });
});
