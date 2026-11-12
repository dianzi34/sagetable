import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import type { AuthRole, SessionUser } from "@/types/auth";
import { verifySessionToken } from "./jwt";

/**
 * Domain error thrown by server authentication and ownership checks.
 */
export class AuthError extends Error {
  readonly status: 401 | 403 | 404;
  readonly code: string;

  constructor(status: 401 | 403 | 404, code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

function readCookieFromHeader(
  cookieHeader: string | null,
  cookieName: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex <= 0) {
      continue;
    }
    const name = part.slice(0, eqIndex).trim();
    if (name === cookieName) {
      const rawValue = part.slice(eqIndex + 1).trim();
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }

  return undefined;
}

async function extractSessionToken(request?: Request): Promise<string | undefined> {
  if (request) {
    return readCookieFromHeader(
      request.headers.get("cookie"),
      SESSION_COOKIE_NAME,
    );
  }

  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Read and verify the current signed-in user, returning null when absent or invalid.
 */
export async function getOptionalUser(
  request?: Request,
): Promise<SessionUser | null> {
  const token = await extractSessionToken(request);
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

/**
 * Require a valid authenticated user or throw a 401 AuthError.
 */
export async function requireUser(request?: Request): Promise<SessionUser> {
  const user = await getOptionalUser(request);
  if (!user) {
    throw new AuthError(401, "UNAUTHORIZED", "Authentication required");
  }
  return user;
}

/**
 * Require an authenticated user holding one of the allowed roles, or throw 401/403.
 */
export async function requireRole(
  allowedRoles: AuthRole | readonly AuthRole[],
  request?: Request,
): Promise<SessionUser> {
  const user = await requireUser(request);
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!allowed.includes(user.role)) {
    throw new AuthError(403, "FORBIDDEN", "Insufficient permissions");
  }

  return user;
}

/**
 * Assert that a resource exists and belongs to the signed-in actor, failing with 404.
 */
export function assertResourceOwnership<T extends { userId: string }>(
  resource: T | null | undefined,
  actorUserId: string,
  resourceName = "Resource",
): T {
  if (!resource || resource.userId !== actorUserId) {
    throw new AuthError(404, "NOT_FOUND", `${resourceName} not found`);
  }
  return resource;
}

/**
 * Convert an AuthError into a uniform JSON error response, or return null otherwise.
 */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthError)) {
    return null;
  }

  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.status },
  );
}
