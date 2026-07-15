const config = require('./config');

// Creates (or re-confirms) the managed Crawler queue and binds it to our
// webhook. The Management API expects the token in the URL path, not the
// query string, so we call it directly rather than through the SDK.
// Providing `callback_url` puts the crawler in webhook-delivery mode.
async function createCrawler() {
  if (!config.callbackUrl) {
    throw new Error('CALLBACK_URL is required to create a webhook crawler');
  }

  const endpoint = `https://api.crawlbase.com/crawler/${config.crawlbaseToken}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: config.crawlerName,
      callback_url: config.callbackUrl,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to create crawler (${response.status}): ${text}`);
  }

  console.log(`Crawler "${config.crawlerName}" is bound to ${config.callbackUrl}`);
  console.log(text);
}

createCrawler().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
