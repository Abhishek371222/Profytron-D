/** Forex/crypto session helpers for adaptive Markets polling. */

export type MarketSessionState = {
  open: boolean;
  /** True in the first ~90 minutes after the weekly open (Sun 21:00 UTC). */
  mondayOpenWindow: boolean;
  /** Milliseconds until the next weekly open if currently closed. */
  msUntilOpen: number | null;
  /** Suggested quote poll interval. */
  quotePollMs: number;
  /** Suggested OHLC poll interval. */
  ohlcPollMs: number;
  /** Suggested AI bias poll interval. */
  biasPollMs: number;
  label: string;
};

/** Weekly FX open: Sunday 21:00 UTC (Sydney). Close: Friday 21:00 UTC. */
const WEEKLY_OPEN_UTC_DAY = 0; // Sunday
const WEEKLY_OPEN_UTC_HOUR = 21;
const WEEKLY_CLOSE_UTC_DAY = 5; // Friday
const WEEKLY_CLOSE_UTC_HOUR = 21;

function utcParts(d: Date) {
  return {
    day: d.getUTCDay(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    ms:
      d.getUTCDay() * 86_400_000 +
      d.getUTCHours() * 3_600_000 +
      d.getUTCMinutes() * 60_000 +
      d.getUTCSeconds() * 1000 +
      d.getUTCMilliseconds(),
  };
}

function nextWeeklyOpen(from: Date): Date {
  const open = new Date(from);
  open.setUTCSeconds(0, 0);
  open.setUTCMinutes(0);
  open.setUTCHours(WEEKLY_OPEN_UTC_HOUR);

  // Move to this week's Sunday 21:00, or next week if already past.
  const day = from.getUTCDay();
  const daysUntilSunday = (WEEKLY_OPEN_UTC_DAY - day + 7) % 7;
  open.setUTCDate(from.getUTCDate() + daysUntilSunday);

  if (open.getTime() <= from.getTime()) {
    open.setUTCDate(open.getUTCDate() + 7);
  }
  return open;
}

export function isForexMarketOpen(now = new Date()): boolean {
  const { day, hour } = utcParts(now);
  // Closed: Friday after 21:00 UTC through Sunday before 21:00 UTC.
  if (day === WEEKLY_CLOSE_UTC_DAY && hour >= WEEKLY_CLOSE_UTC_HOUR) return false;
  if (day === 6) return false; // Saturday
  if (day === WEEKLY_OPEN_UTC_DAY && hour < WEEKLY_OPEN_UTC_HOUR) return false;
  return true;
}

export function getMarketSessionState(now = new Date()): MarketSessionState {
  const open = isForexMarketOpen(now);
  const nextOpen = nextWeeklyOpen(now);
  const msUntilOpen = open ? null : Math.max(0, nextOpen.getTime() - now.getTime());
  const { day, hour } = utcParts(now);

  // Monday open window: first ~4h after weekly open (Sun 21:00 → Mon 01:00 UTC).
  const mondayOpenWindow =
    open &&
    ((day === 0 && hour >= WEEKLY_OPEN_UTC_HOUR) ||
      (day === 1 && hour < 1));

  // Crypto trades 24/7 — keep a moderate floor even on FX weekend.
  if (!open) {
    return {
      open: false,
      mondayOpenWindow: false,
      msUntilOpen,
      quotePollMs: 120_000,
      ohlcPollMs: 180_000,
      biasPollMs: 10 * 60_000,
      label:
        msUntilOpen != null
          ? `Weekend · opens in ${formatDuration(msUntilOpen)}`
          : 'Weekend',
    };
  }

  if (mondayOpenWindow) {
    return {
      open: true,
      mondayOpenWindow: true,
      msUntilOpen: null,
      quotePollMs: 10_000,
      ohlcPollMs: 20_000,
      biasPollMs: 60_000,
      label: 'Monday open · live updates',
    };
  }

  return {
    open: true,
    mondayOpenWindow: false,
    msUntilOpen: null,
    quotePollMs: 20_000,
    ohlcPollMs: 45_000,
    biasPollMs: 2 * 60_000,
    label: 'Market open · auto-updating',
  };
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 48) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
