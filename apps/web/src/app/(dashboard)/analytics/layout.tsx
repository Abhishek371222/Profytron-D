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
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <Link href="/analytics" className={section ? 'text-muted-foreground hover:text-primary hover:underline' : ''}>
          Analytics
        </Link>
        {section ? (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground capitalize">{section}</span>
          </>
        ) : null}
      </div>

      <AnalyticsSectionNav />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
