'use client';

import React, { useState } from 'react';
import {
  Quote,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { RoundtableAnswer } from '@/types/roundtable';

export interface AnswerCardProps {
  answer: RoundtableAnswer;
  userQuestion?: string;
  defaultExpanded?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: (answerId: string) => void;
  className?: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  userQuestion,
  defaultExpanded = true,
  isBookmarked = false,
  onBookmarkToggle,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [showFullDetails, setShowFullDetails] = useState(defaultExpanded);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const { figure, directAnswer, passage, explanation } = answer;
  const displayedQuestion = userQuestion || answer.question;

  // Copy full citation & passage to clipboard
  const handleCopyQuote = async () => {
    const citation = `${passage.source.work}${
      passage.source.section ? `, ${passage.source.section}` : ''
    }${passage.source.year ? ` (${passage.source.year})` : ''}`;
    const copyText = `"${passage.text}"\n— ${figure.name}, ${citation}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(copyText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback if clipboard API is unavailable
      setCopied(false);
    }
  };

  const handleBookmarkClick = () => {
    const nextState = !bookmarked;
    setBookmarked(nextState);
    if (onBookmarkToggle) {
      onBookmarkToggle(answer.id);
    }
  };

  const handleLikeClick = () => {
    if (hasLiked) {
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  return (
    <article
      data-testid={`answer-card-${figure.id}`}
      aria-labelledby={`figure-name-${figure.id}`}
      className={`relative flex flex-col rounded-2xl border border-stone-200 bg-white/95 p-6 shadow-sm transition-all duration-200 hover:shadow-md dark:border-stone-800 dark:bg-stone-900/90 ${className}`}
    >
      {/* Top Header: Historical Figure info & quick actions */}
      <header className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5 dark:border-stone-800">
        <div className="flex items-center gap-4">
          {/* Avatar / Portrait with Initials fallback */}
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 via-stone-700 to-stone-900 text-base font-semibold tracking-wider text-amber-50 shadow-inner ring-2 ring-amber-100 dark:ring-stone-700 overflow-hidden"
            data-testid="figure-avatar"
          >
            {figure.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={figure.avatarUrl}
                alt={`${figure.name} portrait`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span aria-hidden="true">{figure.initials}</span>
            )}
          </div>

          {/* Name & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`figure-name-${figure.id}`}
                className="font-serif text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100"
              >
                {figure.name}
              </h3>
              <span
                data-testid="tradition-badge"
                className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              >
                {figure.tradition}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
              <span>{figure.title}</span>
              <span className="mx-1.5 text-stone-400">•</span>
              <span className="font-mono text-stone-500">{figure.era}</span>
            </p>
          </div>
        </div>

        {/* Header Actions: Bookmark & Copy */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleBookmarkClick}
            aria-label={bookmarked ? `Remove bookmark for ${figure.name}` : `Bookmark answer from ${figure.name}`}
            aria-pressed={bookmarked}
            data-testid="bookmark-button"
            className={`rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 ${
              bookmarked ? 'text-amber-600 dark:text-amber-400' : ''
            }`}
          >
            {bookmarked ? (
              <BookmarkCheck className="h-5 w-5 fill-amber-500 text-amber-600 dark:fill-amber-400 dark:text-amber-400" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mt-5 space-y-5">
        {/* User Question Context (if provided) */}
        {displayedQuestion && (
          <div
            data-testid="question-context"
            className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600 dark:bg-stone-800/60 dark:text-stone-400"
          >
            <span className="font-medium text-stone-700 dark:text-stone-300">
              Addressing question:{' '}
            </span>
            &ldquo;{displayedQuestion}&rdquo;
          </div>
        )}

        {/* Section 1: Direct Answer to the User's Question */}
        <section aria-labelledby={`direct-answer-heading-${figure.id}`}>
          <h4
            id={`direct-answer-heading-${figure.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Direct Answer
          </h4>
          <p
            data-testid="direct-answer-text"
            className="mt-1.5 text-base leading-relaxed text-stone-800 dark:text-stone-200"
          >
            {directAnswer}
          </p>
        </section>

        {/* Section 2: Original Historical Passage & Source Citation */}
        <section
          aria-labelledby={`passage-heading-${figure.id}`}
          className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-4.5 dark:border-stone-800 dark:bg-stone-800/40"
        >
          <div className="flex items-center justify-between pb-2">
            <h4
              id={`passage-heading-${figure.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300"
            >
              <BookOpen className="h-3.5 w-3.5 text-stone-500" />
              Original Historical Passage
            </h4>

            <button
              type="button"
              onClick={handleCopyQuote}
              aria-label="Copy original passage and source"
              data-testid="copy-quote-button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-800 dark:hover:bg-stone-700/60 dark:hover:text-stone-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Passage</span>
                </>
              )}
            </button>
          </div>

          {/* Historical Verbatim Passage */}
          <div className="relative pl-6">
            <Quote
              className="absolute left-0 top-0.5 h-4 w-4 text-amber-500/50"
              aria-hidden="true"
            />
            <blockquote
              data-testid="original-passage-text"
              className="font-serif text-[15px] italic leading-relaxed text-stone-800 dark:text-stone-200"
            >
              &ldquo;{passage.text}&rdquo;
            </blockquote>
          </div>

          {/* Source Citation */}
          <footer className="mt-3.5 border-t border-stone-200/60 pt-2.5 text-xs text-stone-600 dark:border-stone-700/60 dark:text-stone-400">
            <cite
              data-testid="passage-source"
              className="not-italic flex flex-wrap items-center gap-x-2 gap-y-1"
            >
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {passage.source.work}
              </span>
              {passage.source.section && (
                <span className="text-stone-500">• {passage.source.section}</span>
              )}
              {passage.source.year && (
                <span className="text-stone-400">({passage.source.year})</span>
              )}
              {passage.source.translator && (
                <span className="text-stone-500 italic">
                  [{passage.source.translator}]
                </span>
              )}
              {passage.source.publicDomainNote && (
                <span
                  data-testid="public-domain-badge"
                  className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  {passage.source.publicDomainNote}
                </span>
              )}
              {passage.source.sourceUrl && (
                <a
                  href={passage.source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View source text for ${passage.source.work}`}
                  className="inline-flex items-center gap-0.5 text-stone-500 hover:text-stone-800 hover:underline dark:hover:text-stone-200"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="sr-only">External source</span>
                </a>
              )}
            </cite>
            {passage.context && (
              <p
                data-testid="passage-context"
                className="mt-1.5 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400"
              >
                <span className="font-medium text-stone-600 dark:text-stone-300">
                  Historical context:
                </span>{' '}
                {passage.context}
              </p>
            )}
          </footer>
        </section>

        {/* Section 3: Plain-English Explanation */}
        <section
          aria-labelledby={`explanation-heading-${figure.id}`}
          className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4.5 dark:border-emerald-900/60 dark:bg-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <h4
              id={`explanation-heading-${figure.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300"
            >
              <Lightbulb className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Plain-English Explanation
            </h4>

            {explanation.breakdown && explanation.breakdown.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFullDetails((prev) => !prev)}
                aria-expanded={showFullDetails}
                aria-controls={`explanation-details-${figure.id}`}
                data-testid="toggle-explanation-details"
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200"
              >
                <span>{showFullDetails ? 'Fewer details' : 'More breakdown'}</span>
                {showFullDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Plain English Summary */}
          <p
            data-testid="explanation-summary"
            className="mt-2 text-sm leading-relaxed text-stone-800 dark:text-stone-200"
          >
            {explanation.summary}
          </p>

          {/* Detailed breakdown & Actionable Takeaway */}
          {showFullDetails && (
            <div
              id={`explanation-details-${figure.id}`}
              data-testid="explanation-details"
              className="mt-3.5 space-y-3 border-t border-emerald-200/60 pt-3 dark:border-emerald-900/50"
            >
              {explanation.breakdown && explanation.breakdown.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    Key Points:
                  </h5>
                  <ul className="mt-1.5 space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                    {explanation.breakdown.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.actionableTakeaway && (
                <div
                  data-testid="actionable-takeaway"
                  className="rounded-lg bg-white/70 p-3 text-xs text-stone-800 shadow-xs dark:bg-stone-900/60 dark:text-stone-200"
                >
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Modern Takeaway:{' '}
                  </span>
                  <span>{explanation.actionableTakeaway}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Footer: Tags & Helpful Reaction */}
        <footer className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-1.5" data-testid="answer-tags">
            {answer.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-400"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLikeClick}
              aria-label={`Mark answer from ${figure.name} as insightful`}
              aria-pressed={hasLiked}
              data-testid="helpful-button"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                hasLiked
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800'
              }`}
            >
              <ThumbsUp className={`h-3 w-3 ${hasLiked ? 'fill-current' : ''}`} />
              <span>Insightful</span>
              {likes > 0 && <span className="font-semibold">{likes}</span>}
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
};

export default AnswerCard;
