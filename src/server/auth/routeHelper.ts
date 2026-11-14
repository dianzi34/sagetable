import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { AuthServiceError } from "@/server/services/authService";

/**
 * Return a uniform API JSON error payload with HTTP status.
 */
export function jsonError(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status },
  );
}

/**
 * Parse and validate a JSON request body with Zod, returning a 400 response on failure.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      error: jsonError(400, "INVALID_JSON", "Request body must be valid JSON"),
    };
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      error: jsonError(
        400,
        "VALIDATION_ERROR",
        firstIssue?.message ?? "Invalid request input",
      ),
    };
  }

  return { data: parsed.data };
}

/**
 * Convert an AuthServiceError into a standardized API error response, or return null.
 */
export function authServiceErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthServiceError)) {
    return null;
  }
  return jsonError(error.status, error.code, error.message);
}
