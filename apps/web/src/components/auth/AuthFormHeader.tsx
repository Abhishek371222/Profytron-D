'use client';

import { LucideIcon } from 'lucide-react';

type AuthFormHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
};

export function AuthFormHeader({ icon: Icon, title, subtitle }: AuthFormHeaderProps) {
  return (
    <div className="auth-form-header">
      <div className="auth-form-header-icon">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <h1 className="auth-form-title">{title}</h1>
        <p className="auth-form-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
