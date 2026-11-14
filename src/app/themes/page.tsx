import Link from "next/link";
import type { ReactElement } from "react";
import { AppShell } from "@/components/AppShell";
import { listThemes } from "@/server/services/catalogService";

/**
 * Themes index page showing available roundtable discussion topics.
 */
export default async function ThemesPage(): Promise<ReactElement> {
  const themes = await listThemes();

  return (
    <AppShell>
      <section className="bg-grid-floor pt-10 pb-12 px-6">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-4">
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill">
            Explore Themes
          </span>
          <h1 className="font-display font-extrabold text-[clamp(2rem,4vw,3rem)] leading-tight text-ink m-0">
            Choose a Theme
          </h1>
          <p className="max-w-[600px] text-base sm:text-lg text-muted">
            Select a topic to gather historical figures for your question, or explore their unique perspectives.
          </p>
        </div>
      </section>

      <section
        aria-label="Available themes"
        className="w-full max-w-page mx-auto px-6 py-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <Link
              key={theme.slug}
              href={`/themes/${theme.slug}`}
              className="bg-paper border-2 border-ink border-wobbly p-6 rounded-2xl flex flex-col justify-between gap-4 no-underline text-ink hover:-translate-y-1 transition-transform shadow-sm group"
            >
              <div className="flex flex-col gap-2.5">
                <h2 className="font-display font-semibold text-xl text-ink group-hover:text-blue transition-colors">
                  {theme.name}
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  {theme.description}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-muted border-t border-line">
                <span>{theme.suggestedQuestions.length} sample questions</span>
                <span className="font-semibold text-blue group-hover:underline">
                  Pull up a chair →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
