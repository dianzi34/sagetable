import "server-only";
import { normalizeRole } from "@/lib/auth";
import { prisma } from "@/server/db";
import type { SessionUser } from "@/types/auth";
import { signSessionToken } from "../auth/jwt";
import { hashPassword, verifyPassword } from "../auth/password";

// Constant-time fallback hash used when an email does not exist so timing matches real lookups.
const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/**
 * Domain error thrown by authentication service operations.
 */
export class AuthServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AuthServiceError";
    this.status = status;
    this.code = code;
  }
}

export interface AuthResult {
  user: SessionUser;
  token: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Register a new user account, hash its password, and mint a session JWT.
 */
export async function registerUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new AuthServiceError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "An account with this email already exists",
    );
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const user: SessionUser = {
      id: created.id,
      email: created.email,
      role: normalizeRole(created.role),
    };
    const token = await signSessionToken(user);

    return { user, token };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AuthServiceError(
        409,
        "EMAIL_ALREADY_EXISTS",
        "An account with this email already exists",
      );
    }
    throw error;
  }
}

/**
 * Verify user credentials and issue a signed session JWT.
 */
export async function signInUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  const record = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!record) {
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    throw new AuthServiceError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password",
    );
  }

  const valid = await verifyPassword(input.password, record.passwordHash);
  if (!valid) {
    throw new AuthServiceError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password",
    );
  }

  const user: SessionUser = {
    id: record.id,
    email: record.email,
    role: normalizeRole(record.role),
  };
  const token = await signSessionToken(user);

  return { user, token };
}
