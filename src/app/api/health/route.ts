import { NextResponse } from "next/server";

interface HealthResponse {
  data: {
    status: "ok";
  };
}

/**
 * Lightweight liveness endpoint requiring no database or environment variables.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json({ data: { status: "ok" } }, { status: 200 });
}
