/**
 * Marketing cinematic route transitions (GSAP).
 * Dashboard / admin / auth must NOT use these — keep fast.
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { SceneTransition } from '@/platform/experience/scene-registry';
import { isReducedMotionPreferred } from '@/platform/motion/motion-accessibility';

const MARKETING_PREFIXES = [
  '/',
  '/pricing',
  '/about',
  '/blog',
  '/guides',
  '/brokers',
  '/community',
  '/careers',
  '/contact',
  '/help',
  '/docs',
  '/api-reference',
  '/status',
  '/privacy',
  '/terms',
  '/cookies',
  '/risk-disclosure',
];

function isMarketingPath(path: string): boolean {
  if (path === '/') return true;
  return MARKETING_PREFIXES.some(
    (p) => p !== '/' && (path === p || path.startsWith(`${p}/`)),
  );
}

async function runTransition(
  el: HTMLElement,
  kind: SceneTransition = 'depthShift',
) {
  if (isReducedMotionPreferred()) {
    el.style.opacity = '1';
    return;
  }
  const { gsap } = await import('gsap');
  const from: Record<string, unknown> = { opacity: 0 };
  const to: Record<string, unknown> = { opacity: 1, duration: 0.55, ease: 'power2.out' };

  switch (kind) {
    case 'cameraPush':
      from.y = 28;
      from.scale = 0.985;
      to.y = 0;
      to.scale = 1;
      break;
    case 'objectMorph':
      from.filter = 'blur(8px)';
      to.filter = 'blur(0px)';
      from.y = 16;
      to.y = 0;
      break;
    case 'logoDissolve':
      from.opacity = 0;
      from.scale = 1.04;
      to.scale = 1;
      break;
    case 'particleTransition':
      from.y = 12;
      from.opacity = 0;
      to.stagger = 0.02;
      break;
    case 'depthShift':
    default:
      from.y = 20;
      from.filter = 'blur(4px)';
      to.y = 0;
      to.filter = 'blur(0px)';
      break;
  }

  // TweenVars namespace typing is unreliable across gsap package variants.
  gsap.fromTo(el, from as object, to as object);
}

export function MarketingTransitionFrame({
  children,
  transition = 'depthShift',
  className,
}: {
  children: React.ReactNode;
  transition?: SceneTransition;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el || !pathname || !isMarketingPath(pathname)) return;
    void runTransition(el, transition);
  }, [pathname, transition]);

  return (
    <div ref={ref} className={className} data-marketing-transition={transition}>
      {children}
    </div>
  );
}

export { isMarketingPath };
