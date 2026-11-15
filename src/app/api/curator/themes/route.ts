export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createThemeSchema } from "@/lib/curator";
import { AuthError, requireRole } from "@/server/auth/session";
import { createTheme, listThemes } from "@/server/services/curatorService";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole(["curator", "admin"], request);
    const themes = await listThemes();
    return NextResponse.json({ data: { themes } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list themes" } },
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

    const parsed = createThemeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid theme data",
          },
        },
        { status: 400 },
      );
    }

    const theme = await createTheme(parsed.data);
    return NextResponse.json({ data: { theme } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create theme" } },
      { status: 500 },
    );
  }
}
