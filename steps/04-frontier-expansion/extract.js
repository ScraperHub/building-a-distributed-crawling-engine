const cheerio = require('cheerio');

// Turns a crawled HTML page into two things the engine needs:
//   1. a small structured record to persist, and
//   2. the outbound links used to expand the frontier.
// Swap the record fields for whatever your use case extracts - this is the
// one place that is specific to the data you are collecting.
function extract(html, pageUrl) {
  const $ = cheerio.load(html);

  const record = {
    title: $('title').first().text().trim() || null,
    description: $('meta[name="description"]').attr('content') || null,
    headings: $('h1, h2')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 20),
  };

  // Resolve every href against the page URL so relative links become
  // absolute and crawlable. Non-HTTP links (mailto:, tel:, javascript:) are
  // dropped by the URL constructor throwing.
  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) {
      return;
    }
    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
        links.push(resolved.toString());
      }
    } catch {
      // Skip malformed hrefs.
    }
  });

  return { record, links };
}

module.exports = { extract };
