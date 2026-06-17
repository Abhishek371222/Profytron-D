'use client';

import { cn } from '@/lib/utils';

interface RegisterPasswordStrengthProps {
  password?: string;
}

export function RegisterPasswordStrength({ password = '' }: RegisterPasswordStrengthProps) {
  const getScore = (pwd: string) => {
    let s = 0;
    if (pwd.length >= 6) s++;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) s++;
    else if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) s++;
    return Math.min(s, 4);
  };

  const score = getScore(password);
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength</span>
        <span
          className={cn(
            'text-xs font-semibold',
            score >= 4 ? 'text-primary' : score >= 2 ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {password ? label : '—'}
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? 'bg-primary' : 'bg-[var(--card-border)]',
            )}
          />
        ))}
      </div>
    </div>
  );
}
