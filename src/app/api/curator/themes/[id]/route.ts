export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { updateThemeSchema } from "@/lib/curator";
import { AuthError, requireRole } from "@/server/auth/session";
import { updateTheme } from "@/server/services/curatorService";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireRole(["curator", "admin"], request);
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }

    const parsed = updateThemeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid theme updates",
          },
        },
        { status: 400 },
      );
    }

    const theme = await updateTheme(id, parsed.data);
    return NextResponse.json({ data: { theme } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update theme" } },
      { status: 500 },
    );
  }
}
