import { jwtVerify } from "jose";
import { z } from "zod";
import { authRoleSchema } from "@/lib/auth";
import type { SessionUser } from "@/types/auth";

const MIN_SECRET_LENGTH = 32;

const sessionClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  role: authRoleSchema,
});

/**
 * Encode a secret string into a current-realm Uint8Array for jose across Node, Edge, and jsdom.
 */
export function encodeJwtSecret(secret: string): Uint8Array {
  return Uint8Array.from(new TextEncoder().encode(secret));
}

/**
 * Verify an HS256 session JWT in either Node.js or Edge runtimes.
 */
export async function verifySessionJwt(
  token: string,
  secret: string,
): Promise<SessionUser | null> {
  if (!token || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      encodeJwtSecret(secret),
      { algorithms: ["HS256"] },
    );

    const parsed = sessionClaimsSchema.safeParse(payload);
    if (!parsed.success) {
      return null;
    }

    return {
      id: parsed.data.sub,
      email: parsed.data.email,
      role: parsed.data.role,
    };
  } catch {
    return null;
  }
}
