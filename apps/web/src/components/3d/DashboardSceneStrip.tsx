/**
 * DashboardSceneStrip — allowlisted feature heroes only.
 * Pages declare a SceneRegistry key; SceneManager owns WebGL.
 */

'use client';

import { SceneSlot } from '@/components/3d/SceneSlot';
import type { SceneKey } from '@/platform/experience/scene-registry';
import { cn } from '@/lib/utils';

export function DashboardSceneStrip({
  sceneKey,
  className,
  label,
}: {
  sceneKey: SceneKey;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn('dashboard-scene-strip', className)} aria-label={label}>
      <SceneSlot
        sceneKey={sceneKey}
        role="interactive"
        className="absolute inset-0 min-h-[9rem] w-full"
        showCssDepth
      />
    </div>
  );
}
