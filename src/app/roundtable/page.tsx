import type { ReactElement } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import { AppShell } from "@/components/AppShell";
import {
  DEMO_ANSWER_CARDS,
  DEMO_NO_MATCH_CARD,
  DEMO_QUESTION,
  DEMO_THEME_NAME,
} from "@/server/fixtures/answerCards";

/**
 * Fixture-backed roundtable preview page displaying the demo question and answer cards.
 */
export default function RoundtablePage(): ReactElement {
  return (
    <AppShell>
      <section className="bg-grid-floor pt-8 pb-10 px-6">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-3">
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill">
            {DEMO_THEME_NAME}
          </span>
          <h1 className="font-display font-semibold text-[clamp(1.35rem,2.8vw,1.9rem)] leading-snug text-ink m-0">
            {DEMO_QUESTION}
          </h1>
        </div>
      </section>

      <section
        aria-label="Roundtable answers"
        className="w-full max-w-page mx-auto px-6 pt-2 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
      >
        {DEMO_ANSWER_CARDS.map((card) => (
          <AnswerCard key={card.figure.slug} data={card} />
        ))}
      </section>

      <section
        aria-label="No-match example"
        className="w-full max-w-page mx-auto px-6 pb-12"
      >
        <p className="text-sm text-muted mb-3">
          No-match example (when no curated answer passes the match threshold):
        </p>
        <div className="max-w-md">
          <AnswerCard data={DEMO_NO_MATCH_CARD} />
        </div>
      </section>
    </AppShell>
  );
}
