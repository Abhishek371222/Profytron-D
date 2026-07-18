'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CoachBrandMark({
  size = 28,
  pulse = false,
  className,
}: {
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const icon = Math.max(12, Math.round(size * 0.48));

  return (
    <motion.span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
      style={{ width: size, height: size }}
      animate={
        reduce || !pulse
          ? undefined
          : { scale: [1, 1.04, 1] }
      }
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      <Target style={{ width: icon, height: icon }} strokeWidth={2.25} />
    </motion.span>
  );
}

export function CoachWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-semibold tracking-tight text-foreground',
        className,
      )}
    >
      Alpha Coach
    </span>
  );
}
