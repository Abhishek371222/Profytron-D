import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Footer } from '@/components/home/Footer';
import { CursorWrapper } from '@/components/layout/CursorWrapper';

export function PublicPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden relative">
      <CursorWrapper />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] mix-blend-overlay opacity-20" />
      </div>
      <PublicNavbar />
      <div className="pt-28">{children}</div>
      <Footer />
    </main>
  );
}
