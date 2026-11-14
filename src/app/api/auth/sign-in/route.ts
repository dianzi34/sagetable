import { NextResponse } from "next/server";
import { signInSchema } from "@/lib/auth";
import { setSessionCookie } from "@/server/auth/cookie";
import {
  authServiceErrorResponse,
  jsonError,
  parseJsonBody,
} from "@/server/auth/routeHelper";
import { signInUser } from "@/server/services/authService";

/**
 * Verify email and password credentials and set an httpOnly JWT session cookie.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJsonBody(request, signInSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const { user, token } = await signInUser(parsed.data);
    const response = NextResponse.json({ data: { user } }, { status: 200 });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return (
      authServiceErrorResponse(error) ??
      jsonError(500, "INTERNAL_ERROR", "Unable to sign in")
    );
  }
}
