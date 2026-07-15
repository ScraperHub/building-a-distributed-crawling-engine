const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '..', 'results');

// Persist one crawl result as JSON, keyed by its request id (rid). Keying on
// rid keeps the store idempotent: Crawlbase can deliver the same result more
// than once on retry, and re-saving simply overwrites the same file instead
// of creating duplicates. Replace this with your database write in production.
function save(rid, data) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${rid}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

module.exports = { save };
