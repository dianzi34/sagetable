import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { AppShell } from "@/components/AppShell";
import { RoundtableQuestionForm } from "@/components/RoundtableQuestionForm";
import { getThemeBySlug } from "@/server/services/catalogService";

interface ThemePageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Individual theme page with figure selection and question composition.
 */
export default async function ThemeDetailPage({
  params,
}: ThemePageProps): Promise<ReactElement> {
  const { slug } = await params;
  const theme = await getThemeBySlug(slug);

  if (!theme) {
    notFound();
  }

  const initialFigureIds = theme.suggestedFigures.map((f) => f.id);

  return (
    <AppShell>
      <section className="bg-grid-floor pt-8 pb-10 px-6">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-3">
          <Link
            href="/themes"
            className="text-xs font-semibold text-muted hover:text-ink transition-colors no-underline inline-flex items-center gap-1"
          >
            ← Back to themes
          </Link>
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill">
            Theme
          </span>
          <h1 className="font-display font-bold text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight text-ink m-0">
            {theme.name}
          </h1>
          <p className="max-w-[620px] text-sm sm:text-base text-muted">
            {theme.description}
          </p>
        </div>
      </section>

      <section
        aria-label="Roundtable configuration"
        className="w-full max-w-page mx-auto px-6 py-10"
      >
        <RoundtableQuestionForm
          themeSlug={theme.slug}
          suggestedQuestions={theme.suggestedQuestions}
          availableFigures={theme.availableFigures}
          initialSelectedFigureIds={initialFigureIds}
        />
      </section>
    </AppShell>
  );
}
