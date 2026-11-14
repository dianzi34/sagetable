import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth";
import { setSessionCookie } from "@/server/auth/cookie";
import {
  authServiceErrorResponse,
  jsonError,
  parseJsonBody,
} from "@/server/auth/routeHelper";
import { registerUser } from "@/server/services/authService";

/**
 * Register a new user account, hash password, and set an httpOnly JWT cookie.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJsonBody(request, registerSchema);
  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const { user, token } = await registerUser(parsed.data);
    const response = NextResponse.json({ data: { user } }, { status: 201 });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return (
      authServiceErrorResponse(error) ??
      jsonError(500, "INTERNAL_ERROR", "Unable to create account")
    );
  }
}
