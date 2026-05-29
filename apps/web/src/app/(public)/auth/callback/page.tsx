import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-bg-base flex flex-col items-center justify-center noise">
          <p className="text-white/60 font-bold tracking-widest uppercase text-xs">
            Synchronizing Identity...
          </p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
