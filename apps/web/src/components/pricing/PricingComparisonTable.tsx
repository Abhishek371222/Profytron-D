import {
  COMPARISON_PLAN_COLUMNS,
  PLAN_COMPARISON_ROWS,
} from '@/lib/pricing/plans';
import { cn } from '@/lib/utils';

export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">
          Feature comparison across Free, Starter, Pro, Business, and Enterprise plans
        </caption>
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-muted px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-5"
            >
              Feature
            </th>
            {COMPARISON_PLAN_COLUMNS.map((col) => (
              <th
                key={col.slug}
                scope="col"
                className={cn(
                  'px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-foreground sm:px-4',
                  col.slug === 'pro' && 'bg-primary/5 text-primary',
                )}
              >
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLAN_COMPARISON_ROWS.map((row, idx) => {
            const striped = idx % 2 === 1;
            return (
            <tr
              key={row.label}
              className={cn(
                'border-b border-border last:border-0',
                striped && 'bg-muted/20',
              )}
            >
              <th
                scope="row"
                className={cn(
                  'sticky left-0 z-10 px-4 py-3.5 text-left text-sm font-medium text-foreground sm:px-5',
                  striped ? 'bg-muted' : 'bg-card',
                )}
              >
                {row.label}
              </th>
              {COMPARISON_PLAN_COLUMNS.map((col) => {
                const value = row.values[col.slug];
                const isDash = value === '—';
                return (
                  <td
                    key={col.slug}
                    className={cn(
                      'px-3 py-3.5 text-center tabular-nums sm:px-4',
                      col.slug === 'pro' && 'bg-primary/[0.03]',
                      isDash ? 'text-muted-foreground/50' : 'text-foreground/80',
                    )}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
