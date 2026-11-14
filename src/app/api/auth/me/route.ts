import { NextResponse } from "next/server";
import { jsonError } from "@/server/auth/routeHelper";
import { authErrorResponse, requireUser } from "@/server/auth/session";

/**
 * Return the authenticated user extracted from the verified session JWT.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const user = await requireUser(request);
    return NextResponse.json({ data: { user } }, { status: 200 });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      jsonError(500, "INTERNAL_ERROR", "Unable to verify session")
    );
  }
}
