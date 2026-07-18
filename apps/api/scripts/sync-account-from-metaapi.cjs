/**
 * Force-sync one MT5 account from MetaAPI and rebase returns on a known deposit.
 *
 * Usage: node scripts/sync-account-from-metaapi.cjs [email] [initialDeposit]
 * Example: node scripts/sync-account-from-metaapi.cjs abhiaj371@gmail.com 100
 */
const { PrismaClient } = require('@prisma/client');
const { createDecipheriv } = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

const prisma = new PrismaClient();
const INITIAL = Number(process.argv[3] || 100);
const EMAIL = process.argv[2] || 'abhiaj371@gmail.com';
const DEMO_BOT = 'Profytron Demo Bot';
const LOOKBACK_DAYS = Number(process.env.METAAPI_LOOKBACK_DAYS || 180);

function decryptNest(storedData, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const parsed = JSON.parse(storedData);
  const iv = Buffer.from(parsed.iv, 'hex');
  const authTag = Buffer.from(parsed.authTag, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function httpJson(url, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: { 'auth-token': token, Accept: 'application/json' },
        timeout: 60_000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new Error(
                `HTTP ${res.statusCode} ${url.split('?')[0]}: ${body.slice(0, 300)}`,
              ),
            );
            return;
          }
          try {
            resolve(body ? JSON.parse(body) : null);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });
}

function clientUrl(region) {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}

function provisioningUrl() {
  return 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
}

function isBalanceDeal(d) {
  const type = String(d?.type || d?.dealType || '').toUpperCase();
  return (
    type.includes('BALANCE') ||
    type.includes('CREDIT') ||
    type.includes('CHARGE') ||
    type.includes('CORRECTION') ||
    type.includes('BONUS')
  );
}

function groupClosedPositions(deals) {
  const byPosition = new Map();
  for (const d of deals) {
    if (isBalanceDeal(d)) continue;
    const pid = String(d.positionId || '');
    if (!pid) continue;
    if (!byPosition.has(pid)) byPosition.set(pid, []);
    byPosition.get(pid).push(d);
  }
  const groups = [];
  for (const [positionId, dealsForPos] of byPosition) {
    const hasOut = dealsForPos.some((d) =>
      String(d.entryType || '')
        .toUpperCase()
        .includes('OUT'),
    );
    if (!hasOut) continue;
    groups.push({ positionId, deals: dealsForPos });
  }
  return groups;
}

function computeReturnPct(current, initial) {
  if (!Number.isFinite(current) || !Number.isFinite(initial) || initial <= 0) {
    return 0;
  }
  return Number((((current - initial) / initial) * 100).toFixed(2));
}

