'use client';

import { useEffect, useState } from 'react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Footer } from '@/components/home/Footer';
import { AmbientDepthBackground } from '@/components/3d/AmbientDepthBackground';
import { SceneProvider } from '@/components/3d/SceneProvider';
import { MarketingTransitionFrame } from '@/components/3d/MarketingTransitionFrame';
import type { SceneTransition } from '@/platform/experience/scene-registry';

export function PublicPageLayout({
  children,
  transition = 'depthShift',
  enableAmbientScene = true,
}: {
  children: React.ReactNode;
  transition?: SceneTransition;
  enableAmbientScene?: boolean;
}) {
  // Mobile: keep WebGL ambient off by default (PT-W01 / W02 LCP)
  const [allowAmbient, setAllowAmbient] = useState(false);

  useEffect(() => {
    if (!enableAmbientScene) {
      setAllowAmbient(false);
      return;
    }
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    setAllowAmbient(!isMobile);
  }, [enableAmbientScene]);

  return (
    <SceneProvider>
      <div className="public-page-shell relative isolate min-h-[100dvh] min-w-0 overflow-x-hidden bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip to main content
        </a>
        <AmbientDepthBackground
          variant="marketing"
          position="fixed"
          enableAmbientScene={allowAmbient}
        />
        <PublicNavbar />
        <main id="main-content" tabIndex={-1} className="relative z-10 min-w-0 focus:outline-none">
          <MarketingTransitionFrame
            transition={transition}
            className="public-content-wrap pt-[calc(5.25rem+env(safe-area-inset-top,0px))]"
          >
            {children}
          </MarketingTransitionFrame>
          <Footer />
        </main>
      </div>
    </SceneProvider>
  );
}
