import { z } from "zod";
import type { AuthRole } from "@/types/auth";

export const AUTH_ROLES = ["user", "curator", "admin"] as const;

export const SESSION_COOKIE_NAME = "sagetable_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const authRoleSchema = z.enum(AUTH_ROLES);

const emailSchema = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address");

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Password is required" })
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    )
    .max(
      PASSWORD_MAX_LENGTH,
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    ),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .max(
      PASSWORD_MAX_LENGTH,
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

const ROLE_NORMALIZATION_MAP: Record<string, AuthRole> = {
  user: "user",
  USER: "user",
  curator: "curator",
  CURATOR: "curator",
  admin: "admin",
  ADMIN: "admin",
};

const PRISMA_ROLE_MAP: Record<AuthRole, "USER" | "CURATOR" | "ADMIN"> = {
  user: "USER",
  curator: "CURATOR",
  admin: "ADMIN",
};

/**
 * Normalize a Prisma Role enum or role string into lowercase AuthRole.
 */
export function normalizeRole(role: string): AuthRole {
  const normalized = ROLE_NORMALIZATION_MAP[role];
  if (!normalized) {
    throw new Error(`Unsupported auth role: ${role}`);
  }
  return normalized;
}

/**
 * Convert an AuthRole value to the uppercase Prisma Role enum string.
 */
export function toPrismaRole(role: AuthRole): "USER" | "CURATOR" | "ADMIN" {
  return PRISMA_ROLE_MAP[role];
}

/**
 * Restrict redirect targets to safe relative in-app paths.
 */
export function getSafeCallbackUrl(
  rawUrl: string | null | undefined,
  fallback = "/",
): string {
  if (typeof rawUrl !== "string") {
    return fallback;
  }

  const trimmed = rawUrl.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
