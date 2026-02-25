import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured, getArticlesForDashboard } from "@/lib/database/firebase";

export async function GET(request: NextRequest) {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({
      articles: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      configured: false,
    });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    const { articles, total } = await getArticlesForDashboard({
      category,
      limit,
      page,
    });

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Articles API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles.", articles: [], total: 0 },
      { status: 500 }
    );
  }
}
