'use client';

import dynamic from 'next/dynamic';

function LoginPageShell() {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-background p-4 sm:p-6">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.2),transparent_40%)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <div className="w-full overflow-hidden rounded-3xl border border-border bg-card/95 p-7 sm:p-10 lg:p-12 shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="mb-8 h-10 w-48 animate-pulse rounded-xl bg-foreground/5" />
          <div className="mb-6 space-y-3">
            <div className="h-12 w-full animate-pulse rounded-xl bg-foreground/5" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-foreground/5" />
          </div>
          <div className="space-y-5">
            <div className="h-12 w-full animate-pulse rounded-xl bg-foreground/5" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-foreground/5" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-primary/30" />
          </div>
        </div>
      </div>
    </main>
  );
}

const LoginPageClient = dynamic(() => import('./LoginPageClient'), {
  ssr: false,
  loading: () => <LoginPageShell />,
});

export default function LoginPage() {
  return <LoginPageClient />;
}
