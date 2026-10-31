import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoundtablePage } from '../RoundtablePage';

describe('RoundtablePage Component', () => {
  it('renders the roundtable header, active question, and stats', () => {
    render(<RoundtablePage />);

    expect(screen.getByRole('heading', { level: 1, name: 'SageTable' })).toBeInTheDocument();
    expect(screen.getByTestId('active-question-display')).toBeInTheDocument();
    expect(screen.getByTestId('roundtable-participants-stat')).toHaveTextContent(
      '4 Thinkers at the Table'
    );
  });

  it('renders answer cards for all historical figures by default', () => {
    render(<RoundtablePage />);

    expect(screen.getByTestId('answer-card-marcus-aurelius')).toBeInTheDocument();
    expect(screen.getByTestId('answer-card-confucius')).toBeInTheDocument();
    expect(screen.getByTestId('answer-card-ada-lovelace')).toBeInTheDocument();
    expect(screen.getByTestId('answer-card-virginia-woolf')).toBeInTheDocument();
  });

  it('filters answer cards by tradition', () => {
    render(<RoundtablePage />);

    // Filter to Stoicism
    const stoicismFilter = screen.getByTestId('filter-stoicism');
    fireEvent.click(stoicismFilter);

    // Marcus Aurelius should be visible, others hidden
    expect(screen.getByTestId('answer-card-marcus-aurelius')).toBeInTheDocument();
    expect(screen.queryByTestId('answer-card-confucius')).not.toBeInTheDocument();
    expect(screen.queryByTestId('answer-card-ada-lovelace')).not.toBeInTheDocument();
    expect(screen.queryByTestId('answer-card-virginia-woolf')).not.toBeInTheDocument();

    expect(screen.getByTestId('active-card-count')).toHaveTextContent(
      'Showing 1 of 4 perspectives'
    );

    // Filter back to All
    const allFilter = screen.getByTestId('filter-all');
    fireEvent.click(allFilter);
    expect(screen.getByTestId('answer-card-confucius')).toBeInTheDocument();
  });

  it('allows switching questions', () => {
    render(<RoundtablePage />);

    const otherQuestionBtn = screen.getByRole('button', {
      name: /How do I overcome creative self-doubt/i,
    });
    fireEvent.click(otherQuestionBtn);

    expect(screen.getByTestId('active-question-display')).toHaveTextContent(
      'How do I overcome creative self-doubt and the fear of not being good enough?'
    );
  });

  it('tracks bookmarked cards in the header counter', () => {
    render(<RoundtablePage />);

    // Initially 0 bookmarked
    expect(screen.queryByText(/Bookmarked/i)).not.toBeInTheDocument();

    // Bookmark first card
    const bookmarkButtons = screen.getAllByTestId('bookmark-button');
    fireEvent.click(bookmarkButtons[0]);

    expect(screen.getByText('1 Bookmarked')).toBeInTheDocument();

    // Bookmark second card
    fireEvent.click(bookmarkButtons[1]);
    expect(screen.getByText('2 Bookmarked')).toBeInTheDocument();

    // Unbookmark first card
    fireEvent.click(bookmarkButtons[0]);
    expect(screen.getByText('1 Bookmarked')).toBeInTheDocument();
  });
});
