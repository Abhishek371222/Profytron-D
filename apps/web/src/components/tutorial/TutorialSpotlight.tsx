'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

export type SpotlightRect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const BLUR_PX = 3;

/** Full-viewport dim (+ optional blur) with a rectangular cutout around the active
 * tour target, using a two-layer mask (mask-composite: exclude) so the cutout
 * affects both the tint and the blur. Purely decorative — pointer-events stay off
 * so the real spotlighted element (and anything else on the page) stays clickable.
 *
 * The `mobile` variant drops the blur (phones found the whole page blurring
 * distracting) and lifts the glow ring above the bottom navigation (z-50) so the
 * highlighted bottom-nav icon reads clearly. */
export function TutorialSpotlight({ rect, mobile = false }: { rect: SpotlightRect | null; mobile?: boolean }) {
  if (!rect) return null;

  const maskSize = `${rect.width + PAD * 2}px ${rect.height + PAD * 2}px`;
  const maskPos = `${rect.left - PAD}px ${rect.top - PAD}px`;
  const blurPx = mobile ? 0 : BLUR_PX;
  const tint = mobile ? 'rgba(6,8,12,0.48)' : 'rgba(6,8,12,0.62)';

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[45] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={
          {
            background: tint,
            backdropFilter: blurPx ? `blur(${blurPx}px)` : undefined,
            WebkitBackdropFilter: blurPx ? `blur(${blurPx}px)` : undefined,
            WebkitMaskImage: 'linear-gradient(#000,#000), linear-gradient(#000,#000)',
            maskImage: 'linear-gradient(#000,#000), linear-gradient(#000,#000)',
            WebkitMaskSize: `100% 100%, ${maskSize}`,
            maskSize: `100% 100%, ${maskSize}`,
            WebkitMaskPosition: `0 0, ${maskPos}`,
            maskPosition: `0 0, ${maskPos}`,
            WebkitMaskRepeat: 'no-repeat, no-repeat',
            maskRepeat: 'no-repeat, no-repeat',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          } as CSSProperties
        }
      />
      <motion.div
        layout
        className={`fixed pointer-events-none rounded-xl border-2 border-primary animate-glow-teal ${
          mobile ? 'z-[55]' : 'z-[46]'
        }`}
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </>
  );
}
