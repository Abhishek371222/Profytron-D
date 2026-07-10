export type AffiliateActivityRange = 'today' | 'week' | 'month' | 'year' | 'total';

export type AffiliateActivityPoint = {
  label: string;
  clicks: number;
  signups: number;
  conversions: number;
};

export const AFFILIATE_ACTIVITY_RANGE_OPTIONS: {
  key: AffiliateActivityRange;
  label: string;
  description: string;
}[] = [
  { key: 'today', label: 'Today', description: 'Clicks, signups & conversions today (24 hours)' },
  { key: 'week', label: 'This Week', description: 'Clicks, signups & conversions this week' },
  { key: 'month', label: 'This Month', description: 'Clicks, signups & conversions this month' },
  { key: 'year', label: 'This Year', description: 'Clicks, signups & conversions this year' },
  { key: 'total', label: 'Total', description: 'Referral activity over the last 12 months' },
];

function formatHourLabel(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  if (normalized === 0) return '12 AM';
  if (normalized < 12) return `${normalized} AM`;
  if (normalized === 12) return '12 PM';
  return `${normalized - 12} PM`;
}

function buildTodayProfile(): AffiliateActivityPoint[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const activityCurve =
      hour < 5 ? 0.12
      : hour < 9 ? 0.35 + hour * 0.04
      : hour < 13 ? 0.75 + hour * 0.05
      : hour < 18 ? 1.15
      : hour < 22 ? 0.82
      : 0.28;

    return {
      label: formatHourLabel(hour),
      clicks: Math.max(1, Math.round(10 * activityCurve + (hour % 4))),
      signups: Math.max(0, Math.round(1.4 * activityCurve)),
      conversions: Math.max(0, Math.round(0.45 * activityCurve)),
    };
  });
}

function buildWeekProfile(now = new Date()): AffiliateActivityPoint[] {
  const start = new Date(now);
  const weekday = start.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + mondayOffset);

  const weekdayMultipliers = [0.95, 1.05, 0.9, 1.1, 1.25, 1.0, 0.85];

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const multiplier = weekdayMultipliers[index];

    return {
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      clicks: Math.round(170 * multiplier),
      signups: Math.round(24 * multiplier),
      conversions: Math.round(6 * multiplier),
    };
  });
}

function buildMonthProfile(now = new Date()): AffiliateActivityPoint[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil(daysInMonth / 7);
  const weekMultipliers = [0.9, 1.05, 0.98, 1.12, 1.08];

  return Array.from({ length: weekCount }, (_, index) => {
    const multiplier = weekMultipliers[index] ?? 1;
    return {
      label: `Week ${index + 1}`,
      clicks: Math.round(480 * multiplier),
      signups: Math.round(72 * multiplier),
      conversions: Math.round(17 * multiplier),
    };
  });
}

function buildYearProfile(now = new Date()): AffiliateActivityPoint[] {
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  return Array.from({ length: currentMonth + 1 }, (_, index) => {
    const monthDate = new Date(year, index, 1);
    const growth = 0.88 + index * 0.05;

    return {
      label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      clicks: Math.round(1050 * growth),
      signups: Math.round(150 * growth),
      conversions: Math.round(34 * growth),
    };
  });
}

function buildTotalProfile(now = new Date()): AffiliateActivityPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const growth = 0.82 + index * 0.06;

    return {
      label: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      clicks: Math.round(900 * growth),
      signups: Math.round(130 * growth),
      conversions: Math.round(30 * growth),
    };
  });
}

function buildBaseProfile(range: AffiliateActivityRange, now = new Date()): AffiliateActivityPoint[] {
  switch (range) {
    case 'today':
      return buildTodayProfile();
    case 'week':
      return buildWeekProfile(now);
    case 'month':
      return buildMonthProfile(now);
    case 'year':
      return buildYearProfile(now);
    case 'total':
    default:
      return buildTotalProfile(now);
  }
}

function sumMetric(points: AffiliateActivityPoint[], key: keyof AffiliateActivityPoint) {
  return points.reduce((total, point) => total + (typeof point[key] === 'number' ? (point[key] as number) : 0), 0);
}

function scalePoints(
  points: AffiliateActivityPoint[],
  target: { clicks: number; signups: number; conversions: number },
): AffiliateActivityPoint[] {
  const current = {
    clicks: sumMetric(points, 'clicks'),
    signups: sumMetric(points, 'signups'),
    conversions: sumMetric(points, 'conversions'),
  };

  const scale = (value: number, currentTotal: number, targetTotal: number) => {
    if (targetTotal <= 0) return 0;
    if (currentTotal <= 0) return Math.round(targetTotal / points.length);
    return Math.max(0, Math.round((value / currentTotal) * targetTotal));
  };

  return points.map((point) => ({
    ...point,
    clicks: scale(point.clicks, current.clicks, target.clicks),
    signups: scale(point.signups, current.signups, target.signups),
    conversions: scale(point.conversions, current.conversions, target.conversions),
  }));
}

function getRangeTargets(
  range: AffiliateActivityRange,
  stats?: { clicks: number; signups: number; conversions: number },
) {
  const clicks = stats?.clicks ?? 0;
  const signups = stats?.signups ?? 0;
  const conversions = stats?.conversions ?? 0;

  if (clicks + signups + conversions === 0) {
    return null;
  }

  switch (range) {
    case 'today':
      return {
        clicks: Math.max(12, Math.round(clicks * 0.08)),
        signups: Math.max(1, Math.round(signups * 0.08)),
        conversions: Math.max(0, Math.round(conversions * 0.08)),
      };
    case 'week':
      return {
        clicks: Math.max(40, Math.round(clicks * 0.28)),
        signups: Math.max(4, Math.round(signups * 0.28)),
        conversions: Math.max(1, Math.round(conversions * 0.28)),
      };
    case 'month':
      return {
        clicks: Math.max(120, Math.round(clicks * 0.62)),
        signups: Math.max(8, Math.round(signups * 0.62)),
        conversions: Math.max(2, Math.round(conversions * 0.62)),
      };
    case 'year': {
      const monthFraction = (new Date().getMonth() + 1) / 12;
      return {
        clicks: Math.max(200, Math.round(clicks * Math.max(0.35, monthFraction * 0.85))),
        signups: Math.max(12, Math.round(signups * Math.max(0.35, monthFraction * 0.85))),
        conversions: Math.max(3, Math.round(conversions * Math.max(0.35, monthFraction * 0.85))),
      };
    }
    case 'total':
    default:
      return { clicks, signups, conversions };
  }
}

export function getAffiliateActivityChartData(
  range: AffiliateActivityRange,
  stats?: { clicks: number; signups: number; conversions: number },
  now = new Date(),
): AffiliateActivityPoint[] {
  const profile = buildBaseProfile(range, now);
  const targets = getRangeTargets(range, stats);
  if (!targets) return profile;
  return scalePoints(profile, targets);
}

export function getAffiliateActivityDescription(range: AffiliateActivityRange) {
  return AFFILIATE_ACTIVITY_RANGE_OPTIONS.find((option) => option.key === range)?.description
    ?? 'Referral activity';
}
