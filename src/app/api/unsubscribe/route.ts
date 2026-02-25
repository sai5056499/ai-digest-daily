import { NextRequest, NextResponse } from "next/server";
import { isFirebaseConfigured, findSubscriberByUnsubToken, updateSubscriber } from "@/lib/database/firebase";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(
      renderPage("Invalid Link", "The unsubscribe link is invalid or expired."),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  if (!isFirebaseConfigured()) {
    return new NextResponse(
      renderPage("Unavailable", "Service is being set up. Please try again later."),
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const subscriber = await findSubscriberByUnsubToken(token);

    if (!subscriber) {
      return new NextResponse(
        renderPage("Not Found", "This unsubscribe link is not valid."),
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    await updateSubscriber(subscriber.id!, { is_active: false });

    return new NextResponse(
      renderPage(
        "Unsubscribed",
        "You've been successfully unsubscribed from AI & Tech Daily. We're sorry to see you go!"
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(
      renderPage("Error", "Something went wrong. Please try again later."),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

function renderPage(title: string, message: string): string {
  const emoji = title === "Unsubscribed" ? "👋" : "⚠️";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — AI & Tech Daily</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);color:#fff}
    .card{text-align:center;padding:48px;background:rgba(255,255,255,.05);border-radius:16px;border:1px solid rgba(255,255,255,.1);max-width:480px;backdrop-filter:blur(10px)}
    h1{font-size:2rem;margin-bottom:16px}
    p{font-size:1.1rem;opacity:.85;line-height:1.6}
    a{display:inline-block;margin-top:24px;padding:12px 24px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:8px;font-weight:600}
    a:hover{opacity:.9}
  </style>
</head>
<body>
  <div class="card">
    <h1>${emoji} ${title}</h1>
    <p>${message}</p>
    <a href="/">← Back to Home</a>
  </div>
</body>
</html>`;
}
