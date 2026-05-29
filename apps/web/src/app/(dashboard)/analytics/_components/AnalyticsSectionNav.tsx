'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Shield, Activity, Globe, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  { label: 'Overview', href: '/analytics', icon: LayoutDashboard, accent: 'cyan' },
  { label: 'Performance', href: '/analytics/performance', icon: BarChart2, accent: 'emerald' },
  { label: 'Risk', href: '/analytics/risk', icon: Shield, accent: 'rose' },
  { label: 'Trade', href: '/analytics/trade', icon: Activity, accent: 'cyan' },
  { label: 'Global', href: '/analytics/global', icon: Globe, accent: 'violet' },
] as const;

const ACCENT: Record<string, { active: string; glow: string; dot: string }> = {
  cyan: {
    active: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30 shadow-[0_0_16px_rgba(34,211,238,0.12)]',
    glow: 'hover:text-cyan-400/70 hover:border-cyan-400/15',
    dot: 'bg-cyan-400',
  },
  emerald: {
    active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30 shadow-[0_0_16px_rgba(52,211,153,0.12)]',
    glow: 'hover:text-emerald-400/70 hover:border-emerald-400/15',
    dot: 'bg-emerald-400',
  },
  rose: {
    active: 'bg-rose-400/10 text-rose-400 border-rose-400/30 shadow-[0_0_16px_rgba(251,113,133,0.12)]',
    glow: 'hover:text-rose-400/70 hover:border-rose-400/15',
    dot: 'bg-rose-400',
  },
  violet: {
    active: 'bg-violet-400/10 text-violet-400 border-violet-400/30 shadow-[0_0_16px_rgba(167,139,250,0.12)]',
    glow: 'hover:text-violet-400/70 hover:border-violet-400/15',
    dot: 'bg-violet-400',
  },
};

export function AnalyticsSectionNav() {
  const pathname = usePathname();

  return (
    <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-md">
      <div className="flex flex-wrap gap-1.5">
        {sections.map(({ label, href, icon: Icon, accent }) => {
          const active = pathname === href;
          const cfg = ACCENT[accent];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-[12px] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] border transition-all duration-200',
                active
                  ? cfg.active
                  : cn('border-white/[0.05] text-white/35 bg-transparent', cfg.glow, 'hover:bg-white/[0.03]'),
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {active && <span className={cn('w-1 h-1 rounded-full ml-0.5', cfg.dot)} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
