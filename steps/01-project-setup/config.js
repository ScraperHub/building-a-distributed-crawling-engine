require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config = {
  crawlbaseToken: required('CRAWLBASE_TOKEN'),
  crawlerName: process.env.CRAWLER_NAME || 'distributed-engine',
  callbackUrl: process.env.CALLBACK_URL || '',
  port: Number(process.env.PORT || 3000),
  maxDepth: Number(process.env.MAX_DEPTH || 2),
  allowedDomains: (process.env.ALLOWED_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),
};

module.exports = config;
