'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AnalyticsSectionNav } from './_components/AnalyticsSectionNav';

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  const section = parts[1] && parts[1] !== 'analytics' ? parts[1] : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-white/55">
        <Link href="/dashboard" className="rounded px-1.5 py-0.5 hover:bg-white/10 hover:text-white/80">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/analytics" className="rounded px-1.5 py-0.5 hover:bg-white/10 hover:text-white/80">
          Analytics
        </Link>
        {section ? (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="rounded border border-cyan-200/25 bg-cyan-200/10 px-2 py-0.5 text-cyan-100">
              {section}
            </span>
          </>
        ) : null}
      </div>

      <AnalyticsSectionNav />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
