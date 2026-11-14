import "server-only";
import { SignJWT } from "jose";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { encodeJwtSecret, verifySessionJwt } from "@/lib/sessionToken";
import type { SessionUser } from "@/types/auth";

/**
 * Sign a short-claims HS256 JWT carrying user id, email, and role.
 */
export async function signSessionToken(user: SessionUser): Promise<string> {
  const { JWT_SECRET } = getEnv();
  const key = encodeJwtSecret(JWT_SECRET);

  return new SignJWT({
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

/**
 * Verify a session JWT using server environment configuration.
 */
export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  const { JWT_SECRET } = getEnv();
  return verifySessionJwt(token, JWT_SECRET);
}
