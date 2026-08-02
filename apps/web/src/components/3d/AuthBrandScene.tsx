/**
 * Auth brand mark — brandLogo scene via SceneManager (poster on mobile/a11y).
 */

'use client';

import { SceneSlot } from '@/components/3d/SceneSlot';
import { cn } from '@/lib/utils';

export function AuthBrandScene({ className }: { className?: string }) {
  return (
    <div className={cn('auth-brand-scene', className)}>
      <SceneSlot
        sceneKey="brandLogo"
        role="ambient"
        className="h-full w-full min-h-0"
        alt="Profytron"
      />
    </div>
  );
}
