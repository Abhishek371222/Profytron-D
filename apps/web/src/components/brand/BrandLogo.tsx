'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BRAND_MARK_SRC } from '@/components/brand/BrandLogoMark';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
  offsetX?: number;
};

/** Transparent P mark + HTML wordmark — blends on any surface (no opaque PNG box) */
const SIZE = {
  sm: {
    markH: 38,
    cropW: 26,
    nudgeX: -11,
    markScale: 1.42,
    gap: 0,
    word: 'text-[15px] sm:text-[16px]',
    tag: 'text-[8px]',
    tagTracking: '0.32em',
    ruleGap: 5,
  },
  md: {
    markH: 46,
    cropW: 30,
    nudgeX: -13,
    markScale: 1.44,
    gap: 0,
    word: 'text-[17px] sm:text-[19px]',
    tag: 'text-[8px] sm:text-[9px]',
    tagTracking: '0.34em',
    ruleGap: 6,
  },
  lg: {
    markH: 54,
    cropW: 36,
    nudgeX: -15,
    markScale: 1.46,
    gap: 0,
    word: 'text-[20px] sm:text-[22px] md:text-[24px]',
    tag: 'text-[9px] sm:text-[10px]',
    tagTracking: '0.36em',
    ruleGap: 6,
  },
  xl: {
    markH: 62,
    cropW: 42,
    nudgeX: -17,
    markScale: 1.48,
    gap: 0,
    word: 'text-[24px] sm:text-[26px] md:text-[28px] lg:text-[30px]',
    tag: 'text-[9px] sm:text-[10px] md:text-[11px]',
    tagTracking: '0.38em',
    ruleGap: 7,
  },
} as const;

function BrandMark({
  markH,
  cropW,
  nudgeX,
  markScale,
  className,
}: {
  markH: number;
  cropW: number;
  nudgeX: number;
  markScale: number;
  className?: string;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-start overflow-hidden"
      style={{ width: cropW, height: markH }}
      aria-hidden
    >
      <Image
        src={BRAND_MARK_SRC}
        alt=""
        width={624}
        height={400}
        sizes="80px"
        className={cn('block max-w-none object-contain object-left select-none', className)}
        style={{
          height: markH * markScale,
          width: 'auto',
          marginLeft: nudgeX,
        }}
        priority
      />
    </span>
  );
}

function TaglineRow({
  tag,
  tagTracking,
  ruleGap,
}: {
  tag: string;
  tagTracking: string;
  ruleGap: number;
}) {
  return (
    <div
      className="mt-1.5 flex w-full items-center"
      style={{ gap: ruleGap }}
      aria-hidden
    >
      <span className="h-px min-w-[6px] flex-1 bg-muted-foreground/35" />
      <span
        className={cn(
          'shrink-0 font-medium uppercase text-muted-foreground',
          tag,
        )}
        style={{ letterSpacing: tagTracking }}
      >
        Trading OS
      </span>
      <span className="h-px min-w-[6px] flex-1 bg-muted-foreground/35" />
    </div>
  );
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  className,
  markClassName,
  offsetX = 0,
}: BrandLogoProps) {
  const s = SIZE[size];

  return (
    <div
      className={cn('brand-logo-lockup inline-flex min-w-0 items-center', className)}
      style={{ gap: s.gap, marginLeft: offsetX || undefined }}
    >
      <BrandMark
        markH={s.markH}
        cropW={s.cropW}
        nudgeX={s.nudgeX}
        markScale={s.markScale}
        className={markClassName}
      />

      {showWordmark ? (
        <div className="inline-flex w-fit min-w-0 flex-col justify-center leading-none">
          <span
            className={cn(
              'whitespace-nowrap font-bold tracking-[-0.02em] text-foreground',
              s.word,
            )}
          >
            PROF<span className="text-destructive">Y</span>
            <span className="text-primary">TRON</span>
          </span>
          <TaglineRow tag={s.tag} tagTracking={s.tagTracking} ruleGap={s.ruleGap} />
        </div>
      ) : null}
    </div>
  );
}