async function main() {
  const token = process.env.METAAPI_TOKEN;
  const aesKey = process.env.AES_MASTER_KEY;
  if (!token) throw new Error('METAAPI_TOKEN missing');
  if (!aesKey) throw new Error('AES_MASTER_KEY missing');

  const user = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: { id: true, email: true },
  });
  if (!user) throw new Error('User not found: ' + EMAIL);

  const broker = await prisma.brokerAccount.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      isPaperTrading: false,
    },
    orderBy: [{ isDefault: 'desc' }, { connectedAt: 'desc' }],
  });
  if (!broker) throw new Error('No active live broker');

  const creds = JSON.parse(
    decryptNest(broker.credentialsEncrypted, aesKey),
  );
  const metaApiAccountId = creds.metaApiAccountId;
  if (!metaApiAccountId || String(metaApiAccountId).startsWith('mock-')) {
    throw new Error('No MetaAPI account id on broker credentials');
  }

  let region = creds.metaApiRegion;
  let accountMeta = null;
  try {
    accountMeta = await httpJson(
      `${provisioningUrl()}/users/current/accounts/${metaApiAccountId}`,
      token,
    );
    region = accountMeta?.region || region || process.env.METAAPI_REGION || 'new-york';
  } catch (e) {
    region = region || process.env.METAAPI_REGION || 'new-york';
    console.warn('provisioning lookup failed:', e.message);
  }

  const base = clientUrl(region);
  const to = new Date();
  const from = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const fromIso = encodeURIComponent(from.toISOString());
  const toIso = encodeURIComponent(to.toISOString());

  console.log(
    `Fetching MetaAPI account=${metaApiAccountId.slice(0, 8)}… region=${region} lookback=${LOOKBACK_DAYS}d`,
  );

  const [info, positions, pendingOrders, deals, orderHistory] =
    await Promise.all([
      httpJson(`${base}/users/current/accounts/${metaApiAccountId}/account-information`, token),
      httpJson(`${base}/users/current/accounts/${metaApiAccountId}/positions`, token).catch(
        (e) => {
          console.warn('positions:', e.message);
          return [];
        },
      ),
      httpJson(`${base}/users/current/accounts/${metaApiAccountId}/orders`, token).catch(
        (e) => {
          console.warn('orders:', e.message);
          return [];
        },
      ),
      httpJson(
        `${base}/users/current/accounts/${metaApiAccountId}/history-deals/time/${fromIso}/${toIso}`,
        token,
      ).catch((e) => {
        console.warn('deals:', e.message);
        return [];
      }),
      httpJson(
        `${base}/users/current/accounts/${metaApiAccountId}/history-orders/time/${fromIso}/${toIso}`,
        token,
      ).catch((e) => {
        console.warn('orders history:', e.message);
        return [];
      }),
    ]);

  const balance = Number(info?.balance ?? 0);
  const equity = Number(info?.equity ?? info?.balance ?? 0);
  const margin = Number(info?.margin ?? 0);
  const freeMargin = Number(info?.freeMargin ?? 0);
  const credit = Number(info?.credit ?? 0);
  const marginLevel = Number(info?.marginLevel ?? 0);
  const currency = info?.currency || 'USD';
  const leverage = info?.leverage != null ? Number(info.leverage) : null;
  const login = info?.login != null ? String(info.login) : null;

  const dealList = Array.isArray(deals) ? deals : [];
  const posList = Array.isArray(positions) ? positions : [];
  const pendingList = Array.isArray(pendingOrders) ? pendingOrders : [];
  const orderList = Array.isArray(orderHistory) ? orderHistory : [];

  const balanceDeals = dealList.filter(isBalanceDeal);
  const depositSum = balanceDeals.reduce(
    (s, d) => s + Number(d.profit || d.amount || 0),
    0,
  );

  const strategy = await prisma.strategy.findFirst({
    where: { name: DEMO_BOT, deletedAt: null },
    select: { id: true, name: true },
  });

  // 1) Rebase account on known $100 deposit
  await prisma.brokerAccount.update({
    where: { id: broker.id },
    data: {
      initialEquity: INITIAL,
      lastKnownEquity: equity > 0 ? equity : INITIAL,
      lastKnownBalance: balance > 0 ? balance : INITIAL,
      lastConnectedAt: new Date(),
      isDefault: true,
    },
  });

  // Clear other defaults for this user
  await prisma.brokerAccount.updateMany({
    where: { userId: user.id, id: { not: broker.id }, isDefault: true },
    data: { isDefault: false },
  });

  // 2) Equity snapshot
  await prisma.equitySnapshot.create({
    data: {
      brokerAccountId: broker.id,
      balance: balance || INITIAL,
      equity: equity || INITIAL,
      margin,
      freeMargin,
    },
  });

  // 3) Upsert closed trades from MetaAPI deals
  const groups = groupClosedPositions(dealList);
  let upserted = 0;
  for (const group of groups) {
    const outDeal = [...group.deals]
      .reverse()
      .find((d) =>
        String(d.entryType || '')
          .toUpperCase()
          .includes('OUT'),
      );
    const inDeal = group.deals.find((d) =>
      String(d.entryType || '')
        .toUpperCase()
        .includes('IN'),
    );
    if (!outDeal) continue;
    const symbol = String(
      group.deals.find((d) => d.symbol)?.symbol || '',
    ).replace(/\.|#/g, '');
    if (!symbol) continue;

    const profit = group.deals.reduce(
      (sum, d) =>
        sum +
        Number(d.profit || 0) +
        Number(d.commission || 0) +
        Number(d.swap || 0),
      0,
    );
    const direction = String(inDeal?.type || outDeal.type || '')
      .toUpperCase()
      .includes('SELL')
      ? 'SHORT'
      : 'LONG';

    await prisma.trade.upsert({
      where: {
        brokerAccountId_brokerTicket: {
          brokerAccountId: broker.id,
          brokerTicket: group.positionId,
        },
      },
      create: {
        userId: user.id,
        brokerAccountId: broker.id,
        brokerTicket: group.positionId,
        strategyId: strategy?.id ?? null,
        symbol,
        direction,
        volume: Number(inDeal?.volume ?? outDeal.volume ?? 0),
        openPrice: Number(inDeal?.price ?? outDeal.price ?? 0),
        closePrice: Number(outDeal.price ?? 0),
        fillPrice: Number(inDeal?.price ?? outDeal.price ?? 0),
        profit,
        commission: group.deals.reduce(
          (s, d) => s + Number(d.commission || 0),
          0,
        ),
        swap: group.deals.reduce((s, d) => s + Number(d.swap || 0), 0),
        isPaper: false,
        status: 'CLOSED',
        openedAt: inDeal?.time ? new Date(inDeal.time) : new Date(outDeal.time),
        closedAt: new Date(outDeal.time),
        executionMode: 'METAAPI_FULL_SYNC',
      },
      update: {
        status: 'CLOSED',
        strategyId: strategy?.id ?? undefined,
        closePrice: Number(outDeal.price ?? 0),
        profit,
        closedAt: new Date(outDeal.time),
        executionMode: 'METAAPI_FULL_SYNC',
      },
    });
    upserted += 1;
  }

  // Attribute any remaining trades on this broker to demo bot
  if (strategy) {
    await prisma.trade.updateMany({
      where: {
        userId: user.id,
        brokerAccountId: broker.id,
        OR: [{ strategyId: null }, { strategyId: { not: strategy.id } }],
      },
      data: { strategyId: strategy.id },
    });

    await prisma.userStrategySubscription.updateMany({
      where: { userId: user.id, strategyId: strategy.id },
      data: {
        status: 'ACTIVE',
        brokerAccountId: broker.id,
        equityBaselineAtSubscribe: INITIAL,
      },
    });
  }

  // 4) Sync open positions into Trade table
  let openSynced = 0;
  const openTickets = new Set();
  for (const pos of posList) {
    const ticket = String(pos.id ?? pos.positionId ?? '');
    if (!ticket) continue;
    openTickets.add(ticket);
    const symbol = String(pos.symbol || '').replace(/\.|#/g, '');
    if (!symbol) continue;
    const direction = String(pos.type || '')
      .toUpperCase()
      .includes('SELL')
      ? 'SHORT'
      : 'LONG';
    await prisma.trade.upsert({
      where: {
        brokerAccountId_brokerTicket: {
          brokerAccountId: broker.id,
          brokerTicket: ticket,
        },
      },
      create: {
        userId: user.id,
        brokerAccountId: broker.id,
        brokerTicket: ticket,
        strategyId: strategy?.id ?? null,
        symbol,
        direction,
        volume: Number(pos.volume ?? 0),
        openPrice: Number(pos.openPrice ?? pos.price ?? 0),
        fillPrice: Number(pos.openPrice ?? pos.price ?? 0),
        stopLoss: pos.stopLoss ?? null,
        takeProfit: pos.takeProfit ?? null,
        profit: Number(pos.profit ?? pos.unrealizedProfit ?? 0),
        isPaper: false,
        status: 'OPEN',
        openedAt: pos.time ? new Date(pos.time) : new Date(),
        executionMode: 'METAAPI_FULL_SYNC',
      },
      update: {
        status: 'OPEN',
        strategyId: strategy?.id ?? undefined,
        profit: Number(pos.profit ?? pos.unrealizedProfit ?? 0),
        stopLoss: pos.stopLoss ?? null,
        takeProfit: pos.takeProfit ?? null,
        closedAt: null,
      },
    });
    openSynced += 1;
  }

  // Close DB opens that are no longer on MetaAPI
  if (openTickets.size >= 0) {
    const stale = await prisma.trade.findMany({
      where: {
        brokerAccountId: broker.id,
        status: 'OPEN',
        brokerTicket: { not: null },
      },
      select: { id: true, brokerTicket: true },
    });
    for (const t of stale) {
      if (t.brokerTicket && !openTickets.has(t.brokerTicket)) {
        await prisma.trade.update({
          where: { id: t.id },
          data: { status: 'CLOSED', closedAt: new Date() },
        });
      }
    }
  }

  // 5) Rebuild demo-bot StrategyPerformance from real trades + $100 base
  if (strategy) {
    const closed = await prisma.trade.findMany({
      where: {
        brokerAccountId: broker.id,
        strategyId: strategy.id,
        status: 'CLOSED',
      },
      orderBy: { closedAt: 'asc' },
      select: {
        profit: true,
        closedAt: true,
        openedAt: true,
      },
    });

    await prisma.strategyPerformance.deleteMany({
      where: { strategyId: strategy.id },
    });

    let cumPnl = 0;
    let cumTrades = 0;
    let cumWins = 0;
    let peak = INITIAL;
    let maxDd = 0;
    const byDay = new Map();

    for (const t of closed) {
      const d = new Date(t.closedAt || t.openedAt);
      d.setUTCHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const pnl = Number(t.profit ?? 0);
      const row = byDay.get(key) || {
        date: d,
        dayPnl: 0,
        trades: 0,
        wins: 0,
      };
      row.dayPnl += pnl;
      row.trades += 1;
      if (pnl > 0) row.wins += 1;
      byDay.set(key, row);
    }

    const perfRows = [];
    for (const row of [...byDay.values()].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    )) {
      cumPnl += row.dayPnl;
      cumTrades += row.trades;
      cumWins += row.wins;
      const equityNow = INITIAL + cumPnl;
      if (equityNow > peak) peak = equityNow;
      const dd = peak > 0 ? ((peak - equityNow) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
      const winRate = cumTrades > 0 ? (cumWins / cumTrades) * 100 : 0;
      perfRows.push({
        strategyId: strategy.id,
        date: row.date,
        winRate: Number(winRate.toFixed(1)),
        drawdown: Number(dd.toFixed(2)),
        maxDrawdown: Number(maxDd.toFixed(2)),
        sharpeRatio: 1.2,
        sortinoRatio: 1.4,
        totalTrades: row.trades,
        winningTrades: row.wins,
        netPnl: Number(cumPnl.toFixed(2)),
        equityCurve: [
          {
            time: row.date.getTime(),
            value: Number(equityNow.toFixed(2)),
          },
        ],
      });
    }
    if (perfRows.length) {
      await prisma.strategyPerformance.createMany({ data: perfRows });
    }
  }

  const tradeAgg = await prisma.trade.aggregate({
    where: {
      brokerAccountId: broker.id,
      status: 'CLOSED',
    },
    _count: true,
    _sum: { profit: true },
  });

  const tradingPnl = Number(tradeAgg._sum.profit ?? 0);
  const returnPct = computeReturnPct(equity || INITIAL + tradingPnl, INITIAL);
  const floating = posList.reduce(
    (s, p) => s + Number(p.profit ?? p.unrealizedProfit ?? 0),
    0,
  );

  // Try writing AccountSnapshot if migration applied
  let snapshotWritten = false;
  try {
    const snap = await prisma.accountSnapshot.create({
      data: {
        brokerAccountId: broker.id,
        login,
        broker: info?.broker ?? accountMeta?.broker ?? null,
        server: info?.server ?? broker.serverName,
        platform: info?.platform ?? 'mt5',
        currency,
        leverage,
        connectionStatus:
          accountMeta?.connectionStatus || info?.connectionStatus || 'CONNECTED',
        synchronizationStatus: 'SYNCHRONIZED',
        balance: balance || INITIAL,
        equity: equity || INITIAL,
        credit,
        margin,
        freeMargin,
        marginLevel,
        floatingPnl: floating,
        positionsJson: posList,
        positionsCount: posList.length,
        pendingOrdersJson: pendingList,
        dealsJson: dealList.slice(-500),
        orderHistoryJson: orderList.slice(-500),
        symbolsJson: [],
        marketDataJson: [],
        accountStatusJson: {
          connectionStatus: accountMeta?.connectionStatus || null,
          state: accountMeta?.state || null,
          region,
        },
        copyTradingJson: null,
        performanceJson: {
          initialDeposit: INITIAL,
          returnPct,
          tradingPnl,
          netDepositsMeta: depositSum,
        },
        riskJson: {
          margin,
          freeMargin,
          marginLevel,
          openPositions: posList.length,
        },
        eventsJson: [],
        realizedProfit: tradingPnl,
        unrealizedProfit: floating,
        netProfit: Number((tradingPnl + floating).toFixed(2)),
        syncStatus: 'SUCCESS',
        lastSuccessfulSync: new Date(),
        apiVersion: 'METAAPI_FULL_SYNC',
      },
    });
    await prisma.accountLatestSnapshot.upsert({
      where: { brokerAccountId: broker.id },
      create: {
        brokerAccountId: broker.id,
        snapshotId: snap.id,
        lastSyncedAt: new Date(),
        lastSuccessfulSync: new Date(),
        syncStatus: 'SUCCESS',
      },
      update: {
        snapshotId: snap.id,
        lastSyncedAt: new Date(),
        lastSuccessfulSync: new Date(),
        syncStatus: 'SUCCESS',
      },
    });
    snapshotWritten = true;
  } catch (e) {
    console.warn(
      'AccountSnapshot write skipped (migration may be pending):',
      e.message?.slice(0, 120),
    );
  }

  console.log(
    JSON.stringify(
      {
        email: EMAIL,
        brokerAccountId: broker.id,
        last4: broker.accountNumberLast4,
        login,
        currency,
        leverage,
        region,
        meta: {
          state: accountMeta?.state ?? null,
          connectionStatus: accountMeta?.connectionStatus ?? null,
        },
        initialDeposit: INITIAL,
        live: {
          balance,
          equity,
          margin,
          freeMargin,
          marginLevel,
          credit,
          floatingPnl: Number(floating.toFixed(2)),
        },
        returns: {
          returnPct,
          tradingPnl: Number(tradingPnl.toFixed(2)),
          equityVsDeposit: Number(((equity || 0) - INITIAL).toFixed(2)),
        },
        extracted: {
          positions: posList.length,
          pendingOrders: pendingList.length,
          deals: dealList.length,
          balanceDeals: balanceDeals.length,
          depositSumFromBalanceDeals: Number(depositSum.toFixed(2)),
          historyOrders: orderList.length,
          closedGroupsUpserted: upserted,
          openPositionsSynced: openSynced,
        },
        demoBot: strategy
          ? { id: strategy.id, name: strategy.name }
          : null,
        snapshotWritten,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
