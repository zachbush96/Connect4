import { NextResponse } from "next/server";

export async function GET() {
  console.log('[GET /api/health] health check');
  return NextResponse.json({ message: "Good!" });
}