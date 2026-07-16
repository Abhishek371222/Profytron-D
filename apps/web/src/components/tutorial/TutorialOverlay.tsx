'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useBreakpoint } from '@/lib/hooks/useBreakpoint';
import { useAccountContext } from '@/hooks/useAccountContext';
import { useTutorialStore } from '@/lib/stores/useTutorialStore';
import { TutorialSpotlight, type SpotlightRect } from './TutorialSpotlight';
import { TutorialCard } from './TutorialCard';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { TourStep } from '@/lib/tours/mainTour';

const CARD_GAP = 16;
const FIND_TARGET_TIMEOUT_MS = 4000;
const FIND_TARGET_POLL_MS = 120;

function computeCardPosition(
  rect: SpotlightRect,
  placement: TourStep['placement'],
  size: { width: number; height: number },
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'top':
      top = rect.top - size.height - CARD_GAP;
      left = rect.left + rect.width / 2 - size.width / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - size.height / 2;
      left = rect.left - size.width - CARD_GAP;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - size.height / 2;
      left = rect.left + rect.width + CARD_GAP;
      break;
    case 'bottom':
    default:
      top = rect.top + rect.height + CARD_GAP;
      left = rect.left + rect.width / 2 - size.width / 2;
      break;
  }

  top = Math.min(Math.max(top, CARD_GAP), vh - size.height - CARD_GAP);
  left = Math.min(Math.max(left, CARD_GAP), vw - size.width - CARD_GAP);
  return { top, left };
}

