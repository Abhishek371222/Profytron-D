#!/usr/bin/env node
/** Sample error response shapes (401/404/400) — measure only. */
import { loadEnv, ensureDirs, writeJson, request, apiBase, tokens } from './lib.mjs';

loadEnv();
ensureDirs();

const cases = [
  { name: 'unauthorized_me', method: 'GET', path: '/v1/users/me', token: null },
  { name: 'not_found', method: 'GET', path: '/v1/this-route-does-not-exist-audit', token: null },
  { name: 'bad_login', method: 'POST', path: '/v1/auth/login', body: { email: 'x', password: 'y' } },
];

const tok = tokens();
if (tok.user) {
  cases.push({
    name: 'authed_not_found_resource',
    method: 'GET',
    path: '/v1/trading/trades/00000000-0000-0000-0000-000000000000',
    token: tok.user,
  });
}

const results = [];
for (const c of cases) {
  const res = await request(c.method, c.path, { token: c.token || undefined, body: c.body });
  results.push({
    name: c.name,
    method: c.method,
    path: c.path,
    status: res.status,
    ms: res.ms,
    keys: res.json ? Object.keys(res.json) : [],
    success: res.json?.success,
    preview: res.bodyPreview?.slice(0, 240),
  });
}

writeJson('errors.json', { at: new Date().toISOString(), base: apiBase(), results });
console.log(JSON.stringify(results.map((r) => ({ name: r.name, status: r.status })), null, 2));
