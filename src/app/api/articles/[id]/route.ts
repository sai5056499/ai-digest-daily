import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured, getArticleById } from "@/lib/database/firebase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { id } = await params;

  try {
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch article: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
