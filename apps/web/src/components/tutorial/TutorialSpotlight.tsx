'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

export type SpotlightRect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const BLUR_PX = 3;

/** Full-viewport dim + blur with a rectangular cutout around the active tour target,
 * using a two-layer mask (mask-composite: exclude) so the cutout affects both the
 * tint and the blur. Purely decorative — pointer-events stay off so the real
 * spotlighted element (and anything else on the page) remains clickable underneath. */
export function TutorialSpotlight({ rect }: { rect: SpotlightRect | null }) {
  if (!rect) return null;

  const maskSize = `${rect.width + PAD * 2}px ${rect.height + PAD * 2}px`;
  const maskPos = `${rect.left - PAD}px ${rect.top - PAD}px`;

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
            background: 'rgba(6,8,12,0.62)',
            backdropFilter: `blur(${BLUR_PX}px)`,
            WebkitBackdropFilter: `blur(${BLUR_PX}px)`,
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
        className="fixed z-[46] pointer-events-none rounded-xl border-2 border-primary animate-glow-teal"
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