export function TutorialOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const active = useTutorialStore((s) => s.active);
  const steps = useTutorialStore((s) => s.steps);
  const currentIndex = useTutorialStore((s) => s.currentIndex);
  const actionSatisfied = useTutorialStore((s) => s.actionSatisfied);
  const next = useTutorialStore((s) => s.next);
  const back = useTutorialStore((s) => s.back);
  const skip = useTutorialStore((s) => s.skip);
  const notifyAction = useTutorialStore((s) => s.notifyAction);
  const { hasBrokerAccount } = useAccountContext();

  const step = steps[currentIndex];
  const isLastStep = currentIndex === steps.length - 1;

  // Finishing the tour should land the user back on the dashboard overview,
  // regardless of which page the last step happened to be on.
  const handleNext = React.useCallback(() => {
    next();
    if (isLastStep) {
      router.push('/dashboard');
    }
  }, [next, isLastStep, router]);

  const { isMdUp: isDesktop } = useBreakpoint();
  const [rect, setRect] = React.useState<SpotlightRect | null>(null);
  const [cardPos, setCardPos] = React.useState<{ top: number; left: number } | null>(null);
  const [searchExhausted, setSearchExhausted] = React.useState(false);
  const [isEmptyState, setIsEmptyState] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const cardMeasureRef = React.useRef<HTMLDivElement>(null);

  // Reset immediately whenever the step changes — even before a cross-page
  // navigation finishes — so the previous step's position/card never bleeds
  // into the next step while the new page is still loading.
  React.useEffect(() => {
    setRect(null);
    setCardPos(null);
    setSearchExhausted(false);
    setIsEmptyState(false);
  }, [step]);

  // Portal target only exists client-side, after mount.
  React.useEffect(() => setMounted(true), []);

  // A step that waits for a broker connection is already satisfied if the user
  // connected one earlier (e.g. replaying the tour) — don't force a reconnect.
  React.useEffect(() => {
    if (active && step?.waitForAction === 'broker-connected' && hasBrokerAccount) {
      notifyAction('broker-connected');
    }
  }, [active, step, hasBrokerAccount, notifyAction]);

  // Navigate to the step's page if we're not already there.
  React.useEffect(() => {
    if (!active || !step) return;
    if (pathname !== step.page) {
      router.push(step.page);
    }
  }, [active, step, pathname, router]);

  // Locate the target element once on the right page: scroll it into view, measure it,
  // and keep tracking it on scroll/resize until the step changes.
  React.useEffect(() => {
    if (!active || !step || pathname !== step.page) return;

    let cancelled = false;
    let elapsed = 0;
    let pollTimer: number | undefined;

    const measure = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    // If the step declares an "empty state" indicator (e.g. an empty-results
    // message) and it's present in the DOM, spotlight that instead of the
    // normal target — and let the caller know so it can swap in different copy.
    const resolveTarget = (): { el: HTMLElement; empty: boolean } | null => {
      if (step.emptySelector && document.querySelector(step.emptySelector)) {
        const emptyEl = document.querySelector<HTMLElement>(step.emptyTarget ?? step.emptySelector);
        if (emptyEl) return { el: emptyEl, empty: true };
      }
      const el = document.querySelector<HTMLElement>(step.target);
      return el ? { el, empty: false } : null;
    };

    const recompute = () => {
      const found = resolveTarget();
      if (found) measure(found.el);
    };

    const tryFind = () => {
      if (cancelled) return;
      const found = resolveTarget();
      if (found) {
        setIsEmptyState(found.empty);
        found.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
          if (!cancelled) measure(found.el);
        }, 320);
        window.addEventListener('scroll', recompute, true);
        window.addEventListener('resize', recompute);
        return;
      }
      elapsed += FIND_TARGET_POLL_MS;
      if (elapsed < FIND_TARGET_TIMEOUT_MS) {
        pollTimer = window.setTimeout(tryFind, FIND_TARGET_POLL_MS);
      } else if (!cancelled) {
        // Target never showed up. Rather than silently vanishing the step (which
        // just looks like the tour skipped itself), fall back to showing the card
        // with no spotlight so the user can still read it and choose Next/Skip.
        setSearchExhausted(true);
      }
    };
    tryFind();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [active, step, pathname]);

  // Measure the (desktop-only) floating card once we have a target rect, then position it.
  React.useLayoutEffect(() => {
    if (!isDesktop || !rect || !step) return;
    const node = cardMeasureRef.current;
    if (!node) return;
    const size = { width: node.offsetWidth, height: node.offsetHeight };
    setCardPos(computeCardPosition(rect, step.placement, size));
  }, [isDesktop, rect, step]);

  // Keyboard shortcuts: Esc skips, Enter/→ always advances (recommended actions never block).
  React.useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skip();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, skip, handleNext]);

  if (!active || !step || !mounted) return null;

  // Swap in "empty state" copy when the step detected one (e.g. no strategies
  // match the marketplace filters) instead of describing content that isn't there.
  const displayStep = isEmptyState && step.emptyBody ? { ...step, body: step.emptyBody } : step;

  return createPortal(
    <>
      <TutorialSpotlight rect={rect} />

      {isDesktop ? (
        <>
          {/* Hidden measurement pass so the card can be positioned before it's shown */}
          <div ref={cardMeasureRef} className="fixed -top-[9999px] left-0 pointer-events-none opacity-0" aria-hidden>
            <TutorialCard
              step={displayStep}
              index={currentIndex}
              total={steps.length}
              actionSatisfied={actionSatisfied}
              onBack={back}
              onNext={handleNext}
              onSkip={skip}
            />
          </div>

          <AnimatePresence>
            {rect && cardPos ? (
              <motion.div
                key={step.id}
                className="fixed z-[47]"
                style={{ top: cardPos.top, left: cardPos.left }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <TutorialCard
                  step={displayStep}
                  index={currentIndex}
                  total={steps.length}
                  actionSatisfied={actionSatisfied}
                  onBack={back}
                  onNext={handleNext}
                  onSkip={skip}
                />
              </motion.div>
            ) : searchExhausted ? (
              // Couldn't find this step's target on the page — show the card anyway
              // (centered, no spotlight) so the step is never silently invisible.
              <motion.div
                key={step.id}
                className="fixed z-[47] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <TutorialCard
                  step={displayStep}
                  index={currentIndex}
                  total={steps.length}
                  actionSatisfied={actionSatisfied}
                  onBack={back}
                  onNext={handleNext}
                  onSkip={skip}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : (
        <Sheet
          open
          onOpenChange={(open: boolean) => {
            if (!open) skip();
          }}
        >
          <SheetContent side="bottom" showCloseButton={false}>
            <TutorialCard
              step={displayStep}
              index={currentIndex}
              total={steps.length}
              actionSatisfied={actionSatisfied}
              onBack={back}
              onNext={handleNext}
              onSkip={skip}
              className="w-full max-w-none border-none shadow-none p-4"
            />
          </SheetContent>
        </Sheet>
      )}
    </>,
    document.body,
  );
}
