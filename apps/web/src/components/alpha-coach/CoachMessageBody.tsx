'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function CoachMessageBody({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = React.useMemo(() => {
    let raw = content.replace(/\r\n/g, '\n').trim();

    if (
      /Alpha Coach online/i.test(raw) &&
      !raw.includes('\n') &&
      raw.length > 80
    ) {
      raw = [
        'Alpha Coach is online.',
        '',
        'I coach from your connected account when data is available.',
        '',
        'Ask about:',
        '• Exposure & correlation',
        '• Gold (XAUUSD) playbooks',
        '• SL / TP placement',
        '• SMC structure & bots',
        '',
        'Need a human? Use Chat with Executive.',
      ].join('\n');
    }

    if (!raw) return [] as Array<{ type: 'p' | 'ul'; lines: string[] }>;

    const parts = raw.split(/\n{2,}/);
    const out: Array<{ type: 'p' | 'ul'; lines: string[] }> = [];

    for (const part of parts) {
      const lines = part
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) continue;

      const bulletish = lines.every((l) =>
        /^([•\-\*]|\d+[\.)])\s+/.test(l),
      );
      if (bulletish) {
        out.push({
          type: 'ul',
          lines: lines.map((l) => l.replace(/^([•\-\*]|\d+[\.)])\s+/, '')),
        });
      } else if (lines.length > 1) {
        for (const line of lines) {
          if (/^([•\-\*]|\d+[\.)])\s+/.test(line)) {
            const last = out[out.length - 1];
            const cleaned = line.replace(/^([•\-\*]|\d+[\.)])\s+/, '');
            if (last?.type === 'ul') last.lines.push(cleaned);
            else out.push({ type: 'ul', lines: [cleaned] });
          } else {
            out.push({ type: 'p', lines: [line] });
          }
        }
      } else {
        out.push({ type: 'p', lines: [lines[0]] });
      }
    }
    return out;
  }, [content]);

  return (
    <div className={cn('space-y-3', className)}>
      {blocks.map((b, i) =>
        b.type === 'ul' ? (
          <ul key={i} className="space-y-1.5">
            {b.lines.map((line, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-wrap break-words">
            {b.lines[0]}
          </p>
        ),
      )}
    </div>
  );
}
