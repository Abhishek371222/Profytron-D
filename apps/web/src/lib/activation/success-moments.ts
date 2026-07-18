'use client';

import { toast } from 'sonner';

const SEEN_KEY = 'profytron_success_moments';

function seenSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markSeen(id: string) {
  const s = seenSet();
  s.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
}

/** Subtle one-shot celebrations — never blocks next action. */
export function celebrateSuccessMoment(
  id: string,
  message: string,
  description?: string,
) {
  if (typeof window === 'undefined') return;
  if (seenSet().has(id)) return;
  markSeen(id);
  toast.success(message, {
    description,
    duration: 4200,
  });
}
