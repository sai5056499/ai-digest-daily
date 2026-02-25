import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured, getRecentEmailLogs } from "@/lib/database/firebase";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ logs: [] });
  }

  try {
    const logs = await getRecentEmailLogs(50);
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
