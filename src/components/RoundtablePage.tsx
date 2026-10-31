'use client';

import React, { useState } from 'react';
import { AnswerCard } from './AnswerCard';
import { MOCK_ROUNDTABLE_ANSWERS, SAMPLE_QUESTIONS } from '@/data/mockAnswers';
import { MessageSquare, Users, Sparkles, Filter, BookmarkCheck } from 'lucide-react';

export const RoundtablePage: React.FC = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [selectedTradition, setSelectedTradition] = useState<string>('All');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const traditions = [
    'All',
    ...Array.from(new Set(MOCK_ROUNDTABLE_ANSWERS.map((a) => a.figure.tradition))),
  ];

  const handleBookmarkToggle = (answerId: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(answerId)) {
        next.delete(answerId);
      } else {
        next.add(answerId);
      }
      return next;
    });
  };

  const filteredAnswers = MOCK_ROUNDTABLE_ANSWERS.filter((ans) => {
    if (selectedTradition !== 'All' && ans.figure.tradition !== selectedTradition) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* Top Banner / Header */}
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-10 dark:border-stone-800 dark:bg-stone-900/80">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                  SageTable
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Timeless wisdom from historical writings, explained in plain English
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-1.5" data-testid="roundtable-participants-stat">
                <Users className="h-4 w-4 text-amber-600" />
                <span>{MOCK_ROUNDTABLE_ANSWERS.length} Thinkers at the Table</span>
              </div>
              {bookmarkedIds.size > 0 && (
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <BookmarkCheck className="h-4 w-4" />
                  <span>{bookmarkedIds.size} Bookmarked</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Roundtable Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Roundtable Prompt / Question Hero */}
        <section
          aria-labelledby="roundtable-question-title"
          className="mb-8 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 via-stone-50 to-stone-100 p-6 shadow-xs dark:border-amber-900/30 dark:from-stone-900 dark:via-stone-900/80 dark:to-stone-800/40"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            <MessageSquare className="h-4 w-4" />
            <span>The Roundtable Question</span>
          </div>

          <h2
            id="roundtable-question-title"
            data-testid="active-question-display"
            className="mt-2 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl"
          >
            &ldquo;{selectedQuestion.text}&rdquo;
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-500">Try another question:</span>
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setSelectedQuestion(q)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  selectedQuestion.id === q.id
                    ? 'bg-amber-700 text-white font-medium shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'
                }`}
              >
                {q.text.slice(0, 38)}...
              </button>
            ))}
          </div>
        </section>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400" />
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Filter by Tradition:
            </span>
            <div className="flex flex-wrap gap-1.5" data-testid="tradition-filters">
              {traditions.map((tradition) => (
                <button
                  key={tradition}
                  type="button"
                  onClick={() => setSelectedTradition(tradition)}
                  data-testid={`filter-${tradition.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    selectedTradition === tradition
                      ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900 font-medium'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                  }`}
                >
                  {tradition}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-stone-500" data-testid="active-card-count">
            Showing {filteredAnswers.length} of {MOCK_ROUNDTABLE_ANSWERS.length} perspectives
          </p>
        </div>

        {/* Answers Grid */}
        <div
          data-testid="roundtable-answers-grid"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          {filteredAnswers.map((ans) => (
            <AnswerCard
              key={ans.id}
              answer={ans}
              userQuestion={selectedQuestion.text}
              isBookmarked={bookmarkedIds.has(ans.id)}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default RoundtablePage;
