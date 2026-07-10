'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AuthField } from '@/components/auth/AuthField';
import { cn } from '@/lib/utils';

type AuthExperienceFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  showPasswordToggle?: boolean;
};

export const AuthExperienceField = React.forwardRef<HTMLInputElement, AuthExperienceFieldProps>(
  ({ label, icon, error, showPasswordToggle, className, ...props }, ref) => (
    <div className={cn('ax-field', !label && 'ax-field--no-label', className)}>
      {label ? (
        <label htmlFor={props.id} className="ax-field-label">
          {label}
        </label>
      ) : null}
      <AuthField
        ref={ref}
        icon={icon}
        iconPosition="left"
        error={error}
        showPasswordToggle={showPasswordToggle}
        className="ax-field-input-wrap"
        {...props}
      />
    </div>
  ),
);

AuthExperienceField.displayName = 'AuthExperienceField';
