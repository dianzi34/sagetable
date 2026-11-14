import "server-only";
import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Hash a plaintext password with bcrypt before database persistence.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plaintext password candidate against a stored bcrypt hash.
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
