import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required" })
    .trim()
    .min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string({ error: "JWT_SECRET is required" })
    .min(32, "JWT_SECRET must be at least 32 characters"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Parse and validate required server environment variables on demand.
 */
export function getEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => {
        const key = issue.path.join(".") || "env";
        return `${key}: ${issue.message}`;
      })
      .join("; ");
    throw new Error(`Invalid server environment variables: ${details}`);
  }

  return parsed.data;
}
