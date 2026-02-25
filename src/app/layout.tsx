import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI & Tech Daily — Your Personal AI News Digest",
  description:
    "Get the most important AI & tech news delivered to your inbox every morning. Curated by AI from 20+ sources, summarized so you can read it in 5 minutes.",
  keywords: [
    "AI news",
    "tech news",
    "artificial intelligence",
    "newsletter",
    "daily digest",
  ],
  openGraph: {
    title: "AI & Tech Daily",
    description: "AI-powered tech news digest, delivered daily.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
