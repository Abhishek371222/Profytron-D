const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}

const META_ID = '789f8612-bded-470e-a5a1-6626c3c48f04';
const STRATEGY_ID = 'ec900113-133f-4eba-9063-1d7ef18831f5';

(async () => {
  const CopyFactory = require('metaapi.cloud-copyfactory-sdk').default;
  const client = new CopyFactory(process.env.METAAPI_TOKEN);
  const api = client.configurationApi;
  const generated = await api.generateStrategyId();
  const cfId = generated.id;
  await api.updateStrategy(cfId, {
    name: 'Profytron Master Bot',
    description: 'Profytron operator master provider strategy',
    accountId: META_ID,
    maxTradeRisk: 0.1,
    skipPendingOrders: false,
  });
  const prisma = new PrismaClient();
  await prisma.strategy.update({
    where: { id: STRATEGY_ID },
    data: { copyFactoryStrategyId: cfId },
  });
  await prisma.$disconnect();
  console.log(JSON.stringify({
    ok: true,
    copyFactoryStrategyId: cfId,
    providerMetaApiAccountId: META_ID,
    note: 'Provider strategy only — zero subscribers linked',
  }, null, 2));
})().catch((e) => {
  console.error('CF provision failed:', e.message || e);
  process.exit(1);
});

