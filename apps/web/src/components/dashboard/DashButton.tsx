'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function DashButton({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost' | 'icon';
}) {
  return (
    <button
      type="button"
      className={cn(
        variant === 'primary' && 'dash-btn-primary',
        variant === 'outline' && 'dash-btn-outline',
        variant === 'ghost' && 'dash-btn-ghost',
        variant === 'icon' && 'dash-btn-icon',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
