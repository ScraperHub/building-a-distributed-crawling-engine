const { pushToCrawler } = require('./crawlbase-client');
const { shouldCrawl } = require('./frontier');

const SEED_URLS = (process.env.SEED_URLS || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

// Kicks off the crawl by pushing the seed URLs into the queue at depth 0.
// From here the engine is self-sustaining: each result the webhook receives
// discovers more links and pushes them back in.
async function seed() {
  if (SEED_URLS.length === 0) {
    throw new Error('No SEED_URLS provided. Set SEED_URLS in your .env file.');
  }

  for (const url of SEED_URLS) {
    if (!shouldCrawl(url, 0)) {
      console.log(`Skipped (filtered or duplicate): ${url}`);
      continue;
    }
    const rid = await pushToCrawler(url, 0);
    console.log(`Queued ${url} -> rid ${rid}`);
  }
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
