export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createFigureSchema } from "@/lib/curator";
import { AuthError, requireRole } from "@/server/auth/session";
import { createFigure, listFigures } from "@/server/services/curatorService";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole(["curator", "admin"], request);
    const figures = await listFigures();
    return NextResponse.json({ data: { figures } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list figures" } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireRole(["curator", "admin"], request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
        { status: 400 },
      );
    }

    const parsed = createFigureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid figure data",
          },
        },
        { status: 400 },
      );
    }

    const figure = await createFigure(parsed.data);
    return NextResponse.json({ data: { figure } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create figure" } },
      { status: 500 },
    );
  }
}
