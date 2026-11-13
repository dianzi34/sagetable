export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { setUsageLimitSchema } from "@/lib/admin";
import { AuthError, requireRole } from "@/server/auth/session";
import { listUsageLimits, setUsageLimit } from "@/server/services/adminService";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole("admin", request);
    const limits = await listUsageLimits();
    return NextResponse.json({ data: { limits } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list usage limits" } },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await requireRole("admin", request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }

    const parsed = setUsageLimitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 400 },
      );
    }

    const updated = await setUsageLimit({
      actorId: session.id,
      role: parsed.data.role,
      dailyRoundtables: parsed.data.dailyRoundtables,
    });

    return NextResponse.json({ data: { limit: updated } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to set usage limit" } },
      { status: 500 },
    );
  }
}
