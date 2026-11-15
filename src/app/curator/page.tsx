export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { ReactElement } from "react";
import { AppShell } from "@/components/AppShell";
import { CuratorDashboardClient } from "@/components/curator/CuratorDashboardClient";
import { AuthError, requireRole } from "@/server/auth/session";
import {
  listAnswerBankEntries,
  listFigures,
  listThemes,
} from "@/server/services/curatorService";

export default async function CuratorPage(): Promise<ReactElement> {
  let user;
  try {
    user = await requireRole(["curator", "admin"]);
  } catch (error) {
    if (error instanceof AuthError && error.status === 403) {
      return (
        <AppShell>
          <div className="max-w-[760px] mx-auto px-6 py-16">
            <div
              role="alert"
              className="bg-white border-2 border-[#232323] p-8 shadow-[4px_4px_0px_#232323]"
            >
              <h1 className="text-2xl font-bold text-red-600 mb-2 font-display">
                403 — Access Denied
              </h1>
              <p className="text-[#6b6b6b]">
                You do not have permission to view the curator management console.
                Only users with the Curator or Administrator role can access this page.
              </p>
            </div>
          </div>
        </AppShell>
      );
    }
    throw error;
  }

  const [figures, themes, answers] = await Promise.all([
    listFigures(),
    listThemes(),
    listAnswerBankEntries(),
  ]);

  return (
    <AppShell user={user}>
      <section className="bg-grid-floor pt-8 pb-10 px-6 border-b-2 border-line">
        <div className="max-w-page mx-auto">
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill mb-3">
            Curator Portal
          </span>
          <h1 className="font-display font-semibold text-[clamp(1.5rem,3vw,2.2rem)] leading-snug text-ink m-0">
            Content & Answer Bank Management
          </h1>
          <p className="text-muted text-sm mt-2 max-w-xl">
            Maintain figures, manage themes, upload public-domain writings with automated
            chunking, and craft curated answers.
          </p>
        </div>
      </section>

      <main className="max-w-page mx-auto px-6 py-10">
        <CuratorDashboardClient
          initialFigures={figures}
          initialThemes={themes}
          initialAnswers={answers}
        />
      </main>
    </AppShell>
  );
}
