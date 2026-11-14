import Link from "next/link";
import type { ReactElement } from "react";
import { AppShell } from "@/components/AppShell";
import { FigureAvatar } from "@/components/FigureAvatar";
import { requireUser } from "@/server/auth/session";
import { listUserRoundtables } from "@/server/services/roundtableService";

export const metadata = {
  title: "Roundtable History — SageTable",
  description: "Review your past roundtables and questions.",
};

export default async function HistoryPage(): Promise<ReactElement> {
  const user = await requireUser();
  const roundtables = await listUserRoundtables(user.id);

  return (
    <AppShell>
      <section className="bg-grid-floor pt-8 pb-10 px-6">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-3">
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill">
            Notebook & History
          </span>
          <h1 className="font-display font-bold text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight text-ink m-0">
            Roundtable History
          </h1>
          <p className="max-w-[620px] text-sm sm:text-base text-muted">
            Revisit your conversations with history&apos;s sharp minds.
          </p>
        </div>
      </section>

      <section className="w-full max-w-page mx-auto px-6 py-10">
        {roundtables.length === 0 ? (
          <div className="max-w-md mx-auto text-center p-8 rounded-2xl border-2 border-dashed border-line bg-paper flex flex-col items-center gap-4">
            <p className="text-muted m-0">
              You haven&apos;t started any roundtables yet.
            </p>
            <Link
              href="/themes"
              className="inline-block rounded-full bg-blue text-action-ink px-6 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity"
            >
              Choose a theme to begin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {roundtables.map((rt) => (
              <article
                key={rt.id}
                className="bg-paper border-2 border-ink border-wobbly p-5 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted">
                    {rt.theme ? (
                      <span className="rounded-full border border-line px-2.5 py-0.5 font-medium">
                        {rt.theme.name}
                      </span>
                    ) : (
                      <span>Open Question</span>
                    )}
                    <time dateTime={new Date(rt.createdAt).toISOString()}>
                      {new Date(rt.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h2 className="font-display font-semibold text-lg leading-snug text-ink m-0">
                    {rt.question}
                  </h2>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-dashed border-line">
                  <div className="flex items-center -space-x-2">
                    {rt.answers.map((a, idx) => (
                      <div
                        key={a.figure?.id ?? a.id ?? idx}
                        className="rounded-full ring-2 ring-paper"
                        title={a.figure.name}
                      >
                        <FigureAvatar
                          slug={a.figure.slug}
                          name={a.figure.name}
                          size={32}
                        />
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/roundtable?id=${rt.id}`}
                    className="text-sm font-semibold text-blue hover:underline inline-flex items-center gap-1"
                  >
                    View roundtable →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
