import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Footer } from '@/components/home/Footer';
import { CursorWrapper } from '@/components/layout/CursorWrapper';
import { AmbientBackground } from '@/components/ui/AmbientBackground';

export function PublicPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden relative">
      <CursorWrapper />
      <AmbientBackground variant="landing" position="fixed" />
      <PublicNavbar />
      <div className="relative z-10 pt-28">{children}</div>
      <Footer />
    </main>
  );
}
