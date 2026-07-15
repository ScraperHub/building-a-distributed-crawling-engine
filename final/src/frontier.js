const config = require('./config');

// The frontier is the engine's memory of what it has already queued. It
// prevents the crawler from pushing the same page twice and enforces the
// crawl-depth and domain boundaries. In production this state belongs in a
// shared store such as Redis so multiple engine instances agree on what has
// been seen; an in-memory Set keeps the tutorial focused on the flow.
const seen = new Set();

function normalize(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function isAllowed(url) {
  if (config.allowedDomains.length === 0) {
    return true;
  }
  const host = new URL(url).hostname.toLowerCase();
  return config.allowedDomains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

// Returns true only the first time a crawlable URL is offered, and only
// when it clears the depth and domain gates. Marking it seen here makes the
// check idempotent: a duplicate discovery later returns false.
function shouldCrawl(rawUrl, depth) {
  if (depth > config.maxDepth) {
    return false;
  }
  const url = normalize(rawUrl);
  if (!url || !isAllowed(url) || seen.has(url)) {
    return false;
  }
  seen.add(url);
  return true;
}

module.exports = { shouldCrawl, normalize };
