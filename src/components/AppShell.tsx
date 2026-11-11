import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Shared page chrome with hand-drawn navigation header, main landmark, and footer note.
 */
export function AppShell({ children }: Readonly<AppShellProps>): ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-action-ink"
      >
        Skip to main content
      </a>

      <header className="w-full max-w-page mx-auto px-6 pt-7 pb-5 flex flex-wrap items-center justify-between gap-4 border-b-[1.5px] border-dashed border-line">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight text-ink no-underline"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <ellipse cx="16" cy="14" rx="12" ry="6" fill="var(--table)" stroke="var(--ink)" strokeWidth="2" />
            <path d="M16 20v8M10 28h12" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="8" r="3" fill="var(--accent-twain)" />
            <circle cx="16" cy="6" r="3" fill="var(--accent-keller)" />
            <circle cx="23" cy="8" r="3" fill="var(--accent-curie)" />
          </svg>
          <span>SageTable</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-3">
          <Link
            href="/themes"
            className="rounded-full border-[1.5px] border-line bg-paper px-4 py-1.5 text-sm font-medium text-ink shadow-pill no-underline hover:border-ink"
          >
            Roundtable
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border-[1.5px] border-ink bg-paper px-4 py-1.5 text-sm font-semibold text-ink shadow-pill no-underline hover:bg-table"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main id="main-content" className="flex-1 w-full">
        {children}
      </main>

      <footer className="w-full max-w-footer mx-auto px-6 pt-7 pb-10 text-center text-muted text-[0.84rem]">
        <p>
          Answers are curated interpretations written in each figure&apos;s voice, with verbatim
          original passages.
        </p>
      </footer>
    </div>
  );
}
