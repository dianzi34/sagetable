export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { ReactElement } from "react";
import { AppShell } from "@/components/AppShell";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { AuthError, requireRole } from "@/server/auth/session";
import {
  listAuditLogs,
  listUsageLimits,
  listUsers,
} from "@/server/services/adminService";

export default async function AdminPage(): Promise<ReactElement> {
  let user;
  try {
    user = await requireRole("admin");
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
                You do not have permission to view the SageTable admin dashboard.
                Only users with the Administrator role can access this page.
              </p>
            </div>
          </div>
        </AppShell>
      );
    }
    throw error;
  }

  const [users, limits, logs] = await Promise.all([
    listUsers(),
    listUsageLimits(),
    listAuditLogs(50),
  ]);

  return (
    <AppShell user={user}>
      <section className="bg-grid-floor pt-8 pb-10 px-6 border-b-2 border-line">
        <div className="max-w-page mx-auto">
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill mb-3">
            Administration
          </span>
          <h1 className="font-display font-semibold text-[clamp(1.5rem,3vw,2.2rem)] leading-snug text-ink m-0">
            Roles, Limits, & Audit Log
          </h1>
          <p className="text-muted text-sm mt-2 max-w-xl">
            Manage user roles, configure daily generation quotas per tier, and review
            system audit trails.
          </p>
        </div>
      </section>

      <main className="max-w-page mx-auto px-6 py-10">
        <AdminDashboardClient
          initialUsers={users}
          initialLimits={limits}
          initialLogs={logs}
        />
      </main>
    </AppShell>
  );
}
