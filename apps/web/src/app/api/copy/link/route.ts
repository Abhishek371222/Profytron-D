import { NextRequest } from 'next/server';
import {
  createSql,
  linkUserCopySubscriptions,
} from '@/lib/server/copy-link';
import {
  error,
  json,
  userIdFromRequest,
} from '@/lib/server/metaapi-trading';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Professional CopyFactory wiring for every new user.
 * Call after broker connect and after marketplace subscribe / payment.
 *
 * POST body (optional): { subscriptionId?, strategyId? }
 */
export async function POST(req: NextRequest) {
  const userId = await userIdFromRequest(req);
  if (!userId) return error('Unauthorized', 401);

  const metaToken = process.env.METAAPI_TOKEN?.trim();
  const aesKey = process.env.AES_MASTER_KEY?.trim();
  if (!metaToken || !aesKey) {
    return error('Copy trading is temporarily unavailable. Please try again later.', 503);
  }

  let body: { subscriptionId?: string; strategyId?: string } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  try {
    const sql = createSql();
    const results = await linkUserCopySubscriptions({
      sql,
      userId,
      metaToken,
      aesKey,
      subscriptionId: body.subscriptionId,
      strategyId: body.strategyId,
    });

    const linked = results.filter((r) => r.status === 'linked').length;
    const errors = results.filter((r) => r.status === 'error');

    return json({
      linked,
      total: results.length,
      results,
      ready: linked > 0 || (results.length > 0 && errors.length === 0),
      message:
        linked > 0
          ? `Live copy linked for ${linked} bot(s)`
          : errors[0]?.message ||
            (results.length === 0
              ? 'No active subscriptions to link — subscribe to a bot first'
              : 'Nothing to link'),
    });
  } catch (e: any) {
    return error(e?.message || 'Copy link failed', 500);
  }
}
