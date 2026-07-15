const express = require('express');
const config = require('./config');
const { extract } = require('./extract');
const { save } = require('./store');
const { shouldCrawl } = require('./frontier');
const { pushToCrawler } = require('./crawlbase-client');

const app = express();

// Crawlbase delivers the crawled page as the request body, and it arrives
// gzip-compressed (Content-Encoding: gzip). express.raw captures the body as
// a Buffer for any content type and transparently inflates the gzip for us,
// so req.body is already the decompressed page bytes.
app.use(express.raw({ type: '*/*', limit: '10mb' }));

app.post('/webhook', (req, res) => {
  // The monitoring bot probes this endpoint to detect outages. Acknowledge
  // it as a no-op - it carries no real crawl result to process. Crawlbase
  // expects a 2xx with an empty body, so end the response without content.
  if ((req.headers['user-agent'] || '').includes('Crawlbase Monitoring Bot')) {
    return res.status(200).end();
  }

  // Crawl metadata arrives in the request headers.
  const pcStatus = Number(req.headers['pc_status']);
  const rid = req.headers['rid'];
  const url = req.headers['url'];
  const depth = Number(req.headers['x-crawl-depth'] || 0);

  // Acknowledge fast: Crawlbase expects a 2xx (empty body) within ~200ms, and
  // a slow response counts as a failed delivery. Read the body, then process.
  const html = req.body.toString('utf8');
  res.status(200).end();

  // Skip anything that is not a clean crawl. Failed crawls were already
  // retried upstream and are not billed, so there is nothing to store.
  if (pcStatus !== 200 || !rid || !url) {
    return;
  }

  setImmediate(() => handleResult({ rid, url, depth, html }));
});

// Parse the page, persist the record, then expand the frontier by pushing
// newly discovered links back into the Crawler queue. This feedback loop is
// what makes the engine crawl recursively at scale.
async function handleResult({ rid, url, depth, html }) {
  const { record, links } = extract(html, url);
  save(rid, { rid, url, depth, crawledAt: new Date().toISOString(), ...record });

  let queued = 0;
  for (const link of links) {
    if (shouldCrawl(link, depth + 1)) {
      try {
        await pushToCrawler(link, depth + 1);
        queued += 1;
      } catch (error) {
        console.error(`Failed to queue ${link}: ${error.message}`);
      }
    }
  }
  console.log(`[${rid}] depth=${depth} url=${url} queued=${queued} new links`);
}

app.listen(config.port, () => {
  console.log(`Engine listening on port ${config.port} (webhook path: /webhook)`);
});
