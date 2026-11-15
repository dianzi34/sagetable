export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { updateFigureSchema } from "@/lib/curator";
import { AuthError, requireRole } from "@/server/auth/session";
import { updateFigure } from "@/server/services/curatorService";

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

    const parsed = updateFigureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid figure updates",
          },
        },
        { status: 400 },
      );
    }

    const figure = await updateFigure(id, parsed.data);
    return NextResponse.json({ data: { figure } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update figure" } },
      { status: 500 },
    );
  }
}
