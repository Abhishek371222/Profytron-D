'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
};

const SIZE = {
  sm: { box: 'h-8 w-8', img: 28, word: 'text-sm' },
  md: { box: 'h-9 w-9', img: 32, word: 'text-sm' },
  lg: { box: 'h-11 w-11', img: 40, word: 'text-base' },
} as const;

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  className,
  markClassName,
}: BrandLogoProps) {
  const s = SIZE[size];

  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <div
        className={cn(
          'relative shrink-0 rounded-[11px] overflow-hidden',
          'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]',
          'border border-[color-mix(in_srgb,var(--primary)_18%,var(--sidebar-border))]',
          'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
          'dark:bg-[color-mix(in_srgb,var(--primary)_12%,#141414)]',
          'dark:border-[color-mix(in_srgb,var(--primary)_22%,#2a2a2a)]',
          s.box,
          markClassName,
        )}
      >
        <Image
          src="/logo-light.png"
          alt="Profytron"
          width={s.img}
          height={s.img}
          className="absolute inset-0 m-auto object-contain p-[5px] dark:hidden"
          priority
        />
        <Image
          src="/logo-dark.png"
          alt="Profytron"
          width={s.img}
          height={s.img}
          className="absolute inset-0 m-auto object-contain p-[5px] hidden dark:block"
          priority
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-none min-w-0">
          <span className={cn('font-bold tracking-tight text-foreground truncate', s.word)}>
            PROFY<span className="text-primary">TRON</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
            Trading OS
          </span>
        </div>
      )}
    </div>
  );
}
