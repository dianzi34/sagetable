"use client";

import React, { useState } from "react";
import { AnswerCard } from "@/components/roundtable";
import {
  MOCK_FIGURES,
  MOCK_ANSWERS,
  MOCK_PASSAGES,
  MOCK_EXPLANATIONS,
} from "@/data/mockRoundtable";
import { AnswerCardStatus } from "@/types";

export default function RoundtablePage(): React.JSX.Element {
  const [cardsState, setCardsState] = useState<
    Record<
      string,
      {
        status: AnswerCardStatus;
        isFlagged: boolean;
      }
    >
  >({
    twain: { status: "complete", isFlagged: false },
    keller: { status: "complete", isFlagged: false },
    curie: { status: "complete", isFlagged: false },
  });

  const [notification, setNotification] = useState<string | null>(null);

  const handleRetry = (figureId: string) => {
    setCardsState((prev) => ({
      ...prev,
      [figureId]: { ...prev[figureId], status: "streaming" },
    }));
    setTimeout(() => {
      setCardsState((prev) => ({
        ...prev,
        [figureId]: { ...prev[figureId], status: "complete" },
      }));
    }, 1500);
  };

  const handleFlag = (figureId: string, figureName: string) => {
    setCardsState((prev) => ({
      ...prev,
      [figureId]: { ...prev[figureId], isFlagged: true },
    }));
    setNotification(`Thanks. ${figureName}’s answer was sent for review.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const simulateState = (figureId: string, status: AnswerCardStatus) => {
    setCardsState((prev) => ({
      ...prev,
      [figureId]: { ...prev[figureId], status },
    }));
  };

  return (
    <main className="max-w-[1100px] mx-auto px-6 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-ink">
          SageTable
        </h1>
        <p className="mt-2 text-muted text-lg">
          Pull up a chair. Great minds are listening.
        </p>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          role="status"
          className="mb-6 p-3 px-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-xl text-sm font-medium animate-fadeIn"
        >
          {notification}
        </div>
      )}

      {/* Question section */}
      <section className="max-w-[760px] mx-auto text-center mb-10">
        <span className="inline-block text-sm text-muted border border-line rounded-full px-3.5 py-1 mb-3">
          Dealing with failure
        </span>
        <h2 className="font-heading font-semibold text-2xl sm:text-3xl leading-snug text-ink">
          “I failed my first technical interview, and now I’m afraid to try again. How do I keep going?”
        </h2>
      </section>

      {/* Answers Grid */}
      <section
        aria-label="Roundtable answers"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start"
      >
        {/* Mark Twain Card */}
        <AnswerCard
          figure={MOCK_FIGURES.twain}
          status={cardsState.twain.status}
          answer={
            cardsState.twain.status === "streaming"
              ? "Fear of a second try is natural. I knew it well. I set type..."
              : MOCK_ANSWERS.twain
          }
          passage={MOCK_PASSAGES.twain}
          explanation={MOCK_EXPLANATIONS.twain}
          isFlagged={cardsState.twain.isFlagged}
          onFlag={() => handleFlag("twain", MOCK_FIGURES.twain.name)}
          onRetry={() => handleRetry("twain")}
        />

        {/* Helen Keller Card */}
        <AnswerCard
          figure={MOCK_FIGURES.keller}
          status={cardsState.keller.status}
          answer={
            cardsState.keller.status === "streaming"
              ? "When I was a child, every word I learned came after many failed attempts..."
              : MOCK_ANSWERS.keller
          }
          passage={MOCK_PASSAGES.keller}
          explanation={MOCK_EXPLANATIONS.keller}
          isFlagged={cardsState.keller.isFlagged}
          onFlag={() => handleFlag("keller", MOCK_FIGURES.keller.name)}
          onRetry={() => handleRetry("keller")}
        />

        {/* Marie Curie Card (No passage match) */}
        <AnswerCard
          figure={MOCK_FIGURES.curie}
          status={cardsState.curie.status}
          answer={
            cardsState.curie.status === "streaming"
              ? "When Pierre and I began, our laboratory was a leaking shed..."
              : MOCK_ANSWERS.curie
          }
          passage={null}
          explanation={null}
          isFlagged={cardsState.curie.isFlagged}
          onFlag={() => handleFlag("curie", MOCK_FIGURES.curie.name)}
          onRetry={() => handleRetry("curie")}
        />
      </section>

      {/* State simulation controls for testing and preview */}
      <section className="mt-12 p-4 border border-line rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 text-sm">
        <p className="font-semibold text-ink mb-2">Simulate Card States (Interactive Preview):</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => simulateState("curie", "failed")}
            className="px-3 py-1 text-xs border border-line rounded-lg bg-paper text-ink hover:bg-neutral-100"
          >
            Simulate Marie Curie failure
          </button>
          <button
            type="button"
            onClick={() => simulateState("twain", "streaming")}
            className="px-3 py-1 text-xs border border-line rounded-lg bg-paper text-ink hover:bg-neutral-100"
          >
            Simulate Mark Twain streaming
          </button>
          <button
            type="button"
            onClick={() => {
              simulateState("twain", "complete");
              simulateState("keller", "complete");
              simulateState("curie", "complete");
            }}
            className="px-3 py-1 text-xs border border-line rounded-lg bg-paper text-ink hover:bg-neutral-100"
          >
            Reset all to complete
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-muted">
        SageTable answers are AI interpretations inspired by public-domain writings.
      </footer>
    </main>
  );
}
