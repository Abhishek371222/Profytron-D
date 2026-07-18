'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Loader2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { CoachMessage } from '@/lib/api/coach';
import { CoachMessageBody } from '@/components/alpha-coach/CoachMessageBody';
import { CoachBrandMark } from '@/components/alpha-coach/CoachBrandMark';

export function CoachMessageRow({
  message,
  isStreaming,
  onRegenerate,
}: {
  message: CoachMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === 'USER';
  const isExec = message.role === 'EXECUTIVE';
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(100%,28rem)] rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed text-foreground">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex w-full gap-3">
      <div className="mt-0.5 shrink-0">
        <CoachBrandMark size={28} pulse={Boolean(isStreaming)} />
      </div>
      <div className="min-w-0 flex-1">
        {isExec && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#348398]">
            Executive
          </p>
        )}
        <div className="text-[15px] leading-[1.75] text-foreground/90">
          <CoachMessageBody content={message.content} />
          {isStreaming && (
            <motion.span
              className="ml-0.5 inline-block h-[1.05em] w-[2px] bg-[#348398] align-[-0.1em]"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          )}
        </div>

        {!isStreaming && (
          <div className="mt-2 flex items-center gap-0.5 text-muted-foreground opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted hover:text-foreground"
              aria-label="Copy"
              title="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#348398]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted hover:text-foreground"
                aria-label="Regenerate"
                title="Regenerate"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted hover:text-foreground"
              aria-label="Helpful"
              title="Helpful"
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#973336]/10 hover:text-[#973336]"
              aria-label="Not helpful"
              title="Not helpful"
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CoachErrorBanner({
  text,
  onRetry,
}: {
  text: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm">
      <p className="min-w-0 flex-1 leading-relaxed text-destructive/90">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export function CoachTypingRow() {
  return (
    <div className="flex items-center gap-3">
      <CoachBrandMark size={28} pulse />
      <div className="flex items-center gap-1.5 py-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#348398]"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.7,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
        <Loader2 className="sr-only" />
      </div>
    </div>
  );
}
