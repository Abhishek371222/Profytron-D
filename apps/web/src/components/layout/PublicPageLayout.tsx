import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Footer } from '@/components/home/Footer';
import { AmbientBackground } from '@/components/ui/AmbientBackground';

export function PublicPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-page-shell min-h-[100dvh] bg-background text-foreground relative isolate">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to main content
      </a>
      <AmbientBackground variant="landing" position="fixed" />
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} className="relative z-10 min-w-0 focus:outline-none">
        <div className="pt-[calc(5.25rem+env(safe-area-inset-top,0px))] public-content-wrap">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
