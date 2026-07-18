'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Headset, Clock3 } from 'lucide-react';
import type { CoachEscalationStatus } from '@/lib/api/coach';

function formatRemain(ms: number) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ExecutiveWaitBar({
  status,
  slaDeadline,
  createdAt,
  claimedBy,
}: {
  status: CoachEscalationStatus;
  slaDeadline?: string | null;
  createdAt?: string | null;
  claimedBy?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}) {
  // Lazy initializer runs once on mount — the one place `Date.now()` is
  // allowed to be impure. Everything else derives from this instead of
  // calling Date.now() again, which useMemo's purity rule disallows.
  const [mountTime] = React.useState(() => Date.now());


  const deadlineMs = React.useMemo(() => {
    if (slaDeadline) return new Date(slaDeadline).getTime();
    if (createdAt) return new Date(createdAt).getTime() + 15 * 60 * 1000;
    return mountTime + 15 * 60 * 1000;
  }, [slaDeadline, createdAt, mountTime]);

  const [now, setNow] = React.useState(() => mountTime);

  React.useEffect(() => {
    if (status !== 'OPEN') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const remain = Math.max(0, deadlineMs - now);
  const overdue = status === 'OPEN' && remain <= 0;
  const initials =
    claimedBy?.fullName
      ?.split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'EX';

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5',
        status === 'CLAIMED'
          ? 'border-[#348398]/30 bg-[#348398]/8'
          : overdue
            ? 'border-[#973336]/30 bg-[#973336]/8'
            : 'border-[var(--card-border)] bg-muted/40',
      )}
    >
      <div className="relative shrink-0">
        {claimedBy?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={claimedBy.avatarUrl}
            alt={claimedBy.fullName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white',
              status === 'CLAIMED' ? 'bg-[#348398]' : 'bg-[#348398]',
            )}
          >
            {status === 'CLAIMED' ? initials : <Headset className="h-4 w-4" />}
          </div>
        )}
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card',
            status === 'CLAIMED' ? 'bg-[#348398]' : 'animate-pulse bg-[#973336]',
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {status === 'CLAIMED'
            ? `${claimedBy?.fullName || 'Executive'} is here`
            : 'All executives are busy right now'}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          {status === 'CLAIMED'
            ? 'They’ll reply in this chat — you’re connected live.'
            : overdue
              ? 'Still in queue. Stay on this chat — an executive will join shortly.'
              : 'One usually joins within about 15 minutes. Hang tight in this chat.'}
        </p>
      </div>

      {status === 'OPEN' && (
        <div className="inline-flex shrink-0 flex-col items-end rounded-lg border border-[var(--card-border)] bg-card px-2.5 py-1.5">
          <span className="inline-flex items-center gap-1 font-mono text-sm font-bold tabular-nums text-foreground">
            <Clock3 className="h-3.5 w-3.5 text-[#348398]" />
            {overdue ? '—' : formatRemain(remain)}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            {overdue ? 'Queued' : 'min'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
