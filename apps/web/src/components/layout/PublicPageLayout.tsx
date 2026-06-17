import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Footer } from '@/components/home/Footer';
import { AmbientBackground } from '@/components/ui/AmbientBackground';

export function PublicPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative isolate">
      <AmbientBackground variant="landing" position="fixed" />
      {/* Navbar outside scroll/overflow ancestors so position:fixed stays viewport-locked */}
      <PublicNavbar />
      <main className="relative z-10">
        <div className="pt-[calc(5.25rem+env(safe-area-inset-top,0px))]">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
