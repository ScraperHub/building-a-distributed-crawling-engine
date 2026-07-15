# Distributed Crawling Engine

A small, runnable distributed crawler built on two Crawlbase products:

- **Enterprise Crawler** - the managed distributed queue and worker pool. The
  engine pushes URLs into it and receives each crawled page on a webhook.
- **Crawling API** - the synchronous fetch path used for on-demand, single-page
  requests.

The engine owns only the local orchestration logic: seeding, URL dedup, depth
control, HTML parsing, recursive link expansion, and result storage. Crawlbase
handles queueing, concurrency, retries, proxy rotation, and anti-bot bypass.

## What it builds

Push one or more seed URLs into a Crawlbase Crawler. Crawlbase crawls each page
and POSTs the result to the engine's `/webhook`. The engine parses the page,
stores a JSON record, discovers outbound links, and pushes the new (deduped,
in-scope, within-depth) links back into the queue - a self-sustaining crawl.

## Prerequisites

- Node.js 18 or newer (uses the built-in `fetch`).
- A Crawlbase account and Normal token: https://crawlbase.com/signup?signup=blog
- A publicly reachable URL for the webhook. In local development, expose the
  server with a tunnel such as ngrok or cloudflared.

## Installation

```bash
cd final
npm install
cp .env.example .env   # then edit .env with your token and public callback URL
```

## Environment variables

| Variable           | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `CRAWLBASE_TOKEN`  | Normal token for the Crawler queue and the Crawling API.       |
| `CRAWLER_NAME`     | Name of the managed Crawler queue to create and push into.     |
| `CALLBACK_URL`     | Public URL Crawlbase POSTs results to (must end in `/webhook`).|
| `PORT`             | Local port the webhook server listens on.                      |
| `MAX_DEPTH`        | How far to follow discovered links (`0` = seeds only).         |
| `ALLOWED_DOMAINS`  | Comma-separated domains the crawl is allowed to expand into.   |
| `SEED_URLS`        | Comma-separated seed URLs for `npm run seed`.                  |

## Running the workflow

Run these from the `final/` directory. Start the tunnel first so `CALLBACK_URL`
points at your running server.

```bash
# 1. Create the crawler and bind it to your webhook (run once).
npm run setup

# 2. Start the webhook server (leave running).
npm start

# 3. Push the seed URLs into the queue.
npm run seed
```

Results are written to `final/results/<rid>.json`. As pages are crawled, the
server logs each webhook receipt and how many new links it queued.

### Expected output (high level)

- `npm run setup` prints the crawler name and bound callback URL.
- `npm run seed` prints one `Queued <url> -> rid <rid>` line per seed.
- `npm start` logs a `[rid] depth=... url=... queued=N new links` line each time
  Crawlbase delivers a crawled page.

## Troubleshooting

- **No webhook deliveries.** Confirm `CALLBACK_URL` is public and ends in
  `/webhook`, and that `npm run setup` reported success. Crawlbase pauses a
  crawler whose endpoint stops returning 2xx.
- **`Missing required environment variable: CRAWLBASE_TOKEN`.** Copy
  `.env.example` to `.env` and fill in your token.
- **Empty or blocked pages.** Some targets need JavaScript rendering; use a
  JavaScript token and pass rendering parameters (see the article's production
  notes).

## Article-to-code map

| Article section                         | Code path                                  |
| ---------------------------------------- | ------------------------------------------ |
| Step 1: Project setup and configuration | `final/src/config.js`, `final/.env.example`|
| Step 2: Create the crawler and push seeds| `final/src/setup-crawler.js`, `final/src/crawlbase-client.js`, `final/src/seed.js` |
| Step 3: Receive results at the webhook   | `final/src/server.js`, `final/src/store.js`|
| Step 4: Extract data and expand frontier | `final/src/extract.js`, `final/src/frontier.js` |

## Project layout

`final/` is the canonical, runnable project. `steps/` contains read-only
checkpoint copies of the file(s) introduced at each tutorial step, mirroring the
article's four implementation sections. The step files are duplicates of their
`final/src/` counterparts for study; run the project from `final/`.
