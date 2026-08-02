'use client';

import React, { useId, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SUPPORT_EMAIL } from '@/lib/seo/constants';
import { trackEvent } from '@/lib/analytics/track';

export function JoinWaitlistModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const emailId = useId();
  const messageId = useId();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setIsError(true);
      setMessage('Please enter a valid email');
      return;
    }

    setLoading(true);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        trackEvent('community_waitlist_submit', { status: 'success' });
        setIsError(false);
        setMessage('Thanks — you are subscribed for product and community updates.');
        setEmail('');
      } else {
        trackEvent('community_waitlist_submit', { status: 'error' });
        setIsError(true);
        setMessage(`Could not add you right now. Email ${SUPPORT_EMAIL} and we will add you.`);
      }
    } catch {
      trackEvent('community_waitlist_submit', { status: 'network_error' });
      setIsError(true);
      setMessage('Network error — try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>Get email updates</DialogTitle>
          <DialogDescription>
            Discord is already live — optional email so we can share product news, launches, and early
            invites when you prefer inbox over chat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor={emailId} className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              aria-invalid={isError || undefined}
              aria-describedby={message ? messageId : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            />
          </div>

          {message && (
            <div
              id={messageId}
              role={isError ? 'alert' : 'status'}
              className={`text-sm ${isError ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {message}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" className="min-h-[44px]" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-h-[44px]" disabled={loading}>
              {loading ? 'Saving…' : 'Subscribe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default JoinWaitlistModal;
