'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { tutorialApi } from '@/lib/api/tutorial';
import { useTutorialStore } from '@/lib/stores/useTutorialStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { isAdminUser } from '@/lib/utils';

const TUTORIAL_QUERY_KEY = ['tutorial-progress', 'main'];
const JUST_ONBOARDED_KEY = 'profytron_just_onboarded';

/** First-visit prompt: "want a tour?" Shown once, on the dashboard overview —
 * only for a user who just finished onboarding in this browser session (see the
 * sessionStorage signal set in onboarding/risk/page.tsx). This deliberately does
 * NOT trigger for existing users whose tour status merely defaults to NOT_STARTED
 * because the tutorial feature is new — they can still start it manually from
 * Settings or the account menu. */
export function TutorialPrompt() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const queryClient = useQueryClient();
  const start = useTutorialStore((s) => s.start);
  const tourActive = useTutorialStore((s) => s.active);
  const [dismissed, setDismissed] = React.useState(false);
  const [justOnboarded, setJustOnboarded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setJustOnboarded(window.sessionStorage.getItem(JUST_ONBOARDED_KEY) === '1');
  }, []);

  const enabled = sessionReady && !isAdminUser(user) && pathname === '/dashboard' && justOnboarded;

  const { data } = useQuery({
    queryKey: TUTORIAL_QUERY_KEY,
    queryFn: () => tutorialApi.getProgress('main'),
    staleTime: 60_000,
    enabled,
  });

  if (!enabled || dismissed || tourActive || !data || data.status !== 'NOT_STARTED') {
    return null;
  }

  const handleStart = () => {
    setDismissed(true);
    window.sessionStorage.removeItem(JUST_ONBOARDED_KEY);
    start();
  };

  const handleSkip = () => {
    setDismissed(true);
    window.sessionStorage.removeItem(JUST_ONBOARDED_KEY);
    tutorialApi.updateProgress('main', 'SKIPPED').catch(() => {});
    queryClient.invalidateQueries({ queryKey: TUTORIAL_QUERY_KEY });
  };

  return (
    <Dialog
      open
      onOpenChange={(open: boolean) => {
        if (!open) handleSkip();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Want a quick tour of Profytron?</DialogTitle>
          <DialogDescription>
            We&apos;ll walk you through connecting a broker, funding your wallet, and finding your
            first strategy — about 2 minutes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={handleStart}>Start tour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
