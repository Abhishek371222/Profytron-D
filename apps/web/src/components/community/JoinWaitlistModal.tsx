'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function JoinWaitlistModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void; }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      if (res.ok) {
        setMessage('Thanks — we added you to the waitlist.');
        setEmail('');
      } else {
        setMessage('Could not add to waitlist. Try mailto:community@profytron.com');
      }
    } catch (err) {
      setMessage('Network error — try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0b0b0f] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Join the Community Waitlist</DialogTitle>
          <DialogDescription>Enter your email and we'll notify you when the Discord server and community channels go live.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <input
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded-xl bg-white/4 border border-white/6 text-white outline-none"
          />

          {message && <div className="text-sm text-white/60">{message}</div>}

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" onClick={submit} disabled={loading}>{loading ? 'Joining…' : 'Join Waitlist'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default JoinWaitlistModal;
