const { CrawlingAPI } = require('crawlbase');
const config = require('./config');

// One token authenticates both the synchronous Crawling API and the
// asynchronous Crawler queue - they are the same endpoint with different
// parameters, so a single client instance serves both paths.
const api = new CrawlingAPI({ token: config.crawlbaseToken });

// Synchronous path (Crawling API). Blocks until Crawlbase returns the
// fully rendered, anti-bot-resolved page. Use it for interactive or
// on-demand single-page fetches where you need the result inline.
async function fetchInline(url, options = {}) {
  const response = await api.get(url, options);
  return {
    pcStatus: response.pcStatus,
    originalStatus: response.originalStatus,
    url: response.url,
    body: response.body,
  };
}

// Asynchronous path (Crawler queue). Passing `callback=true` opts the
// request into queue delivery instead of running inline: Crawlbase
// enqueues the URL, crawls it in the background at the crawler's
// concurrency, and POSTs the result to the crawler's webhook. The push
// itself returns immediately with an `rid`. We ride the crawl depth back
// to our handler via a custom callback header.
async function pushToCrawler(url, depth) {
  const response = await api.get(url, {
    crawler: config.crawlerName,
    callback: true,
    callbackHeaders: `X-Crawl-Depth|${depth}`,
  });

  // Surface auth/quota errors instead of silently dropping the URL.
  if (response.statusCode !== 200) {
    throw new Error(`Crawler push failed (${response.statusCode}): ${response.body}`);
  }

  // The push response body is the small JSON envelope { "rid": "..." }, but
  // it is not served with a JSON content-type, so the SDK does not pre-parse
  // it into response.json. Fall back to parsing the body ourselves.
  const parsed = response.json || parseRid(response.body);
  return parsed && parsed.rid;
}

function parseRid(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

module.exports = { fetchInline, pushToCrawler };
