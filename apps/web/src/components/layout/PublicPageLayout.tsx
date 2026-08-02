'use client';

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
  return (
    <SceneProvider>
      <div className="public-page-shell min-h-[100dvh] bg-background text-foreground relative isolate">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Skip to main content
        </a>
        <AmbientDepthBackground
          variant="marketing"
          position="fixed"
          enableAmbientScene={enableAmbientScene}
        />
        <PublicNavbar />
        <main id="main-content" tabIndex={-1} className="relative z-10 min-w-0 focus:outline-none">
          <MarketingTransitionFrame
            transition={transition}
            className="pt-[calc(5.25rem+env(safe-area-inset-top,0px))] public-content-wrap"
          >
            {children}
          </MarketingTransitionFrame>
          <Footer />
        </main>
      </div>
    </SceneProvider>
  );
}
