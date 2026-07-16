import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, 'firebase-messaging-sw.template.js');
const outputPath = join(__dirname, '..', 'public', 'firebase-messaging-sw.js');
const webRoot = join(__dirname, '..');

// Plain `node` scripts (unlike `next dev`/`next build`) don't auto-load
// .env.local — that loading is internal to the Next.js CLI. Load it here too,
// mirroring Next's precedence (.env.local overrides .env), without clobbering
// real env vars already set by the platform (Docker/Vercel/CI).
function loadEnvFile(filename) {
  const filePath = join(webRoot, filename);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

// Firebase's web apiKey/authDomain/projectId etc. are not secrets — they are
// meant to ship in public client code (access is governed by Firebase Security
// Rules / App Check, not by hiding these values). Baking them into this static
// file is the standard, expected way to configure an FCM service worker.
const REPLACEMENTS = {
  __NEXT_PUBLIC_FIREBASE_API_KEY__: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  __NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN__: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  __NEXT_PUBLIC_FIREBASE_PROJECT_ID__: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  __NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET__: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  __NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID__: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  __NEXT_PUBLIC_FIREBASE_APP_ID__: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let contents = readFileSync(templatePath, 'utf8');
let missing = [];

for (const [token, value] of Object.entries(REPLACEMENTS)) {
  if (!value) missing.push(token.replace(/^__|__$/g, ''));
  contents = contents.replaceAll(token, value ?? '');
}

writeFileSync(outputPath, contents);

if (missing.length) {
  console.warn(
    `[generate-firebase-sw] Missing env vars, background push notifications will not work: ${missing.join(', ')}`,
  );
} else {
  console.log('[generate-firebase-sw] public/firebase-messaging-sw.js generated.');
}
