'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUp, Loader2, Plus } from 'lucide-react';

export function CoachComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(value.trim()) && !disabled;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className={cn(
          'flex items-end gap-1 rounded-2xl border border-[var(--card-border)] bg-card px-2 py-2 shadow-sm',
          'transition focus-within:border-[#348398]/45 focus-within:ring-2 focus-within:ring-[#348398]/15',
        )}
      >
        <button
          type="button"
          className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="More options"
          title="More"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <textarea
          ref={ref}
          value={value}
          rows={1}
          disabled={disabled}
          placeholder={placeholder || 'Ask Alpha Coach anything…'}
          onChange={(e) => onChange(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/80 disabled:opacity-60"
          aria-label="Message Alpha Coach"
        />
        <motion.button
          type="submit"
          disabled={!canSend}
          whileTap={canSend ? { scale: 0.92 } : undefined}
          className={cn(
            'mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition',
            canSend
              ? 'bg-[#348398] text-white hover:bg-[#2d7284]'
              : 'bg-muted text-muted-foreground',
          )}
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          )}
        </motion.button>
      </form>
      <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
        Alpha Coach can make mistakes. Check important trading info.
      </p>
    </div>
  );
}
