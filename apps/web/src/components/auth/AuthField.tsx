'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  error?: string;
  showPasswordToggle?: boolean;
  iconPosition?: 'left' | 'right';
};

export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    { icon: Icon, error, showPasswordToggle, iconPosition = 'right', className, type, ...props },
    ref,
  ) => {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPasswordToggle && show ? 'text' : type;
    const iconLeft = iconPosition === 'left';

    return (
      <div className={cn('w-full', className)}>
        <div
          className={cn(
            'auth-field-wrap',
            iconLeft && 'auth-field-wrap--icon-left',
            isPassword && showPasswordToggle && 'auth-field-wrap--has-toggle',
          )}
        >
          {Icon && iconLeft && <Icon className="auth-field-icon auth-field-icon--left" aria-hidden />}
          <input
            ref={ref}
            type={inputType}
            className="auth-field-input"
            {...props}
          />
          {Icon && !iconLeft && !showPasswordToggle && (
            <Icon className="auth-field-icon auth-field-icon--right" aria-hidden />
          )}
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              className="auth-field-toggle"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          )}
          {isPassword && !showPasswordToggle && Icon && !iconLeft && (
            <Icon className="auth-field-icon auth-field-icon--right" aria-hidden />
          )}
        </div>
        {error && <p className="auth-field-error">{error}</p>}
      </div>
    );
  },
);

AuthField.displayName = 'AuthField';
