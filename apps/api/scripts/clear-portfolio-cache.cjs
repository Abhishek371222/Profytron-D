const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (!m) continue;
  const key = m[1].trim();
  let val = m[2].trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

async function main() {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!url) {
    console.log('No REDIS_URL — skip cache clear');
    return;
  }
  const redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
  await redis.connect();
  const keys = await redis.keys('analytics:portfolio:*');
  if (keys.length) {
    await redis.del(...keys);
    console.log('Cleared', keys.length, 'portfolio cache keys');
  } else {
    console.log('No portfolio cache keys');
  }
  await redis.quit();
}

main().catch((e) => {
  console.warn('cache clear skipped:', e.message);
  process.exit(0);
});
