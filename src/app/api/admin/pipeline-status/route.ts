import { NextRequest } from "next/server";
import { getProgress, subscribe } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately
      const current = getProgress();
      if (current) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(current)}\n\n`)
        );
      } else {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: "idle" })}\n\n`)
        );
      }

      // Subscribe to updates
      const unsubscribe = subscribe((progress) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
          );

          // Close stream when pipeline finishes
          if (progress.status === "done" || progress.status === "error") {
            setTimeout(() => {
              try {
                controller.close();
              } catch {
                // already closed
              }
            }, 500);
          }
        } catch {
          unsubscribe();
        }
      });

      // Clean up if client disconnects
      request.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
