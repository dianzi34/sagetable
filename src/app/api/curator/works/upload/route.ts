export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { MAX_UPLOAD_SIZE_BYTES, uploadWorkSchema } from "@/lib/curator";
import { AuthError, requireRole } from "@/server/auth/session";
import { CuratorError, uploadWorkWithPassages } from "@/server/services/curatorService";

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

    const parsed = uploadWorkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid work upload data",
          },
        },
        { status: 400 },
      );
    }

    if (Buffer.byteLength(parsed.data.textContent, "utf8") > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: {
            code: "PAYLOAD_TOO_LARGE",
            message: "File size exceeds 200 KB limit",
          },
        },
        { status: 413 },
      );
    }

    const result = await uploadWorkWithPassages(parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof CuratorError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to upload work" } },
      { status: 500 },
    );
  }
}
