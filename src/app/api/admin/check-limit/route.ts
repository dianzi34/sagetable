export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/server/auth/session";
import {
  checkDailyRoundtableLimit,
  enforceDailyRoundtableLimit,
  UsageLimitError,
} from "@/server/services/usageLimitService";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const enforce = url.searchParams.get("enforce") === "true";

    if (enforce) {
      await enforceDailyRoundtableLimit(user);
    }

    const status = await checkDailyRoundtableLimit(user.id, user.role);
    return NextResponse.json({ data: status });
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            resetAt: error.resetAt,
          },
        },
        { status: 429 },
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check usage limit",
        },
      },
      { status: 500 },
    );
  }
}
