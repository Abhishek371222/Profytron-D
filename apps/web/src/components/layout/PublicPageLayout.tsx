import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Footer } from '@/components/home/Footer';
import { AmbientBackground } from '@/components/ui/AmbientBackground';

export function PublicPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-page-shell min-h-[100dvh] bg-background text-foreground relative isolate">
      <AmbientBackground variant="landing" position="fixed" />
      <PublicNavbar />
      <main className="relative z-10 min-w-0">
        <div className="pt-[calc(5.25rem+env(safe-area-inset-top,0px))] public-content-wrap">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
