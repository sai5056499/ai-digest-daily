# AI & Tech Daily — News Aggregator

An AI-powered tech news aggregator that collects articles from 20+ sources, processes them with Groq AI (Llama 3.3 70B), and delivers polished daily email digests. Fully automated, self-hosted, and runs on free-tier services.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Database Setup](#database-setup)
   - [Running Locally](#running-locally)
6. [How It Works](#how-it-works)
   - [Pipeline Flow](#pipeline-flow)
   - [Data Collection](#data-collection)
   - [AI Processing](#ai-processing)
   - [Deduplication](#deduplication)
   - [Newsletter Composition](#newsletter-composition)
   - [Email Delivery](#email-delivery)
   - [Telegram Integration](#telegram-integration)
   - [Breaking News Alerts](#breaking-news-alerts)
7. [API Reference](#api-reference)
   - [Public Endpoints](#public-endpoints)
   - [Admin Endpoints](#admin-endpoints)
   - [Cron Endpoints](#cron-endpoints)
8. [Web Pages](#web-pages)
9. [CLI Scripts](#cli-scripts)
10. [Data Models](#data-models)
11. [Configuration & Settings](#configuration--settings)
12. [Scheduling & Cron](#scheduling--cron)
13. [Deployment](#deployment)
14. [Adding & Customizing Sources](#adding--customizing-sources)
15. [Email Template System](#email-template-system)
16. [Security](#security)
17. [Scaling Guide](#scaling-guide)
18. [Known Limitations & Improvement Areas](#known-limitations--improvement-areas)
19. [License](#license)

---

## Features

- **20+ RSS/API Sources** — TechCrunch, The Verge, Hacker News, Reddit, arXiv, OpenAI Blog, Google AI Blog, and more
- **AI-Powered Processing** — Groq AI (Llama 3.3 70B) summarizes, categorizes, ranks (1–10), tags, and writes actionable "so what" insights for every article
- **Smart Deduplication** — URL normalization + Jaccard title-similarity removes duplicate stories from multiple outlets
- **Beautiful Email Digests** — Professional HTML email templates with dark/light theme support, rendered with Handlebars
- **Breaking News Alerts** — Instant emails for stories scoring 9+/10 in importance
- **Tool of the Day** — Highlights the best AI tool discovered each day
- **Newsletter Composition** — AI writes the intro, subject line, TL;DR, top story highlight, and weekly trend analysis
- **Personalization** — Subscribers receive filtered content based on their category preferences
- **Telegram Bot** — Optional Telegram channel/group notifications for top stories
- **Web Dashboard** — Browse all collected articles with category filters and pagination
- **Landing Page** — Subscribe page with live stats and Tool of the Day showcase
- **Admin Panel** — Manage subscribers, view email logs, trigger pipelines with live progress tracking
- **Dual Email Providers** — Gmail SMTP (primary) with Resend as fallback
- **Configurable Settings** — Runtime settings stored in Firestore, editable from the admin panel
- **Cron Scheduling** — Vercel cron for production, `node-cron` for local development

---

## Tech Stack

| Component     | Technology                        | Free Tier                        |
| ------------- | --------------------------------- | -------------------------------- |
| Framework     | Next.js 16 (App Router)           | —                                |
| Language      | TypeScript (strict mode)          | —                                |
| UI            | React 19 + Tailwind CSS 4         | —                                |
| Database      | Firebase Firestore                | 1 GiB storage, 50K reads/day     |
| AI            | Groq (Llama 3.3 70B Versatile)    | 30 req/min, 14.4K req/day        |
| Email (primary) | Gmail SMTP via Nodemailer       | 500 emails/day                   |
| Email (fallback) | Resend                         | 3,000 emails/month               |
| Telegram      | node-telegram-bot-api             | Free                             |
| Templating    | Handlebars                        | —                                |
| RSS Parsing   | rss-parser                        | —                                |
| Hosting       | Vercel                            | Free tier (serverless + cron)    |

**Total cost: $0/month** on free tiers (supports ~100 subscribers).

---

## Architecture Overview

```
                          ┌──────────────────────────┐
                          │     SCHEDULING LAYER     │
                          │  Vercel Cron / node-cron  │
                          │   / Admin manual trigger  │
                          └────────────┬─────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │     PIPELINE ENGINE      │
                          │  src/lib/pipeline/        │
                          │  runFullPipeline()        │
                          │  runCollectionPipeline()  │
                          └────────────┬─────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
┌─────────▼──────────┐   ┌────────────▼───────────┐   ┌───────────▼──────────┐
│  COLLECTION LAYER  │   │   AI PROCESSING LAYER  │   │    DELIVERY LAYER    │
│  RSS (16 feeds)    │   │   Groq Summarizer      │   │   Gmail / Resend     │
│  Hacker News API   │   │   Deduplicator         │   │   Handlebars Email   │
│  Reddit API        │   │   Newsletter Composer  │   │   Telegram Bot       │
└─────────┬──────────┘   └────────────┬───────────┘   └───────────┬──────────┘
          │                            │                            │
          └────────────────────────────▼────────────────────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │     DATABASE LAYER       │
                          │  Firebase Firestore      │
                          │  articles / subscribers  │
                          │  email_logs / settings   │
                          └──────────────────────────┘
                                       │
                          ┌────────────▼─────────────┐
                          │      WEB FRONTEND        │
                          │  Landing Page (/)        │
                          │  Dashboard (/dashboard)  │
                          │  Admin (/admin)          │
                          └──────────────────────────┘
```

---

## Project Structure

```
ai-tech-news-aggregator/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout, metadata, global styles
│   │   ├── page.tsx                      # Landing page (subscribe form, stats, Tool of the Day)
│   │   ├── globals.css                   # Global CSS / Tailwind directives
│   │   ├── error.tsx                     # Global error boundary
│   │   ├── not-found.tsx                 # Custom 404 page
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Article dashboard with filters & pagination
│   │   ├── admin/
│   │   │   └── page.tsx                  # Admin panel (subscribers, logs, pipeline)
│   │   ├── email-preview/
│   │   │   └── page.tsx                  # Email preview renderer
│   │   ├── sandbox/
│   │   │   ├── page.tsx                  # Sandbox page
│   │   │   └── ai-chat.tsx              # AI chat component
│   │   ├── test/
│   │   │   └── page.tsx                  # Test page
│   │   └── api/                          # API Routes (Next.js Route Handlers)
│   │       ├── subscribe/route.ts        # POST  — Subscribe to newsletter
│   │       ├── unsubscribe/route.ts      # GET   — Token-based unsubscribe
│   │       ├── articles/route.ts         # GET   — Paginated articles for dashboard
│   │       ├── stats/route.ts            # GET   — Aggregated statistics
│   │       ├── tool-of-the-day/route.ts  # GET   — Featured AI tool article
│   │       ├── email-preview/route.ts    # GET   — Rendered newsletter HTML
│   │       ├── ai-assistant/route.ts     # POST  — AI chat endpoint
│   │       ├── trigger-pipeline/route.ts # POST  — Manual pipeline trigger
│   │       ├── cron/
│   │       │   ├── collect/route.ts      # GET   — Cron: collection pipeline
│   │       │   └── send-daily/route.ts   # GET   — Cron: full pipeline
│   │       └── admin/
│   │           ├── subscribers/route.ts  # GET/PATCH/DELETE — Subscriber management
│   │           ├── settings/route.ts     # GET/POST — Site settings
│   │           ├── logs/route.ts         # GET   — Email send logs
│   │           ├── pipeline-status/route.ts # GET (SSE) — Live pipeline progress
│   │           └── test/route.ts         # Admin test endpoint
│   │
│   └── lib/                              # Core application logic
│       ├── types.ts                      # Shared TypeScript interfaces (BaseArticle)
│       ├── settings.ts                   # Runtime settings (Firestore-backed, cached)
│       │
│       ├── collectors/                   # Data ingestion
│       │   ├── sources.config.ts         # All RSS feeds, Reddit subreddits, HN config
│       │   ├── rssFeedCollector.ts       # RSS feed fetcher (parallel batches of 5)
│       │   └── apiCollector.ts           # Hacker News + Reddit API collectors
│       │
│       ├── ai/                           # AI intelligence layer
│       │   ├── summarizer.ts             # Per-article AI analysis via Groq
│       │   ├── deduplicator.ts           # URL + title dedup, recency filter, ranking
│       │   └── newsletterComposer.ts     # AI newsletter writer (intro, subject, trends)
│       │
│       ├── delivery/                     # Content distribution
│       │   ├── emailSender.ts            # Email sending (Gmail/Resend), breaking alerts
│       │   ├── telegramBot.ts            # Telegram channel posting
│       │   └── templates/
│       │       └── dailyDigest.ts        # Handlebars HTML email template (dark/light)
│       │
│       ├── database/
│       │   └── firebase.ts              # Firestore init, CRUD for articles/subscribers/logs
│       │
│       ├── pipeline/
│       │   ├── index.ts                 # Pipeline orchestration (full + collection)
│       │   └── progress.ts              # Real-time step tracking with pub/sub
│       │
│       └── utils/
│           └── logger.ts                # Timestamped logger (info/warn/error/debug)
│
├── scripts/                              # CLI tools
│   ├── run-pipeline.ts                   # Run full pipeline from terminal
│   ├── collect-only.ts                   # Collection-only pipeline
│   ├── cron.ts                           # Local cron scheduler
│   ├── setup-db.ts                       # Firebase connection tester
│   └── add-subscriber.ts                # Add subscriber by email
│
├── package.json                          # Dependencies and npm scripts
├── tsconfig.json                         # TypeScript config (strict, @/* path alias)
├── next.config.ts                        # Next.js config (Turbopack, server externals)
├── postcss.config.mjs                    # PostCSS with Tailwind
├── vercel.json                           # Vercel cron job definitions
├── .env.example                          # Environment variable template
└── .env                                  # Local environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** 9+
- A **Firebase** project with Firestore enabled
- A **Groq** API key (free at [console.groq.com](https://console.groq.com/keys))
- A **Gmail** account with App Password, or a **Resend** account (free tier)

### Installation

```bash
# Clone or download the project
cd "ai news"

# Install dependencies
npm install
```

### Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable                 | Required | Where to Get It                                                                                                        |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_PROJECT_ID`    | Yes      | [Firebase Console](https://console.firebase.google.com) → Project Settings                                             |
| `FIREBASE_CLIENT_EMAIL`  | Yes      | Project Settings → Service Accounts → Generate Key → `client_email` field in JSON                                      |
| `FIREBASE_PRIVATE_KEY`   | Yes      | Same JSON file → `private_key` field (wrap in double quotes, keep `\n` as literal)                                     |
| `GROQ_API_KEY`           | Yes      | [console.groq.com/keys](https://console.groq.com/keys) — free tier: 30 requests/min                                   |
| `GMAIL_USER`             | Yes*     | Your Gmail address (e.g. `you@gmail.com`)                                                                              |
| `GMAIL_APP_PASSWORD`     | Yes*     | Gmail → Security → 2-Step Verification → App Passwords → generate a 16-char password                                  |
| `RESEND_API_KEY`         | Alt*     | [resend.com](https://resend.com) → API Keys (alternative to Gmail)                                                     |
| `EMAIL_FROM`             | No       | Sender display name (e.g. `AI Tech Daily <you@gmail.com>`)                                                             |
| `TELEGRAM_BOT_TOKEN`     | No       | Talk to [@BotFather](https://t.me/BotFather) on Telegram → `/newbot`                                                  |
| `TELEGRAM_CHAT_ID`       | No       | Add bot to channel, send a message, then check `https://api.telegram.org/bot<TOKEN>/getUpdates`                        |
| `NEXT_PUBLIC_APP_URL`    | No       | Your app URL (default: `http://localhost:3000`)                                                                         |
| `ADMIN_SECRET`           | Yes      | Generate with `openssl rand -hex 32` — protects admin endpoints and pipeline triggers                                  |
| `CRON_SECRET`            | No       | Protects cron endpoints in production — set in Vercel environment variables                                             |

*You need **either** Gmail credentials (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) **or** a `RESEND_API_KEY`. Gmail is used as the primary provider when both are present.

### Database Setup

Firebase Firestore is schemaless — no SQL migrations needed. Collections are created automatically on first use.

1. Go to [Firebase Console](https://console.firebase.google.com) → Create a project
2. Navigate to **Firestore Database** → **Create database** → select "Start in test mode"
3. Go to **Project Settings** → **Service Accounts** → **Generate New Private Key**
4. Copy `project_id`, `client_email`, and `private_key` from the downloaded JSON into `.env`
5. Verify the connection:

```bash
npm run setup-db
```

The application uses four Firestore collections (created automatically):

| Collection    | Purpose                                       |
| ------------- | --------------------------------------------- |
| `articles`    | All collected and AI-processed articles        |
| `subscribers` | Newsletter subscribers and their preferences   |
| `email_logs`  | Record of every email sent (success or failure)|
| `settings`    | Runtime site configuration (single doc `site`) |

### Running Locally

```bash
# Start the Next.js dev server
npm run dev

# In a separate terminal, start the local cron scheduler (optional)
npm run cron
```

Visit:

| Page              | URL                                    |
| ----------------- | -------------------------------------- |
| Landing page      | http://localhost:3000                   |
| Dashboard         | http://localhost:3000/dashboard         |
| Admin panel       | http://localhost:3000/admin             |
| Email preview     | http://localhost:3000/email-preview     |

To run the pipeline manually:

```bash
# Full pipeline (collect → AI → compose → send)
npm run pipeline

# Collection only (no AI processing, no emails)
npm run collect

# Or trigger via API
curl -X POST http://localhost:3000/api/trigger-pipeline \
  -H "Content-Type: application/json" \
  -d '{"secret": "your-admin-secret", "mode": "full"}'
```

---

## How It Works

### Pipeline Flow

The system has two pipeline modes:

**Full Pipeline** (`runFullPipeline`) — 11 steps, ~2–5 minutes:

```
Step 1a  COLLECT RSS         Fetch 16 RSS feeds in parallel batches of 5
Step 1b  COLLECT HN          Fetch top 30 Hacker News stories via Firebase API
Step 1c  COLLECT REDDIT      Fetch hot posts from 4 subreddits
Step 2   DEDUPLICATE         URL normalization + Jaccard title similarity (>0.7)
Step 3   FILTER              Remove articles older than 24 hours
Step 4   AI PROCESS          Groq AI summarizes, categorizes, ranks top 30 articles
Step 4b  BREAKING ALERTS     Send immediate emails for stories scoring 9+/10
Step 5   SAVE                Store processed articles in Firestore
Step 6   COMPOSE             AI writes newsletter intro, subject, TL;DR, trends
Step 7   SEND EMAILS         Deliver to all active daily subscribers
Step 8   TELEGRAM            Post top 5 stories to Telegram channel
```

**Collection Pipeline** (`runCollectionPipeline`) — 4 steps, ~30 seconds:

```
Step 1   COLLECT RSS         Fetch all RSS feeds
Step 2   COLLECT HN          Fetch Hacker News stories
Step 3   DEDUPLICATE         Remove duplicates
Step 4   SAVE                Store raw articles in Firestore
```

### Data Collection

**RSS Feeds** (`src/lib/collectors/rssFeedCollector.ts`):
- Fetches from 16 sources organized into 4 groups: AI News (9), General Tech (5), Product Launches (1), Research (1)
- Uses `rss-parser` with a 15-second timeout per feed and a custom User-Agent header
- Feeds are fetched in parallel batches of 5 to avoid overwhelming sources
- For each article, extracts: title, link, description (capped at 1,000 chars), full content (capped at 5,000 chars), publication date, author, and image (from RSS enclosures, `<img>` tags, or `media:content`)
- High-priority sources get an initial `ai_importance` of 6; others get 5
- If a feed fails, it is silently skipped and the rest continue

**Hacker News** (`src/lib/collectors/apiCollector.ts`):
- Uses the free Hacker News Firebase API (no authentication needed)
- Fetches top story IDs, then fetches individual stories in parallel batches of 10
- Filters: only stories of type `"story"` with an external URL and score >= 50
- Dynamically sets priority (`"high"` if score > 200) and importance (up to 7 if score > 300)
- Timeout: 10 seconds for the top stories list, 5 seconds per individual story

**Reddit** (`src/lib/collectors/apiCollector.ts`):
- Monitors 4 subreddits: `r/artificial`, `r/MachineLearning`, `r/technology`, `r/singularity`
- Fetches 20 hot posts per subreddit via the public JSON API (no authentication)
- Filters out posts with score < 20
- For self-posts, links to the Reddit comments page; for link posts, uses the external URL
- Rate limited: 1-second delay between subreddit requests

### AI Processing

**Article Analysis** (`src/lib/ai/summarizer.ts`):

Each article is sent to Groq's Llama 3.3 70B model (temperature 0.3 for consistent factual output) with a structured prompt requesting:

| Field           | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `summary`       | 2–3 sentence factual summary                                      |
| `category`      | One of: `ai_breakthrough`, `ai_tool`, `ai_research`, `tech_news`, `startup`, `cybersecurity`, `gadgets`, `software`, `business`, `science` |
| `tags`          | 2–4 specific lowercase tags                                       |
| `importance`    | 1–10 scale (10 = groundbreaking, 1 = minor blog post)             |
| `sentiment`     | `positive`, `negative`, or `neutral`                              |
| `key_takeaway`  | One sentence actionable insight                                    |
| `so_what`       | 1–2 sentences on real-world impact and what readers should do      |

Processing details:
- Up to 30 articles per pipeline run (configurable)
- 2.5-second delay between requests (Groq free tier rate limit: ~30 req/min)
- Total AI processing time: ~75 seconds for 30 articles
- If AI analysis fails for an article, it falls back to using the raw description with default values
- The first 2,000 characters of article content are sent to the AI

### Deduplication

**Two-pass deduplication** (`src/lib/ai/deduplicator.ts`):

1. **URL dedup**: Normalizes URLs by stripping tracking parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `ref`, `source`, `via`, `fbclid`, `gclid`) and the protocol, then deduplicates. On collision, keeps the article from the higher-priority source.

2. **Title dedup**: Computes Jaccard similarity on word sets of article titles. If similarity > 0.7 (70% word overlap), articles are considered duplicates. Among duplicates, keeps the version with higher priority or higher `ai_importance`.

Typically reduces the total article count by 30–50%.

### Newsletter Composition

**AI-written newsletter** (`src/lib/ai/newsletterComposer.ts`):

After articles are processed, the composer:
1. Sorts all articles by `ai_importance` (descending)
2. Slices into sections: top 5 → "Top Stories", up to 7 AI-category → "AI & ML", up to 7 non-AI → "Tech"
3. Selects the "Tool of the Day" — the highest-importance article with `ai_category === "ai_tool"`
4. Sends the top 15 articles to Groq (temperature 0.7 for creative output) to generate:

| Field                | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `subject_line`       | Catchy email subject with one emoji, under 60 chars  |
| `intro`              | 2–3 sentence greeting about the day's big stories    |
| `top_story_highlight`| 2–3 sentences about the #1 story and why it matters  |
| `tldr`               | One punchy sentence summarizing the day in tech      |
| `weekly_trend`       | 2–3 sentences identifying patterns across stories    |

The AI is prompted with the tone: *"Sharp, witty, no fluff — like Benedict Evans meets Stratechery."*

If AI composition fails, a generic fallback template is used.

### Email Delivery

**Dual-provider email system** (`src/lib/delivery/emailSender.ts`):

Provider selection priority:
1. **Gmail SMTP** (via Nodemailer) — if `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
2. **Resend** — if `RESEND_API_KEY` is set

For each subscriber:
1. **Personalization**: Filters articles to match the subscriber's `categories` preference
2. **Rendering**: Uses the Handlebars template with the subscriber's email, issue number, unsubscribe token, and theme
3. **Sending**: Dispatches via the configured provider
4. **Logging**: Creates an `email_logs` record (success or failure)
5. **Update**: Increments `emails_received` and updates `last_email_sent` on the subscriber

Rate limiting: 500ms delay between email sends (~2 emails/second).

### Telegram Integration

**Telegram posting** (`src/lib/delivery/telegramBot.ts`):

- Sends top 5 articles (by importance) to the configured Telegram channel/chat
- Each message is formatted in MarkdownV2 with: emoji (fire/star/pin based on importance), bold title, summary, source, importance score, tags, and a "Read More" link
- 1.5-second delay between messages for rate limiting
- Telegram is entirely optional; if `TELEGRAM_BOT_TOKEN` is not set, this step is silently skipped

### Breaking News Alerts

Stories with `ai_importance >= 9` trigger immediate breaking news emails to all active subscribers. The alert email is a standalone dark-themed template with a red gradient accent bar and includes the article title, source, AI summary, and a "Why it matters" section.

---

## API Reference

### Public Endpoints

#### `POST /api/subscribe`
Subscribe a new email to the newsletter.

**Request body:**
```json
{
  "email": "user@example.com",
  "name": "Optional Name",
  "frequency": "daily",
  "categories": ["ai", "tech"]
}
```

**Responses:**
- `200` — Subscribed successfully (or reactivated)
- `400` — Invalid email
- `409` — Already subscribed
- `503` — Firebase not configured

#### `GET /api/unsubscribe?token=<uuid>`
Unsubscribe via token. Returns a styled HTML page confirming the unsubscription.

#### `GET /api/articles?page=1&limit=20&category=ai_tool`
Fetch paginated articles for the dashboard.

**Query parameters:**
| Param      | Default | Description                      |
| ---------- | ------- | -------------------------------- |
| `page`     | `1`     | Page number                      |
| `limit`    | `20`    | Articles per page                |
| `category` | —       | Filter by `ai_category`          |

**Response:**
```json
{
  "articles": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

#### `GET /api/stats`
Returns aggregated statistics.

**Response:**
```json
{
  "totalArticles": 1250,
  "activeSubscribers": 42,
  "emailsSentToday": 42,
  "sourcesCount": 18,
  "configured": true
}
```

#### `GET /api/tool-of-the-day`
Returns the highest-importance article with `ai_category === "ai_tool"` from the last 24 hours.

#### `GET /api/email-preview`
Returns the rendered HTML of the current daily digest for preview.

### Admin Endpoints

All admin endpoints require the `x-admin-secret` header matching `ADMIN_SECRET`.

#### `POST /api/trigger-pipeline`
Manually trigger the pipeline.

**Request body:**
```json
{
  "secret": "your-admin-secret",
  "mode": "full"
}
```

| `mode`    | Behavior                                          | Max Duration |
| --------- | ------------------------------------------------- | ------------ |
| `"full"`  | Collect → AI → compose → send emails → Telegram  | 300s (5 min) |
| `"collect"` | Collect → dedup → save (no AI, no email)        | 300s (5 min) |

#### `GET /api/admin/subscribers`
List all subscribers (up to 200, sorted by newest first).

#### `PATCH /api/admin/subscribers`
Toggle a subscriber's active status.

```json
{ "id": "subscriber-doc-id", "is_active": false }
```

#### `DELETE /api/admin/subscribers`
Permanently delete a subscriber.

```json
{ "id": "subscriber-doc-id" }
```

#### `GET /api/admin/logs`
Fetch the 50 most recent email logs, enriched with subscriber email addresses.

#### `GET/POST /api/admin/settings`
Read or update site settings (stored in Firestore `settings/site`).

#### `GET /api/admin/pipeline-status?secret=<admin-secret>`
Server-Sent Events (SSE) endpoint streaming real-time pipeline progress. Used by the admin panel for live step-by-step updates.

### Cron Endpoints

Protected by `CRON_SECRET` via `Authorization: Bearer <token>` header.

#### `GET /api/cron/collect`
Runs the collection-only pipeline. Max execution time: 120 seconds.

#### `GET /api/cron/send-daily`
Runs a fresh collection followed by the full pipeline. Max execution time: 300 seconds (5 minutes).

---

## Web Pages

### Landing Page (`/`)
- Hero section with animated subscribe form
- Live stats bar (articles scanned, sources, readers) fetched from `/api/stats`
- "Tool of the Day" card fetched from `/api/tool-of-the-day`
- "How it works" explainer (Collect → Deduplicate → Analyze → Deliver)
- Source list showing 12 source names as interactive pills
- Footer with dashboard link

### Dashboard (`/dashboard`)
- Sticky header with blur backdrop
- Stats grid: articles, sources, readers, emails sent today
- Category filter buttons: All, Breakthroughs, Tools, Research, Tech, Startups, Software, Business
- Article list with:
  - Color-coded importance badges (8+ = black, 6+ = dark, else light)
  - AI summaries
  - Source name and tags
  - Relative timestamps
- Pagination controls

### Admin Panel (`/admin`)
- Secret-based authentication gate (checks `ADMIN_SECRET` via API)
- Session persisted in `sessionStorage`
- Three tabs:
  - **Subscribers** — Table with email, join date, emails received, active/paused toggle, delete button
  - **Logs** — Table with recipient, subject, sent/failed status, timestamp
  - **Pipeline** — Two trigger buttons ("collect only" / "full pipeline"), live progress tracker using SSE with per-step status icons, progress bar, elapsed timer, duration per step, and collapsible raw JSON output

### Email Preview (`/email-preview`)
- Renders the current daily digest email using the Handlebars template
- Useful for testing layout changes without sending actual emails

---

## CLI Scripts

| Command                                  | Script                         | Description                              |
| ---------------------------------------- | ------------------------------ | ---------------------------------------- |
| `npm run dev`                            | `next dev`                     | Start Next.js development server         |
| `npm run build`                          | `next build`                   | Production build                         |
| `npm run start`                          | `next start`                   | Start production server                  |
| `npm run lint`                           | `next lint`                    | Run ESLint                               |
| `npm run pipeline`                       | `scripts/run-pipeline.ts`     | Run the full pipeline (collect → AI → send) |
| `npm run collect`                        | `scripts/collect-only.ts`     | Collection only (no AI, no emails)       |
| `npm run cron`                           | `scripts/cron.ts`             | Start local cron scheduler               |
| `npm run setup-db`                       | `scripts/setup-db.ts`         | Test Firebase connection                 |
| `npx tsx scripts/add-subscriber.ts EMAIL`| `scripts/add-subscriber.ts`   | Manually add a subscriber                |

---

## Data Models

### Article

Stored in the `articles` Firestore collection:

| Field              | Type            | Description                                           |
| ------------------ | --------------- | ----------------------------------------------------- |
| `title`            | `string`        | Article headline                                      |
| `link`             | `string`        | Original article URL                                  |
| `description`      | `string`        | Plain text snippet (up to 1,000 chars)                |
| `content`          | `string`        | Full/partial content (up to 5,000 chars)              |
| `published_at`     | `string` (ISO)  | Publication timestamp                                 |
| `source`           | `string`        | Source name (e.g. "TechCrunch AI", "Hacker News")     |
| `category`         | `string`        | Source-defined category (e.g. "ai", "tech")           |
| `priority`         | `string`        | Source priority: `"high"`, `"medium"`, `"low"`        |
| `guid`             | `string`        | Unique identifier from the source                     |
| `author`           | `string`        | Author name                                           |
| `image_url`        | `string\|null`  | Extracted image URL                                   |
| `collected_at`     | `string` (ISO)  | When the article was collected                        |
| `processed`        | `boolean`       | Whether AI processing has been applied                |
| `ai_summary`       | `string\|null`  | AI-generated 2–3 sentence summary                    |
| `ai_category`      | `string\|null`  | AI-assigned category (e.g. `"ai_breakthrough"`)      |
| `ai_tags`          | `string[]\|null`| AI-generated tags (2–4 lowercase tags)               |
| `ai_importance`    | `number`        | AI-assigned importance score (1–10)                   |
| `ai_sentiment`     | `string\|null`  | `"positive"`, `"negative"`, or `"neutral"`           |
| `key_takeaway`     | `string\|null`  | One sentence actionable insight                       |
| `so_what`          | `string\|null`  | Why this matters and what to do about it              |
| `included_in_email`| `boolean`       | Whether included in a sent digest                     |
| `created_at`       | `string` (ISO)  | Firestore document creation time                      |
| `updated_at`       | `string` (ISO)  | Last update time                                      |

### Subscriber

Stored in the `subscribers` Firestore collection:

| Field               | Type            | Description                                        |
| ------------------- | --------------- | -------------------------------------------------- |
| `email`             | `string`        | Subscriber email (lowercase, trimmed)              |
| `name`              | `string\|null`  | Optional display name                              |
| `is_active`         | `boolean`       | Whether actively receiving emails                  |
| `frequency`         | `string`        | `"daily"` or `"weekly"`                            |
| `categories`        | `string[]`      | Preferred categories for personalization           |
| `preferred_time`    | `string`        | Preferred delivery time (e.g. `"08:00:00"`)        |
| `timezone`          | `string`        | Subscriber timezone (default: `"UTC"`)             |
| `confirmed`         | `boolean`       | Whether email is confirmed                         |
| `confirm_token`     | `string`        | UUID for email confirmation                        |
| `unsubscribe_token` | `string`        | UUID for one-click unsubscribe                     |
| `last_email_sent`   | `string\|null`  | Timestamp of last email sent to this subscriber    |
| `emails_received`   | `number`        | Total emails received (used for issue numbering)   |
| `created_at`        | `string` (ISO)  | When the subscriber was added                      |

### Email Log

Stored in the `email_logs` Firestore collection:

| Field            | Type     | Description                            |
| ---------------- | -------- | -------------------------------------- |
| `subscriber_id`  | `string` | Reference to the subscriber document   |
| `subject`        | `string` | Email subject line                     |
| `articles_count` | `number` | Number of articles included            |
| `sent_at`        | `string` | ISO timestamp                          |
| `opened`         | `boolean`| Whether the email was opened           |
| `clicked`        | `boolean`| Whether any link was clicked           |
| `status`         | `string` | `"sent"` or `"failed"`                |

---

## Configuration & Settings

Runtime settings are stored in Firestore (`settings/site` document) and cached in memory. They fall back to defaults if Firestore is unavailable.

| Setting                  | Default              | Description                                        |
| ------------------------ | -------------------- | -------------------------------------------------- |
| `headline`               | `"Your morning brief,"` | Landing page headline                           |
| `headlineMuted`          | `"written by AI."`   | Landing page headline (muted portion)              |
| `subtitle`               | *(long string)*      | Landing page subtitle                              |
| `newsletterName`         | `"AI & Tech Daily"`  | Newsletter brand name                              |
| `newsletterFromName`     | `"AI Tech Daily"`    | Email sender display name                          |
| `telegramEnabled`        | `false`              | Whether Telegram posting is enabled                |
| `emailEnabled`           | `true`               | Whether email sending is enabled                   |
| `aiProvider`             | `"groq"`             | AI provider name                                   |
| `aiModel`                | `"llama-3.3-70b-versatile"` | AI model identifier                         |
| `rssEnabled`             | `true`               | Whether RSS collection is enabled                  |
| `hnEnabled`              | `true`               | Whether Hacker News collection is enabled          |
| `redditEnabled`          | `true`               | Whether Reddit collection is enabled               |
| `collectIntervalHours`   | `2`                  | Hours between collection runs (local cron)         |
| `sendHourUtc`            | `8`                  | Hour (UTC) to send the daily digest (local cron)   |
| `maxArticlesPerDigest`   | `30`                 | Maximum articles to process per pipeline run       |
| `showTopStories`         | `true`               | Show "Top Stories" section in email                 |
| `showAiNews`             | `true`               | Show "AI & ML" section in email                    |
| `showTechNews`           | `true`               | Show "Tech" section in email                       |
| `showQuickLinks`         | `true`               | Show "Quick Links" section in email                |
| `showToolOfTheDay`       | `true`               | Show "Tool of the Day" in email                    |

Settings can be modified via `POST /api/admin/settings` or directly in Firestore.

---

## Scheduling & Cron

### Production (Vercel)

Defined in `vercel.json`:

| Cron Job             | Schedule         | Endpoint                 | Behavior                                           |
| -------------------- | ---------------- | ------------------------ | -------------------------------------------------- |
| Article Collection   | Daily at 14:00 UTC | `/api/cron/collect`    | Runs `runCollectionPipeline()` — collect + dedup + save |
| Daily Digest         | Daily at 02:30 UTC | `/api/cron/send-daily` | Runs collection, then `runFullPipeline()` — full end-to-end |

Both endpoints are protected by the `CRON_SECRET` environment variable via bearer token authentication.

### Local Development

Run `npm run cron` to start the local scheduler (`scripts/cron.ts`):
- **Collection**: Runs every 2 hours (configurable via `collectIntervalHours` setting)
- **Daily Digest**: Runs once daily at the configured `sendHourUtc`

### Manual Trigger

- **CLI**: `npm run pipeline` or `npm run collect`
- **API**: `POST /api/trigger-pipeline` with admin secret
- **Admin UI**: Click "collect only" or "full pipeline" in the admin panel's Pipeline tab

---

## Deployment

### Vercel (Recommended)

1. Push code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add all environment variables from `.env` to the Vercel project settings
4. Deploy — cron jobs are auto-configured via `vercel.json`

Important Vercel settings:
- The `send-daily` cron endpoint has `maxDuration: 300` (5 minutes) to accommodate the full pipeline
- The `collect` cron endpoint has `maxDuration: 120` (2 minutes)
- `firebase-admin` is configured as a server external package in `next.config.ts`

### Other Platforms

The app is a standard Next.js application and can be deployed anywhere that supports Node.js 18+. You will need to set up an external cron service (e.g., [cron-job.org](https://cron-job.org), [Upstash](https://upstash.com), or a system crontab) to call the cron endpoints on schedule.

---

## Adding & Customizing Sources

### Adding RSS Feeds

Edit `src/lib/collectors/sources.config.ts`:

```typescript
// Add to the appropriate group in RSS_SOURCES
{
  name: "Your Source Name",
  url: "https://example.com/feed.xml",
  category: "ai",           // ai, tech, products, ai_research, ai_tools
  priority: "medium",       // high, medium, low
}
```

Priority affects:
- Initial `ai_importance` score (high = 6, medium/low = 5)
- Tie-breaking during deduplication (higher priority wins)
- Hacker News score thresholds for priority assignment

### Adding Reddit Subreddits

```typescript
// In sources.config.ts
export const REDDIT_SUBREDDITS = [
  "artificial",
  "MachineLearning",
  "technology",
  "singularity",
  "your_new_subreddit",   // add here
];
```

### Adjusting Hacker News Settings

```typescript
// In sources.config.ts
export const HN_CONFIG = {
  topStoriesLimit: 30,     // how many top stories to fetch
  minScore: 50,            // minimum score threshold
};
```

---

## Email Template System

The email template (`src/lib/delivery/templates/dailyDigest.ts`) uses **Handlebars** for rendering and supports two themes.

### Themes

| Theme  | Background   | Text          | Accent         |
| ------ | ------------ | ------------- | -------------- |
| Dark   | `#09090b`    | `#fafafa`     | Indigo/Violet  |
| Light  | `#fafafa`    | `#0a0a0a`     | Indigo/Violet  |

Each theme defines 24 color variables covering backgrounds, text shades, borders, cards, accents, and tag colors.

### Email Sections

1. **Accent gradient line** — Top/bottom decoration
2. **Header** — Brand name, issue number badge, date, headline
3. **Stats row** — Articles scanned, sources count, AI stories count
4. **Intro** — AI-written greeting
5. **TL;DR block** — One-sentence summary with accent border
6. **Tool of the Day** — Featured AI tool (if enabled in settings)
7. **Trending** — AI-identified weekly trends (green accent border)
8. **Top Stories** — Featured article cards with importance bars, "Why it matters" blocks, tags
9. **AI & ML** — AI-category articles
10. **Tech** — Non-AI tech articles
11. **Quick Links** — Compact list of remaining articles
12. **Footer** — Preferences link, unsubscribe link, brand

### Custom Handlebars Helpers

| Helper           | Usage                       | Output                                      |
| ---------------- | --------------------------- | -------------------------------------------- |
| `timeAgo`        | `{{timeAgo published_at}}`  | Relative time (e.g., "3h ago", "1d ago")     |
| `importanceBar`  | `{{{importanceBar ai_importance}}}` | Visual progress bar with score      |
| `formatTags`     | `{{{formatTags ai_tags}}}`  | Styled tag pills with `#` prefix             |
| `gte`            | `{{#if (gte ai_importance 9)}}` | Comparison helper for breaking badges    |

---

## Security

| Mechanism             | Protects                              | Implementation                                     |
| --------------------- | ------------------------------------- | -------------------------------------------------- |
| `ADMIN_SECRET`        | Pipeline trigger, admin APIs          | Checked in request body or `x-admin-secret` header |
| `CRON_SECRET`         | Cron endpoints                        | Checked in `Authorization: Bearer` header          |
| Unsubscribe tokens    | Unsubscribe links                     | Random UUIDs per subscriber, validated against Firestore |
| Email validation      | Subscribe endpoint                    | Checks for `@` symbol, max 320 chars, lowercased   |
| Firebase env check    | All database operations               | `isFirebaseConfigured()` guard returns 503 if missing |
| Session storage       | Admin panel authentication            | Secret stored in `sessionStorage` (browser-only)   |
| Dynamic imports       | Pipeline code loading                 | Pipeline modules imported only when needed          |

---

## Scaling Guide

| Subscribers   | Changes Needed                                                    | Estimated Cost |
| ------------- | ----------------------------------------------------------------- | -------------- |
| 0–100         | Free tier works perfectly                                         | $0/month       |
| 100–500       | Switch to Gmail SMTP (500/day) or upgrade Resend ($20/mo)         | $0–20/month    |
| 500–1,000     | Upgrade Resend; consider Groq paid tier for faster AI processing  | $20–40/month   |
| 1,000–5,000   | Resend Pro + Firebase Blaze plan                                  | $50–100/month  |
| 5,000+        | Dedicated email service (SendGrid/Mailgun), paid AI, caching      | $150+/month    |

---

## Known Limitations & Improvement Areas

### Collection

- **Feed health monitoring**: No automated checks for stale or broken RSS feed URLs
- **Full-text extraction**: RSS content is truncated; integrating a readability parser would improve AI summaries
- **Reddit rate limiting**: Uses unauthenticated API, which is heavily rate-limited; OAuth would increase limits

### AI Processing

- **Sequential processing**: Articles are analyzed one at a time with 2.5s delays; batching or higher-tier API access would speed this up
- **Settings not wired**: `aiProvider` and `aiModel` in settings are not read by the summarizer or composer — they hardcode Groq and Llama 3.3 70B
- **`maxArticlesPerDigest` ignored**: The pipeline hardcodes `slice(0, 30)` instead of reading the setting

### Delivery

- **No open/click tracking**: `EmailLog` has `opened` and `clicked` fields but no tracking pixel or link wrapping is implemented
- **Weekly digest not implemented**: Subscriber model supports `frequency: "weekly"` but no weekly aggregation logic exists
- **No confirmation email**: New subscribers are auto-confirmed without a double opt-in email
- **Breaking alert opt-out**: No way for subscribers to opt out of breaking alerts specifically

### Frontend

- **No article search**: Dashboard has category filters but no full-text search
- **No dark mode**: Website is light-only despite the email template supporting both themes
- **Admin settings UI**: The API route for settings exists but the admin panel lacks a settings tab

### Database

- **One-by-one saves**: `saveArticlesBatch()` saves articles individually with per-article duplicate checks; Firestore batch writes would be significantly faster
- **No data retention policy**: Articles accumulate indefinitely with no cleanup or archival
- **Offset-based pagination**: Uses Firestore `offset()` which degrades at scale; cursor-based pagination would be better

### DevOps

- **No test suite**: Zero test files in the project
- **No CI/CD pipeline**: No GitHub Actions or automated checks
- **No startup env validation**: Missing variables cause runtime errors instead of clear startup failures
- **In-memory progress tracking**: Pipeline progress uses a module-level variable — on Vercel serverless, the SSE stream and pipeline may run in different function instances

---

## License

MIT
