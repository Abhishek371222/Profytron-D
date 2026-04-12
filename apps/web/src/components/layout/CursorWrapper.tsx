'use client';

import dynamic from 'next/dynamic';

// Dynamically import the heavy/interactive cursor only on the client
// This wrapper exists because 'ssr: false' is only allowed in Client Components.
const DynamicCursor = dynamic(
  () => import('@/components/ui/CinematicCursor').then((mod) => mod.CinematicCursor),
  { ssr: false }
);

export function CursorWrapper() {
  return <DynamicCursor />;
}
