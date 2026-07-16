'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BRAND_MARK_SRC } from '@/components/brand/BrandLogoMark';

/** Tight crop of brand-mark.png — only the P glyph, no empty padding */
const BRAND_MARK_TIGHT_SRC = '/brand-mark-tight.png';

type BrandLogoProps = {
  /**
   * sm/md = compact, lg = legacy sidebar (unused), xl = auth pages,
   * home = homepage navbar, sidebar = dashboard sidebar (expanded),
   * sidebarCollapsed = dashboard sidebar (collapsed, icon only)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'home' | 'sidebar' | 'sidebarCollapsed';
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
    taglineMt: 6,
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
    taglineMt: 6,
  },
  lg: {
    // Footer / auth hero panels / workspace-bootstrap screen — tight-cropped
    // P (no empty padding) so it sits flush against the wordmark instead of
    // trailing left-padding making it look off-balance.
    markH: 54,
    cropW: 50,
    nudgeX: 0,
    markScale: 1,
    gap: 12,

    // Slightly larger wordmark without clipping
    word: 'text-[28px] sm:text-[30px] md:text-[31px]',

    // Elegant tagline
    tag: 'text-[11px] sm:text-[12px]',
    tagTracking: '0.34em',

    // Longer divider look
    ruleGap: 6,

    // Bring tagline closer to the wordmark
    taglineMt: 6,
  },
  xl: {
    // Login / register / auth pages — tight-cropped P (no empty padding),
    // bigger + clear gap to the wordmark so it lines up flush-left with
    // the heading/inputs below it instead of trailing off to the right.
    markH: 50,
    cropW: 46,
    nudgeX: 0,
    markScale: 1,
    gap: 14,
    word: 'text-[26px] sm:text-[28px] md:text-[30px] lg:text-[32px]',
    tag: 'text-[10px] sm:text-[11px]',
    tagTracking: '0.36em',
    ruleGap: 7,
    taglineMt: 8,
  },
  home: {
    // Uses brand-mark-tight.png (P only, no empty padding).
    markH: 42,
    cropW: 38,
    nudgeX: 0,
    markScale: 1,
    gap: 16,
    word: 'text-[24px] sm:text-[25px] md:text-[26px]',
    tag: 'text-[10px]',
    tagTracking: '0.34em',
    ruleGap: 6,
    taglineMt: 8,
  },
  sidebar: {
    // Dashboard sidebar, expanded — tight-cropped P (no empty padding),
    // left-aligned lockup with a modest gap to the wordmark.
    markH: 40,
    cropW: 36,
    nudgeX: 0,
    markScale: 1,
    gap: 9,
    word: 'text-[19px] sm:text-[20px] md:text-[21px]',
    tag: 'text-[9px] sm:text-[10px]',
    tagTracking: '0.32em',
    ruleGap: 5,
    taglineMt: 5,
  },
  sidebarCollapsed: {
    // Dashboard sidebar, collapsed — icon only, sized to match the expanded P for consistency.
    markH: 34,
    cropW: 31,
    nudgeX: 0,
    markScale: 1,
    gap: 0,
    word: 'text-[19px]',
    tag: 'text-[9px]',
    tagTracking: '0.32em',
    ruleGap: 5,
    taglineMt: 5,
  },
} as const;

function BrandMark({
  markH,
  cropW,
  nudgeX,
  markScale,
  className,
  src = BRAND_MARK_SRC,
  tight = false,
}: {
  markH: number;
  cropW: number;
  nudgeX: number;
  markScale: number;
  className?: string;
  src?: string;
  tight?: boolean;
}) {
  if (tight) {
    return (
      <span
        className="relative inline-block shrink-0 overflow-hidden"
        style={{ width: cropW, height: markH }}
        aria-hidden
      >
        <Image
          src={src}
          alt=""
          width={175}
          height={177}
          sizes="64px"
          className={cn('block h-full w-full object-contain object-left select-none', className)}
          priority
        />
      </span>
    );
  }

  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden"
      style={{ width: cropW, height: markH }}
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        width={624}
        height={400}
        sizes="160px"
        className={cn('absolute left-0 top-1/2 max-w-none object-contain object-left select-none', className)}
        style={{
          height: markH * markScale,
          width: 'auto',
          marginLeft: nudgeX,
          transform: 'translate(2px, -50%)',
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
  taglineMt,
}: {
  tag: string;
  tagTracking: string;
  ruleGap: number;
  taglineMt: number;
}) {
  return (
    <div
      className="flex w-full shrink-0 items-center"
      style={{ gap: ruleGap, marginTop: taglineMt }}
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
  const useTight =
    size === 'home' ||
    size === 'sidebar' ||
    size === 'sidebarCollapsed' ||
    size === 'xl' ||
    size === 'lg';

  return (
    <div
      className={cn(
        'brand-logo-lockup inline-flex max-w-full min-w-0 items-center',
        className,
      )}
      style={{ gap: s.gap, marginLeft: offsetX }}
    >
      <BrandMark
        markH={s.markH}
        cropW={s.cropW}
        nudgeX={s.nudgeX}
        markScale={s.markScale}
        className={markClassName}
        src={useTight ? BRAND_MARK_TIGHT_SRC : BRAND_MARK_SRC}
        tight={useTight}
      />

      {showWordmark ? (
        <div className="relative z-10 inline-flex w-fit min-w-0 flex-col justify-center">
          <span
            className={cn(
              'block whitespace-nowrap font-bold leading-none tracking-[-0.03em] text-foreground',
              s.word,
            )}
          >
            PROF<span className="text-destructive">Y</span>
            <span className="text-primary">TRON</span>
          </span>
          <TaglineRow
            tag={s.tag}
            tagTracking={s.tagTracking}
            ruleGap={s.ruleGap}
            taglineMt={s.taglineMt}
          />
        </div>
      ) : null}
    </div>
  );
}
