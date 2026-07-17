'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Canonical Profytron assets from /logo folder */
export const BRAND_MARK_SRC = '/brand-mark.png';
/** Tight crop of brand-mark.png — only the P glyph, no empty padding */
export const BRAND_MARK_TIGHT_SRC = '/brand-mark-tight.png';
export const BRAND_LOCKUP_DARK_SRC = '/brand-lockup.png';
export const BRAND_LOCKUP_LIGHT_SRC = '/brand-lockup-light.png';
/** @deprecated use BRAND_LOCKUP_DARK_SRC */
export const BRAND_LOCKUP_SRC = BRAND_LOCKUP_DARK_SRC;

const AMBIENT_SIZES = {
  sm: 96,
  md: 128,
  lg: 168,
  xl: 208,
} as const;

export function BrandLogoMark({
  size = 48,
  className,
  priority = false,
  tight = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  /** Use the tight-cropped glyph (no empty padding) so it visually fills `size` */
  tight?: boolean;
}) {
  return (
    <Image
      src={tight ? BRAND_MARK_TIGHT_SRC : BRAND_MARK_SRC}
      alt="Profytron"
      width={size}
      height={size}
      priority={priority}
      className={cn(
        'h-auto w-auto max-w-full object-contain select-none',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

/** Ambient logo visual — pulsing rings + soft glow, blends into any surface */
export function BrandLogoAmbient({
  size = 'lg',
  className,
}: {
  size?: keyof typeof AMBIENT_SIZES;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const markSize = AMBIENT_SIZES[size];

  return (
    <div
      className={cn(
        'brand-logo-ambient relative mx-auto flex aspect-square w-full max-w-[min(100%,22rem)] items-center justify-center',
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--primary)_14%,transparent)_0%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-[8%] bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--brand-crimson)_8%,transparent)_0%,transparent_70%)]" />

      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="pointer-events-none absolute rounded-full border border-primary/12"
          style={{ inset: `${10 + i * 9}%` }}
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.03, 1],
                  opacity: [0.25, 0.55, 0.25],
                }
          }
          transition={{
            duration: 3.2 + i * 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.35,
          }}
        />
      ))}

      <motion.div
        className="pointer-events-none absolute rounded-full border border-[color-mix(in_srgb,var(--brand-crimson)_20%,transparent)]"
        style={{ inset: '24%' }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="pointer-events-none absolute h-[38%] w-[38%] rounded-full bg-primary/20 blur-2xl"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.15, 1],
                opacity: [0.35, 0.6, 0.35],
              }
        }
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10"
        animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BrandLogoMark size={markSize} priority />
      </motion.div>
    </div>
  );
}
