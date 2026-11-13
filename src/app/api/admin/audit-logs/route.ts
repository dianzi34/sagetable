export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/server/auth/session";
import { listAuditLogs } from "@/server/services/adminService";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole("admin", request);
    const logs = await listAuditLogs(50);
    return NextResponse.json({ data: { logs } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list audit logs" } },
      { status: 500 },
    );
  }
}
