#!/usr/bin/env node
import fs from 'node:fs';
import { createRequire } from 'module';
import { performance } from 'node:perf_hooks';
const require = createRequire(import.meta.url);
function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadEnv('apps/api/.env');
loadEnv('.env');
process.chdir('apps/api');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [{ emit: 'event', level: 'query' }] });
const queries = [];
prisma.$on('query', (e) => queries.push({ sql: e.query.slice(0, 200), durationMs: Number(e.duration), paramsLen: (e.params || '').length }));

async function timed(name, fn) {
  const t0 = performance.now();
  const result = await fn();
  return { name, ms: +(performance.now() - t0).toFixed(1), result };
}

const results = [];
results.push(await timed('count_users', () => prisma.user.count()));
results.push(await timed('count_trades', () => prisma.trade.count()));
results.push(await timed('open_trades_join', async () => {
  const rows = await prisma.trade.findMany({ where: { status: 'OPEN' }, take: 50, include: { brokerAccount: true } });
  return rows.length;
}));
results.push(await timed('broker_accounts_by_user', async () => {
  const u = await prisma.user.findFirst();
  if (!u) return 0;
  return (await prisma.brokerAccount.findMany({ where: { userId: u.id } })).length;
}));
results.push(await timed('equity_snapshots_recent', async () => {
  return (await prisma.equitySnapshot.findMany({ orderBy: { capturedAt: 'desc' }, take: 100 })).length;
}));
results.push(await timed('closed_trades_agg', async () => {
  return prisma.trade.groupBy({ by: ['status'], _count: true, _sum: { profit: true } });
}));
results.push(await timed('marketplace_listings', async () => {
  return (await prisma.marketplaceListing.findMany({ take: 20, include: { strategy: true } })).length;
}));
results.push(await timed('portfolio_style_trades', async () => {
  const u = await prisma.user.findFirst();
  if (!u) return 0;
  return (await prisma.trade.findMany({
    where: { userId: u.id, status: 'CLOSED' },
    orderBy: { closedAt: 'desc' },
    take: 200,
  })).length;
}));

await prisma.$disconnect();
const out = {
  at: new Date().toISOString(),
  results: results.map(({ name, ms, result }) => ({ name, ms, result: typeof result === 'object' ? JSON.parse(JSON.stringify(result)) : result })),
  prismaQueryEvents: queries.sort((a, b) => b.durationMs - a.durationMs).slice(0, 50),
};
fs.mkdirSync('../../docs/audit/data/db', { recursive: true });
fs.writeFileSync('../../docs/audit/data/db/query-timings.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.results, null, 2));
console.log('top prisma events', out.prismaQueryEvents.slice(0, 10));
