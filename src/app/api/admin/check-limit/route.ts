export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/server/auth/session";
import {
  assertWithinLimit,
  checkDailyRoundtableLimit,
  UsageLimitError,
} from "@/server/services/usageLimitService";

/**
 * Check the authenticated caller's own daily roundtable usage and remaining quota (uses requireUser).
 * Server always enforces limit via assertWithinLimit(user.id) and returns 429 when quota is exceeded.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireUser(request);

    // Always enforce usage limit on the server without relying on client flag
    await assertWithinLimit(user.id);

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
