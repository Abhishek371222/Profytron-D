'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useTradingStore } from '@/lib/stores/useTradingStore'; // Assuming we'll add isPaper to this
import { cn } from '@/lib/utils';
import { Info, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showDemoBanner, setShowDemoBanner] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isBuilder = pathname?.includes('/strategies/builder');
  
  // For now, we'll assume we are in demo mode for the build.
  const isDemo = true; 

  return (
    <AppShell>
      <div suppressHydrationWarning className={cn("relative flex flex-col", !isBuilder && "gap-6")}>
        <AnimatePresence>
          {mounted && isDemo && showDemoBanner && !isBuilder && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <Info className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Demo Mode Active</h4>
                    <p className="text-xs text-amber-500/70 font-medium">Simulated market data. No real capital at risk.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-xs font-black text-white hover:text-p transition-colors uppercase tracking-widest group/btn">
                    Connect real broker
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setShowDemoBanner(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {children}
      </div>
    </AppShell>
  );
}
