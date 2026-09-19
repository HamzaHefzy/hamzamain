import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = await pingDatabase();
    return NextResponse.json({
      status: "ok",
      database,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        database: false,
        error: error instanceof Error ? error.message : "Database unavailable.",
      },
      { status: 503 },
    );
  }
}
