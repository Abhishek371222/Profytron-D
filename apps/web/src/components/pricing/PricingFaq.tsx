'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICING_FAQ_ITEMS } from '@/lib/pricing/plans';

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {PRICING_FAQ_ITEMS.map((item, index) => {
        const open = openIndex === index;
        const panelId = `pricing-faq-panel-${index}`;
        const buttonId = `pricing-faq-button-${index}`;
        return (
          <div key={item.question}>
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex min-h-[48px] w-full items-start justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset sm:px-5 sm:py-4"
                aria-expanded={open}
                aria-controls={panelId}
              >
                <span className="pr-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                  {item.question}
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200',
                    open
                      ? 'rotate-180 border-primary/20 bg-primary/10'
                      : 'border-border bg-muted/40',
                  )}
                  aria-hidden
                >
                  <ChevronDown className="h-4 w-4 text-primary" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
