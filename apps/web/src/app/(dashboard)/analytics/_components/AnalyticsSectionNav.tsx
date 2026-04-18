'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { label: 'Overview', href: '/analytics' },
  { label: 'Performance', href: '/analytics/performance' },
  { label: 'Risk', href: '/analytics/risk' },
  { label: 'Trade', href: '/analytics/trade' },
  { label: 'Global', href: '/analytics/global' },
];

export function AnalyticsSectionNav() {
  const pathname = usePathname();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-md">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const active = pathname === section.href;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={[
                'rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-all',
                active
                  ? 'bg-gradient-to-r from-cyan-400/30 to-indigo-400/30 text-white border border-cyan-200/30 shadow-[0_8px_24px_rgba(56,189,248,0.2)]'
                  : 'border border-white/10 text-white/70 hover:text-white hover:bg-white/10',
              ].join(' ')}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
