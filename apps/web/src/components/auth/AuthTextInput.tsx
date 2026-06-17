'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Check } from 'lucide-react';

interface AuthTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  trailingIcon?: LucideIcon;
  trailingActive?: boolean;
}

export const AuthTextInput = React.forwardRef<HTMLInputElement, AuthTextInputProps>(
  (
    {
      label,
      icon: Icon,
      error,
      trailingIcon: TrailingIcon,
      trailingActive,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          )}
          <input
            {...props}
            id={inputId}
            ref={ref}
            suppressHydrationWarning
            className={cn(
              'h-12 w-full rounded-xl border border-[var(--card-border)] bg-white text-sm text-foreground shadow-sm outline-none transition-colors',
              'placeholder:text-muted-foreground/60',
              'hover:border-primary/25 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
              Icon ? 'pl-11 pr-4' : 'px-4',
              TrailingIcon && 'pr-11',
              error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/10',
              className,
            )}
          />
          {TrailingIcon && (
            <TrailingIcon
              className={cn(
                'pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2',
                trailingActive ? 'text-[var(--success)]' : 'text-muted-foreground/40',
              )}
              aria-hidden
            />
          )}
        </div>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);

AuthTextInput.displayName = 'AuthTextInput';

export function AuthCheckTrailing({ active }: { active?: boolean }) {
  return (
    <Check
      className={cn(
        'pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2',
        active ? 'text-[var(--success)]' : 'text-muted-foreground/30',
      )}
      aria-hidden
    />
  );
}
