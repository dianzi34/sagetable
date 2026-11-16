import { NextResponse } from "next/server";
import { roundtableInputSchema } from "@/lib/roundtableInput";
import {
  jsonError,
  parseJsonBody,
} from "@/server/auth/routeHelper";
import { authErrorResponse, requireUser } from "@/server/auth/session";
import {
  createRoundtable,
  listUserRoundtables,
} from "@/server/services/roundtableService";
import {
  UsageLimitError,
} from "@/server/services/usageLimitService";

/**
 * Create a new roundtable for the authenticated user.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let user;
  try {
    user = await requireUser(request);
  } catch (error) {
    return (
      authErrorResponse(error) ??
      jsonError(401, "UNAUTHORIZED", "Authentication required")
    );
  }

  const parsed = await parseJsonBody(request, roundtableInputSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const roundtable = await createRoundtable({
      userId: user.id,
      themeSlug: parsed.data.themeSlug,
      figureIds: parsed.data.figureIds,
      question: parsed.data.question,
      enforceLimit: true,
    });

    return NextResponse.json(
      {
        id: roundtable.id,
        data: { id: roundtable.id, roundtable },
      },
      { status: 201 },
    );
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
    return jsonError(500, "INTERNAL_ERROR", "Failed to create roundtable");
  }
}

/**
 * List the current user's past roundtables.
 */
export async function GET(request: Request): Promise<NextResponse> {
  let user;
  try {
    user = await requireUser(request);
  } catch (error) {
    return (
      authErrorResponse(error) ??
      jsonError(401, "UNAUTHORIZED", "Authentication required")
    );
  }

  try {
    const roundtables = await listUserRoundtables(user.id);
    return NextResponse.json({ data: { roundtables } }, { status: 200 });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Failed to retrieve roundtables");
  }
}
