import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth/cookie";

/**
 * Clear the active httpOnly JWT session cookie.
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json(
    { data: { signedOut: true } },
    { status: 200 },
  );
  clearSessionCookie(response);
  return response;
}
