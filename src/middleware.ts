import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifySessionJwt } from "@/lib/sessionToken";

/**
 * Redirect unauthenticated requests on protected pages to /sign-in on Edge runtime.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.JWT_SECRET ?? "";
  const user = token ? await verifySessionJwt(token, secret) : null;

  if (!user) {
    const signInUrl = new URL("/sign-in", request.url);
    const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/themes/:path*",
    "/roundtable/:path+",
    "/roundtables/:path*",
    "/notebook/:path*",
    "/curator/:path*",
    "/admin/:path*",
  ],
};
