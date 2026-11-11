import Link from "next/link";
import type { CSSProperties, ReactElement } from "react";
import { AppShell } from "@/components/AppShell";

const FIGURE_CARDS = [
  {
    name: "Mark Twain",
    years: "1835-1910",
    note: "Plain-spoken humor, riverboat grit, and unvarnished honesty about fear and folly.",
    quote: "First voice at the table, paired with a verbatim public-domain passage.",
    accent: "var(--accent-twain)",
  },
  {
    name: "Helen Keller",
    years: "1880-1968",
    note: "Patient resolve shaped by struggle, teaching, and hard-won optimism.",
    quote: "Every answer includes a plain-English takeaway right beside the source.",
    accent: "var(--accent-keller)",
  },
  {
    name: "Marie Curie",
    years: "1867-1934",
    note: "Calm curiosity that treats setbacks as measurements rather than verdicts.",
    quote: "Built around curated writings you can trace back word for word.",
    accent: "var(--accent-curie)",
  },
] as const;

/**
 * Landing page introducing the hand-drawn SageTable roundtable experience.
 */
export default function HomePage(): ReactElement {
  return (
    <AppShell>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="wobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="2.8" />
          </filter>
        </defs>
      </svg>

      <section className="relative overflow-hidden bg-grid-floor pt-10 pb-12 px-6">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-5">
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill">
            A small table of great minds
          </span>

          <h1 className="font-display font-extrabold text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.06] tracking-[-0.02em] text-ink">
            Pull up a chair. Great minds are listening.
          </h1>

          <p className="max-w-[600px] text-base sm:text-lg text-muted">
            Bring a real question to 2 or 3 historical thinkers. Each guest answers in their own
            voice, anchored by a verbatim passage from their writings and a plain-English note.
          </p>

          <div className="pt-2">
            <Link
              href="/themes"
              className="inline-flex items-center gap-2 rounded-full border-2 border-blue bg-blue px-7 py-3.5 text-base font-semibold text-action-ink shadow-ask no-underline hover:opacity-95"
            >
              Bring a question to the table
            </Link>
          </div>
        </div>

        <div className="max-w-[640px] mx-auto mt-10">
          <svg
            viewBox="0 0 640 220"
            className="w-full h-auto"
            role="img"
            aria-label="Illustration of three guests seated around a round wooden table with teacups and books"
          >
            <g filter="url(#wobble)">
              <rect x="304" y="142" width="32" height="58" fill="var(--leg)" />
              <ellipse cx="320" cy="202" rx="68" ry="10" fill="var(--leg)" />
              <ellipse cx="320" cy="118" rx="220" ry="68" fill="var(--table-edge)" />
              <ellipse cx="320" cy="108" rx="220" ry="68" fill="var(--table)" />

              <rect x="218" y="114" width="60" height="12" rx="3" fill="var(--accent-curie)" />
              <rect x="224" y="102" width="54" height="12" rx="3" fill="#c96a54" />
              <rect x="220" y="90" width="48" height="12" rx="3" fill="#e2c26a" />

              <circle cx="152" cy="84" r="24" fill="var(--paper)" stroke="var(--accent-twain)" strokeWidth="3.5" />
              <circle cx="320" cy="48" r="24" fill="var(--paper)" stroke="var(--accent-keller)" strokeWidth="3.5" />
              <circle cx="488" cy="84" r="24" fill="var(--paper)" stroke="var(--accent-curie)" strokeWidth="3.5" />

              <circle cx="192" cy="114" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
              <circle cx="320" cy="86" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
              <circle cx="448" cy="114" r="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />

              <ellipse cx="320" cy="126" rx="24" ry="10" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
              <path d="M306 124 C306 112 334 112 334 124 Z" fill="#f3d6a4" stroke="var(--ink)" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      </section>

      <section
        aria-label="How the roundtable works"
        className="w-full max-w-page mx-auto px-6 pt-4 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {FIGURE_CARDS.map((card) => (
          <article
            key={card.name}
            style={{ "--figure-accent": card.accent } as CSSProperties}
            className="bg-paper border-2 border-ink border-wobbly p-5 flex flex-col gap-3.5"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="w-4 h-4 rounded-full bg-[var(--figure-accent)] shrink-0"
              />
              <div>
                <h2 className="font-display font-semibold text-lg leading-tight text-ink">
                  {card.name}
                </h2>
                <p className="text-sm text-muted">{card.years}</p>
              </div>
            </div>

            <p className="text-sm text-ink">{card.note}</p>

            <div className="bg-slip border-[1.5px] border-line border-l-[5px] border-l-[var(--figure-accent)] rounded-[4px_12px_10px_4px] p-3.5 shadow-slip -rotate-[0.8deg]">
              <p className="font-serif italic text-sm text-ink">{card.quote}</p>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
