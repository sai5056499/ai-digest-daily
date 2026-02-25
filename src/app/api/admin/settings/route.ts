import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings";

function verifyAdmin(request: NextRequest): boolean {
  const secret = request.headers.get("x-admin-secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  await saveSettings(body.settings || body);
  const updated = await getSettings();
  return NextResponse.json({ settings: updated, saved: true });
}
