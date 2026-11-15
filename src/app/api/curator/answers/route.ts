export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createAnswerBankEntrySchema } from "@/lib/curator";
import { AuthError, requireRole } from "@/server/auth/session";
import {
  createAnswerBankEntry,
  listAnswerBankEntries,
} from "@/server/services/curatorService";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireRole(["curator", "admin"], request);

    const url = new URL(request.url);
    const figureId = url.searchParams.get("figureId") ?? undefined;
    const themeId = url.searchParams.get("themeId") ?? undefined;

    const answers = await listAnswerBankEntries({ figureId, themeId });
    return NextResponse.json({ data: { answers } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list answers" } },
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

    const parsed = createAnswerBankEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid answer data",
          },
        },
        { status: 400 },
      );
    }

    const answer = await createAnswerBankEntry(parsed.data);
    return NextResponse.json({ data: { answer } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create answer" } },
      { status: 500 },
    );
  }
}
