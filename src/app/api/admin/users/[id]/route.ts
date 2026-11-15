export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { updateRoleSchema } from "@/lib/admin";
import { AuthError, requireRole } from "@/server/auth/session";
import { updateUserRole } from "@/server/services/adminService";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireRole("admin", request);
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

    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 400 },
      );
    }

    try {
      const updatedUser = await updateUserRole({
        actorId: session.id,
        targetUserId: id,
        newRole: parsed.data.role,
      });

      return NextResponse.json({ data: { user: updatedUser } });
    } catch (serviceError) {
      if (
        serviceError instanceof Error &&
        serviceError.message.includes("User not found")
      ) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 },
        );
      }
      throw serviceError;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update user role" } },
      { status: 500 },
    );
  }
}
